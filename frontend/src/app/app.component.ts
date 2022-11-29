import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SMS } from './SMS';
import { TwilioService } from './twilio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnInit{
  title = 'frontend';
  from = '';
  to : string = '';
  body : string = '';
  sms : SMS | undefined ;
  constructor(private service :TwilioService) {

  }

  ngOnInit() : void{

  }
  
  SendSMS() {
    if(this.from != null || this.to != null || this.body != null){
      this.sms.from = this.from;
      this.sms.to = this.to;
      this.sms.body = this.body;
  
      this.service.sendSMS(this.sms).subscribe(
        (response: any) => {
          console.log(response)
        },
        (error: HttpErrorResponse) => {
          alert(error.message);
        }
      );
    }
  }

}
