import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Functional interceptor that:
 * 1. Attaches Bearer token to API-bound requests
 * 2. Catches 401 responses and triggers logout (except on login endpoint)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only attach token to requests targeting our API
  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Auto-logout on 401, but skip the login endpoint to avoid redirect loops
      if (error.status === 401 && !req.url.endsWith('/api/admin/auth')) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
