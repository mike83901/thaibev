import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Screen = 'login' | 'register' | 'welcome';
interface AuthResponse {
  token: string;
  username: string;
}
interface ErrorResponse {
  message?: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/auth';
  protected readonly screen = signal<Screen>('login');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  constructor() {
    const token = localStorage.getItem('example-com-token');
    if (token) {
      this.http
        .get<{
          username: string;
        }>(`${this.apiUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .subscribe({
          next: (response) => {
            this.username.set(response.username);
            this.screen.set('welcome');
          },
          error: () => localStorage.removeItem('example-com-token'),
        });
    }
  }

  protected showRegister(): void {
    this.clearFeedback();
    this.password.set('');
    this.confirmPassword.set('');
    this.screen.set('register');
  }
  protected showLogin(): void {
    this.clearFeedback();
    this.password.set('');
    this.confirmPassword.set('');
    this.screen.set('login');
  }

  protected register(): void {
    this.clearFeedback();
    if (!this.username().trim() || !this.password() || this.password() !== this.confirmPassword()) {
      this.error.set('กรุณากรอกข้อมูลให้ครบ และ Password ต้องเหมือน Confirm Password');
      return;
    }
    this.busy.set(true);
    this.http
      .post(`${this.apiUrl}/register`, {
        username: this.username(),
        password: this.password(),
        confirmPassword: this.confirmPassword(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.message.set('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
          this.password.set('');
          this.confirmPassword.set('');
          this.screen.set('login');
        },
        error: (error) => this.handleError(error),
      });
  }

  protected login(): void {
    this.clearFeedback();
    if (!this.username().trim() || !this.password()) {
      this.error.set('กรุณากรอก User และ Password');
      return;
    }
    this.busy.set(true);
    this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, {
        username: this.username(),
        password: this.password(),
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('example-com-token', response.token);
          this.username.set(response.username);
          this.password.set('');
          this.busy.set(false);
          this.screen.set('welcome');
        },
        error: (error) => this.handleError(error),
      });
  }

  protected logout(): void {
    localStorage.removeItem('example-com-token');
    this.username.set('');
    this.password.set('');
    this.screen.set('login');
    this.clearFeedback();
  }

  private handleError(error: HttpErrorResponse): void {
    this.busy.set(false);
    this.error.set(
      (error.error as ErrorResponse)?.message ?? 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง',
    );
  }

  private clearFeedback(): void {
    this.message.set('');
    this.error.set('');
  }
}
