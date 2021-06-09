import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams, HttpResponse} from "@angular/common/http";
import {Observable, ObservableInput} from "rxjs";
import {ErrorResponse} from "../interfaces/errorResponse";
import {Urls} from "../urls";

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  errorResponse: ErrorResponse;
  constructor(private httpClient: HttpClient) { }

  SendPdfFiles(files: FormData, connectionId: string): Observable<any> {
    return this.httpClient.post<HttpResponse<Observable<ErrorResponse>>>(Urls.SendFiles, files, {
      params: new HttpParams().set('connectionId', connectionId),
      observe: 'response',
      responseType: 'json'
    })
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.message);

      this.errorResponse.detail = error.message;
    } else {
      console.error(
        `Backend returned code ${error.status},\n` +
        `Returned body was: ${JSON.stringify(error.error)},\n` +
        `Error message: ${error.message}`);

      this.errorResponse = error.error;
    }
  }
}
