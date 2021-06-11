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

export interface FilesAndProgress {
  fileName: string,
  file: File,
  progress$: BehaviorSubject<number>,
  index: number
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

  constructor(private fb: FormBuilder,
              private ocr: OcrService,
              private signalR: SignalRService,
              private cfr: ComponentFactoryResolver) { }

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
    console.log("Sending request");

    if (this.form.invalid) {
      this.submitted = true;

      Object.keys(this.form.controls).forEach(field => {
        this.form.get(field).markAsTouched({onlySelf: true});
      })
    } else {
      this.submitted = false;

      if (this.signalR.connectionId !== undefined && this.signalR.connectionId !== null && this.FilesContainer.length > 0) {
        this.sendSynchronously(0);
      }
    }
  }

  sendSynchronously(index: number): void {
    this.ocr.SendPdfFile(this.FilesContainer[index].file, this.signalR.connectionId).subscribe({
      next: result => {
        if (result.type === HttpEventType.UploadProgress) {
          this.FilesContainer[index].progress$.next(Math.round(100 * result.loaded / result.total));
        } else if (result instanceof HttpResponse) {
          console.log(`Finished loading: ${this.FilesContainer[index].fileName}`);

          if (index < this.FilesContainer.length - 1 ) {
            index++;
            this.sendSynchronously(index);
          }
        }
      }
    });
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
          index: index
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
}
