import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SMS } from './SMS';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class TwilioService {

  constructor(private http: HttpClient) { }

  sendSMS(sms : SMS): Observable<SMS> {
    return this.http.post<SMS>(`${environment.api}/api/sendSMS`, sms);
  }
}
