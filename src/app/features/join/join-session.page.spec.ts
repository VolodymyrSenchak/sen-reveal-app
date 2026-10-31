import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../core/api.config';
import { JoinSessionPage } from './join-session.page';

describe('JoinSessionPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'join', component: JoinSessionPage }], withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: 'http://localhost:8080' } },
      ],
    });
  });

  const open = async (url: string) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, JoinSessionPage);
    return harness.routeNativeElement as HTMLElement;
  };

  const digits = (page: HTMLElement) =>
    Array.from(page.querySelectorAll<HTMLInputElement>('.join__digit')).map((input) => input.value);

  // the router binds an absent query param as undefined, over any default on the input
  it('renders the code boxes and the button without a ?code', async () => {
    const page = await open('/join');

    expect(digits(page)).toEqual(['', '', '', '', '', '']);
    expect(page.querySelector('button[type="submit"]')?.textContent).toContain('Join the session');
  });

  it('prefills the code from the shared link', async () => {
    const page = await open('/join?code=042137');

    expect(digits(page)).toEqual(['0', '4', '2', '1', '3', '7']);
  });
});
