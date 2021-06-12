import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {BehaviorSubject, from, observable, Observable, of} from "rxjs";
import {delay, map} from "rxjs/operators";
import {OcrService} from "../services/ocr.service";
import {SignalRService} from "../services/signal-r.service";
import {PdfFileComponent} from "../pdf-file/pdf-file.component";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {waitForAsync} from "@angular/core/testing";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CustomSnackBarComponent} from "../custom-snack-bar/custom-snack-bar.component";

export interface FilesAndProgress {
  fileName: string,
  file: File,
  progress$: BehaviorSubject<number>,
  index: number,
  parsingStarted: boolean,
  parsed: boolean,
  url: string
}

@Component({
  selector: 'app-pdf-send-form',
  templateUrl: './pdf-send-form.component.html',
  styleUrls: ['./pdf-send-form.component.css']
})
export class PdfSendFormComponent implements OnInit {
  public form: FormGroup;
  public submitted = false;
  public signalRS: SignalRService;
  public FilesContainer: FilesAndProgress[] = [];
  @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;
  public fileComponents: ComponentRef<PdfFileComponent>[] = [];
  @ViewChild('file', {read: ElementRef}) file: ElementRef;
  public parsing = false;
  private stopParsing = false;

  constructor(private fb: FormBuilder,
              private ocr: OcrService,
              private signalR: SignalRService,
              private cfr: ComponentFactoryResolver,
              private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      files: [
        null,
        [Validators.required]
      ]
    });

    this.signalR.connect();

    this.signalRS = this.signalR;
  }

  async onSubmit(): Promise<void> {
    console.log(`Number of files: ${this.FilesContainer.length}`);
    this.parsing = true;
    console.log("Sending request");

    if (this.form.invalid) {
      this.submitted = true;

      Object.keys(this.form.controls).forEach(field => {
        this.form.get(field).markAsTouched({onlySelf: true});
      })
    } else {
      this.submitted = false;

      if (this.signalR.connectionId !== undefined && this.signalR.connectionId !== null && this.FilesContainer.length > 0) {
        /*this.FilesContainer.forEach(pdfFileComponent => {
          this.ocr.SendPdfFile(pdfFileComponent.file, this.signalR.connectionId).subscribe({
            next: result => {
              if (result.type === HttpEventType.UploadProgress) {
                pdfFileComponent.progress$.next(Math.round(100 * result.loaded / result.total));
              } else if (result instanceof HttpResponse) {
                console.log(`Finished loading: ${pdfFileComponent.fileName}`);
              }
            }
          });
        });*/

        this.sendSynchronously(0);
      }
    }

  }

  sendSynchronously(index: number): void {
    if (!this.FilesContainer[index].parsed)
    {
      this.ocr.SendPdfFile(this.FilesContainer[index].file, this.signalR.connectionId).subscribe({
        next: result => {
          if (result.type === HttpEventType.UploadProgress) {
            this.FilesContainer[index].progress$.next(Math.round(100 * result.loaded / result.total));
            console.log(`${result.loaded} / ${result.total}`);
            if (result.loaded === result.total) {
              console.log(`Finished loading: ${this.FilesContainer[index].fileName}`);
              this.FilesContainer[index].parsingStarted = true;
            }
          } else if (result instanceof HttpResponse) {
            if (index < this.FilesContainer.length - 1 ) {
              if (this.stopParsing) {
                this.stopParsing = false;
                this.parsing = false;
                this.FilesContainer[index].progress$.next(0);
                this.FilesContainer[index].parsed = false;
                this.FilesContainer[index].url = null;
                this.FilesContainer[index].parsingStarted = false;
                return;
              } else {
                index++;
                return this.sendSynchronously(index);
              }
            } else {
              if (this.stopParsing) {
                this.FilesContainer[index].progress$.next(0);
                this.FilesContainer[index].parsed = false;
                this.FilesContainer[index].url = null;
                this.FilesContainer[index].parsingStarted = false;
              }
              this.stopParsing = false;
              this.parsing = false;
            }
          }
        }
      });
    } else if (index < this.FilesContainer.length - 1 ) {
      index++;
      return this.sendSynchronously(index);
    }
  }

  onSelect(event): void {
    if (event.target.files && event.target.files.length > 0) {
      console.log(`Files count: ${Object.keys(event.target.files).length}`);
      let index = 0;
      Object.keys(event.target.files).forEach(key => {
        const tmp: FilesAndProgress = {
          fileName: event.target.files[key].name,
          progress$: new BehaviorSubject<number>(0),
          file: event.target.files[key],
          index: index,
          parsingStarted: false,
          parsed: false,
          url: null
        }

        this.FilesContainer.push(tmp);

        const pdfFileComponentFactory = this.cfr.resolveComponentFactory(PdfFileComponent);
        const pdfFileComponent = this.container.createComponent(pdfFileComponentFactory);
        pdfFileComponent.instance.fileData = tmp;
        pdfFileComponent.instance.onClose.subscribe(() => this.onClosePdfFile(pdfFileComponent));
        this.fileComponents.push(pdfFileComponent);
        index++;
      });

      let fileNames: string[] = [];
      from(event.target.files).pipe(
        map(({name}) => name)
      ).subscribe(result => {
        fileNames.push(result);
      });

      this.file.nativeElement.value = null;
    }
  }

  onClosePdfFile(component: ComponentRef<PdfFileComponent>): void {
    console.log(`Components count: ${this.fileComponents.length}`);
    const index = this.fileComponents.indexOf(component);
    this.fileComponents[index].destroy();
    this.fileComponents.splice(index, 1);
    this.FilesContainer.splice(index, 1);
  }

  onClear(): void {
    for (let i = this.fileComponents.length - 1; i >= 0; i--) {
      this.fileComponents[i].destroy();
      this.fileComponents.splice(i, 1);
      this.FilesContainer.splice(i, 1);
    }
  }

  onStop(): void {
    this.stopParsing = true;
    this.parsing = false;
    this.signalRS.stopConversion()
      .then(value => {
        this.snackBar.openFromComponent(CustomSnackBarComponent, {
          duration: 3000,
          panelClass: 'snack-bar-green',
          data: {
            message: 'PDF conversion was cancelled'
          }
        })
      })
      .catch(err => {
        console.log(`Err: ${err}`);
        this.snackBar.openFromComponent(CustomSnackBarComponent, {
          duration: 3000,
          panelClass: 'snack-bar-red',
          data: {
            message: 'Cancellation did not succeed'
          }
        })
      })
  }
}
