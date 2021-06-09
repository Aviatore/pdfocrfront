import { Injectable } from '@angular/core';
import * as sr from '@aspnet/signalr';
import {BehaviorSubject, from, Observable, of} from "rxjs";
import {delay} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  connection: sr.HubConnection;
  private _convertedFiles: string[];
  convertedFiles: BehaviorSubject<string[]>;
  public connectionId: string;

  constructor() {
    this.connection = new sr.HubConnectionBuilder()
      .withUrl('https://localhost:5001/notify')
      .build();

    this.convertedFiles = new BehaviorSubject<string[]>([]);
    this._convertedFiles = [];
  }

  connect(): void {
    this.connection.start()
      .then(() => console.log("Connection established"))
      .then(() => this.getConnectionId())
      .then(() => this.listenToChanges())
      .catch(err => console.log("Error while connecting"));
  }

  listenToChanges(): void {
    this.connection.on('BroadcastMessage', data => {
      console.log(`data: ${data}`);
      this._convertedFiles.push(data);
      this.convertedFiles.next(this._convertedFiles);
    })
  }

  close(): void {
    this.connection
      .stop()
      .then(() => {
        console.log("Connection closed");
      });
  }

  getConnectionId(): void {
    this.connection.invoke("GetConnectionId")
      .then(value => {
        console.log(`ConnectionId: ${value}`);
        this.connectionId = value;
      })
      .catch(err => console.log(`Error while getting connectionId: ${err}`));
  }
}
