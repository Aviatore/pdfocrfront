import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {FilesAndProgress} from "../pdf-send-form/pdf-send-form.component";
import {SignalRService} from "../services/signal-r.service";

@Component({
  selector: 'app-pdf-file',
  templateUrl: './pdf-file.component.html',
  styleUrls: ['./pdf-file.component.css']
})
export class PdfFileComponent implements OnInit {
  @Input() fileData: FilesAndProgress;
  @Output() onClose: EventEmitter<number> = new EventEmitter<number>();
  public sr: SignalRService;

  constructor(private signalRService: SignalRService) { }

  ngOnInit(): void {
    this.sr = this.signalRService;
    this.sr.convertedFiles.subscribe({
      next: value => {
        const valueSplitted = value.split(':');
        if (valueSplitted[valueSplitted.length - 1] === this.fileData.fileName) {
          valueSplitted.splice(valueSplitted.length - 1, 1);
          this.fileData.url = valueSplitted.join(':');
          this.fileData.parsed = true;
        } else {
          // console.log(`second param: ${value.split(':')[1]}`);
        }
      }
    })
  }
}
