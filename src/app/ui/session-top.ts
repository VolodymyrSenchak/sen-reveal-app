import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ConnectionState } from '../session/session.transport';
import { ConnectionBannerComponent } from './connection-banner';
import { IconComponent } from './icon';

/**
 * The strip every in-session screen starts with: code, where we are, the menu,
 * then the connection banner and whatever the last failed action had to say.
 */
@Component({
  selector: 'app-session-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ConnectionBannerComponent],
  template: `
    <div class="session-head">
      <div class="session-head__meta">
        <span class="session-head__code">{{ code() }}</span>
        <span class="session-head__sep"></span>
        <span>{{ subtitle() }}</span>
      </div>
      <button
        type="button"
        class="icon-btn top__menu"
        aria-label="Session menu"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <app-icon name="more" [size]="19" />
      </button>
    </div>

    @if (open()) {
      <div class="top__sheet">
        <button type="button" class="top__item" (click)="copy()">
          <app-icon name="copy" [size]="17" [width]="2.2" />
          {{ copied() ? 'Link copied' : 'Copy the join link' }}
        </button>
        <button type="button" class="top__item top__item--leave" (click)="open.set(false); exit.emit()">
          <app-icon name="x" [size]="17" [width]="2.2" />
          Leave the session
        </button>
      </div>
    }

    <app-connection-banner [state]="banner()" [pollIntervalMs]="pollIntervalMs()" />

    @if (toast(); as message) {
      <p class="toast" role="status">{{ message }}</p>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .top__menu {
      margin-right: -10px;
      color: var(--muted);
    }

    .top__sheet {
      display: flex;
      flex-direction: column;
      border: 1.5px solid var(--line);
      border-radius: var(--r-field);
      background: var(--card);
      overflow: hidden;
    }

    .top__item {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: var(--tap);
      padding: 0 16px;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 14.5px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
    }

    .top__item + .top__item {
      border-top: 1px solid var(--chip);
    }

    .top__item--leave {
      color: var(--worst);
    }
  `,
})
export class SessionTopComponent {
  readonly code = input.required<string>();
  readonly subtitle = input('');
  readonly banner = input.required<ConnectionState>();
  readonly pollIntervalMs = input(1500);
  readonly toast = input<string | null>(null);

  readonly exit = output<void>();

  protected readonly open = signal(false);
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    const link = `${location.origin}/join?code=${this.code()}`;
    try {
      await navigator.clipboard.writeText(link);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* clipboard is blocked in some webviews; the code is on screen anyway */
    }
  }
}
