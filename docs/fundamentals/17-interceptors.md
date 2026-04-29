# HTTP Interceptors

## What is an interceptor?
An interceptor is a piece of code that sits between your app and the server. Every HTTP request your app sends (or response it receives) passes through the interceptor first.

Think of it like a checkpoint at the door:

```
App → [Interceptor] → Server
App ← [Interceptor] ← Server
```

You use interceptors to do something to **every** request or response — without repeating that code in every service.

---

## Common uses for interceptors
- Add an auth token (JWT) to every request header automatically
- Show a loading spinner when any request is running
- Handle errors globally (e.g., redirect to login on a 401 Unauthorized response)
- Log all API requests and responses
- Add a base URL prefix to every request

---

## Modern interceptors (Angular v15+ — functional style)

This is the recommended way to write interceptors in modern Angular.

### Creating an interceptor

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq); // pass the modified request along
  }

  return next(req); // pass the original request if no token
};
```

### Registering the interceptor in `app.config.ts`

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

---

## Old class-based interceptors (still works)

```typescript
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

---

## Why requests are immutable — why you use `.clone()`
HTTP requests in Angular are immutable (you cannot change them directly). You must clone the request with your changes applied:

```typescript
const modifiedReq = req.clone({
  headers: req.headers.set('Authorization', 'Bearer ' + token),
  url: 'https://api.example.com' + req.url
});
return next(modifiedReq);
```

---

## Error handling interceptor

A common pattern is catching errors globally instead of handling them in every service.

```typescript
// error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']); // redirect when unauthorized
      }
      return throwError(() => error); // re-throw so the service still gets it
    })
  );
};
```

---

## Multiple interceptors
You can register multiple interceptors. They run in the order listed:

```typescript
provideHttpClient(
  withInterceptors([
    authInterceptor,    // runs first — adds token
    loggingInterceptor, // runs second — logs request
    errorInterceptor    // runs third — handles errors
  ])
)
```

---

## Why it matters
- Write auth token logic once instead of in every service
- Handle errors globally without try/catch everywhere
- Clean, centralized place for cross-cutting concerns (auth, logging, loading)

## Quick memory line
Interceptor = middleware that runs automatically on every HTTP request and response.

## Common mistakes
- Forgetting to call `next(req)` — the request never reaches the server
- Mutating the request directly instead of using `.clone()`
- Adding the interceptor function but forgetting to register it in `provideHttpClient()`
- Using `inject()` outside the interceptor function body — it must be inside the function
