import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private customerEmail: string = '';

  setCustomerEmail(email: string) {
    this.customerEmail = email;
  }

  getCustomerEmail(): string {
    return this.customerEmail;
  }
}