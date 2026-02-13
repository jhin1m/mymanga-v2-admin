import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Standard API response shape from the backend */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthToken {
  token: string;
  type: 'Bearer';
}

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenSignal = signal<string | null>(this.getToken());

  /** Reactive check — components can bind to this */
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http
      .post<ApiResponse<AuthToken>>(`${environment.apiUrl}/api/admin/auth`, { email, password })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.setToken(res.data.token);
          }
        }),
      );
  }

  logout(): void {
    // Fire-and-forget DELETE to revoke server token
    const token = this.getToken();
    if (token) {
      this.http
        .delete(`${environment.apiUrl}/api/admin/auth`)
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }
    this.removeToken();
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${environment.apiUrl}/api/admin/auth`);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }
}
