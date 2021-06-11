import { Injectable } from '@angular/core';
import * as sr from '@aspnet/signalr';
import {BehaviorSubject, from, Observable, of, Subject} from "rxjs";
import {delay} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  connection: sr.HubConnection;
  private _convertedFiles: string;
  convertedFiles: Subject<string>;
  public connectionId: string;
  public connected = false;

  constructor() {
    this.connection = new sr.HubConnectionBuilder()
      .withUrl('https://localhost:5001/notify')
      .build();

    this.connection.onclose(() => {
      this.connected = false;
    });

    this.convertedFiles = new Subject();
    this._convertedFiles = '';
  }

  connect(): void {
    this.connection.start()
      .then(() => {
        console.log("Connection established");
        this.connected = true;
      })
      .then(() => this.getConnectionId())
      .then(() => this.listenToChanges())
      .catch(err => console.log("Error while connecting"));
  }

  listenToChanges(): void {
    this.connection.on('BroadcastMessage', data => {
      console.log(`data: ${data}`);
      // this._convertedFiles.push(data);
      this.convertedFiles.next(data);
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
