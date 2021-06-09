import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {FilesAndProgress} from "../pdf-send-form/pdf-send-form.component";

@Component({
  selector: 'app-pdf-file',
  templateUrl: './pdf-file.component.html',
  styleUrls: ['./pdf-file.component.css']
})
export class PdfFileComponent implements OnInit {
  @Input() fileData: FilesAndProgress;
  @Output() onClose: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {

  }
}
