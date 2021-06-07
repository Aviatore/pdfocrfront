import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {BehaviorSubject, from, Observable, of} from "rxjs";
import {map} from "rxjs/operators";
import {OcrService} from "../services/ocr.service";

@Component({
  selector: 'app-pdf-send-form',
  templateUrl: './pdf-send-form.component.html',
  styleUrls: ['./pdf-send-form.component.css']
})
export class PdfSendFormComponent implements OnInit {
  public form: FormGroup;
  public selectedFiles: BehaviorSubject<string[]>;
  public selectedFiles2: Observable<string[]>;
  public submitted = false;
  public formData: FormData;
  constructor(private fb: FormBuilder,
              private ocr: OcrService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      files: [
        null,
        [Validators.required]
      ]
    });

    this.selectedFiles = new BehaviorSubject<string[]>([]);

    this.formData = new FormData();
  }

  onSubmit(): void {
    console.log("Sending request");
    if (this.form.invalid) {
      this.submitted = true;

      Object.keys(this.form.controls).forEach(field => {
        this.form.get(field).markAsTouched({onlySelf: true});
      })
    } else {
      this.submitted = false;

      this.ocr.SendPdfFiles(this.formData).subscribe({
        next: result => {
          console.log(`Response body: ${JSON.stringify(result.body)}`);
        }
      });
    }
  }

  onSelect(event): void {
    if (event.target.files && event.target.files.length > 0) {
      let fileNames: string[] = [];
      from(event.target.files).pipe(
        map(({name}) => name)
      ).subscribe(result => {
        fileNames.push(result);
      });
      this.selectedFiles.next(fileNames);

      this.formData.delete('file');
      Object.keys(event.target.files).forEach(key => {
        console.log(`Key: ${key}`);
        this.formData.append('file', event.target.files[key]);
      })

      console.log(JSON.stringify(this.formData.getAll('file')))
    }
  }
}
