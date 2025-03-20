import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };
  error = '';

  constructor(private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = ''; // Clear previous error message
    try {
      if (
        this.credentials.email === 'admin@admin.com' &&
        this.credentials.password === 'admin123'
      ) {
        // Simulating successful admin login
        this.router.navigate(['/admin']);
      } else if (
        (this.credentials.email === 'customer12@gmail.com' &&
          this.credentials.password === 'customer12') ||
        (this.credentials.email === 'customer123@gmail.com' &&
          this.credentials.password === 'customer123')
      ) {
        // Simulating successful customer login
        this.router.navigate(['/customer']);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      this.error = 'Invalid email or password';
    }
  }
}