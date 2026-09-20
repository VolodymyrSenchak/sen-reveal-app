import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environment';
import { APP_CONFIG } from './core/api.config';
import { tokenInterceptor } from './core/token.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Angular 22 is zoneless by default: a signal write updates the view wherever it happens,
    // including inside a Socket.IO callback, with no NgZone.run wrapper.
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    { provide: APP_CONFIG, useValue: { apiUrl: environment.apiUrl.replace(/\/$/, '') } },
  ],
};
