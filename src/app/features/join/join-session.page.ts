import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, signal, untracked, viewChildren } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessage, toApiError } from '../../core/api-error';
import { gameTitle } from '../../core/games';
import { IdentityService } from '../../core/identity.service';
import { SessionApiService } from '../../core/session-api.service';
import { NICKNAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, SessionInfo } from '../../models';
import { IconComponent } from '../../ui/icon';
import { PageHeaderComponent } from '../../ui/page-header';

const CODE_LENGTH = 6;

/** JoinSession.dc.html. `/join?code=042137` is the shareable link, so the code prefills. */
@Component({
  selector: 'app-join-session',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, IconComponent, PageHeaderComponent],
  template: `
    <form class="screen" (submit)="submit($event)">
      <app-page-header step="Join a room" backTo="/" backLabel="Back to home" />

      <div class="stack">
        <h1 class="join__title">Got a code?</h1>
        <p class="join__lede">Six digits from whoever started the game. Leading zeros count.</p>
      </div>

      <div class="stack join__codeBlock">
        <label class="label" for="code-0">Session code</label>
        <div class="join__digits">
          @for (digit of digits(); track $index) {
            <input
              #digitInput
              class="join__digit"
              [class.join__digit--filled]="digit !== ''"
              [class.join__digit--invalid]="codeError() !== null"
              [id]="'code-' + $index"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="1"
              [attr.aria-label]="'Code digit ' + ($index + 1)"
              [value]="digit"
              (input)="onDigit($index, $event)"
              (keydown)="onDigitKey($index, $event)"
              (paste)="onPaste($event)"
            />
          }
        </div>
        @if (codeError(); as message) {
          <span class="field-error">{{ message }}</span>
        } @else if (info(); as room) {
          <div class="join__found">
            <app-icon name="check" [size]="15" [width]="2.4" />
            <span>{{ gameLabel(room) }} · {{ room.playerCount }} of {{ room.maxPlayers }} inside</span>
          </div>
        } @else if (looking()) {
          <span class="hint">Looking for that room…</span>
        }
      </div>

      <div class="stack">
        <label class="label" for="joinnick">Your nickname</label>
        <input
          id="joinnick"
          class="input"
          type="text"
          autocomplete="nickname"
          [class.input--invalid]="nicknameError() !== null || nicknameServerError() !== null"
          [formField]="f.nickname"
        />
        @if (nicknameError(); as message) {
          <span class="field-error">{{ message }}</span>
        } @else if (nicknameServerError(); as message) {
          <span class="field-error">{{ message }}</span>
        }
      </div>

      @if (info()?.requiresPassword) {
        <div class="stack">
          <div class="join__lockRow">
            <app-icon name="lock" [size]="15" [width]="2.2" class="join__lockIcon" />
            <label class="label" for="joinpass">This room is locked</label>
          </div>
          <input
            id="joinpass"
            class="input input--mono"
            type="password"
            autocomplete="current-password"
            [class.input--invalid]="passwordError() !== null"
            [formField]="f.password"
          />
          @if (passwordError(); as message) {
            <span class="field-error">{{ message }}</span>
          }
        </div>
      }

      @if (toast(); as message) {
        <p class="toast toast--error" role="alert">{{ message }}</p>
      }

      <div class="spacer"></div>

      <button class="btn btn--primary" type="submit" [disabled]="busy()">
        {{ busy() ? 'Joining…' : 'Join the session' }}
      </button>
      <p class="footnote">
        You can walk in after the game has already started — you'll be dealt into the current circle.
      </p>
    </form>
  `,
  styles: `
    .join__title {
      font-size: 32px;
      letter-spacing: -0.9px;
    }

    .join__lede {
      font-size: 15px;
      line-height: 1.45;
      color: var(--muted);
    }

    .join__codeBlock {
      gap: 10px;
    }

    .join__digits {
      display: flex;
      gap: 8px;
    }

    .join__digit {
      width: 100%;
      min-width: 0;
      height: 68px;
      padding: 0;
      text-align: center;
      border-radius: var(--r-field);
      background: var(--card);
      border: 1.5px solid var(--line-strong);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 26px;
      font-weight: 700;
    }

    .join__digit--filled {
      border-color: var(--go);
      border-width: 2px;
    }

    .join__digit--invalid {
      border-color: var(--worst);
    }

    .join__found {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: var(--go);
    }

    .join__lockRow {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .join__lockIcon {
      color: var(--muted);
    }
  `,
})
export class JoinSessionPage {
  private readonly api = inject(SessionApiService);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  /** `withComponentInputBinding()` hands us `?code=042137` straight from the query string. */
  readonly code = input<string>('');


  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

  protected readonly digits = signal<string[]>(Array<string>(CODE_LENGTH).fill(''));
  protected readonly info = signal<SessionInfo | null>(null);
  protected readonly looking = signal(false);
  protected readonly busy = signal(false);
  protected readonly codeError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly nicknameServerError = signal<string | null>(null);
  protected readonly toast = signal<string | null>(null);

  protected readonly joined = computed(() => this.digits().join(''));

  private readonly model = signal({ nickname: this.identity.lastNickname(), password: '' });

  protected readonly f = form(this.model, (path) => {
    required(path.nickname, { message: 'Pick a nickname first.' });
    maxLength(path.nickname, NICKNAME_MAX_LENGTH, {
      message: `Nicknames stop at ${NICKNAME_MAX_LENGTH} characters.`,
    });
    maxLength(path.password, PASSWORD_MAX_LENGTH);
  });

  protected readonly nicknameError = computed(() => {
    const field = this.f.nickname();
    return field.touched() ? (field.errors()[0]?.message ?? null) : null;
  });

  constructor() {
    // prefill from the shared link, once
    effect(() => {
      const prefill = this.code().replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (!prefill) {
        return;
      }
      untracked(() => this.setCode(prefill));
    });

    // look the room up as soon as six digits are in; that is what shows the password field
    effect((onCleanup) => {
      const code = this.joined();
      if (code.length < CODE_LENGTH) {
        untracked(() => {
          this.info.set(null);
          this.looking.set(false);
        });
        return;
      }
      untracked(() => {
        this.looking.set(true);
        this.codeError.set(null);
      });
      let cancelled = false;
      onCleanup(() => (cancelled = true));
      void this.lookup(code, () => cancelled);
    });
  }

  protected gameLabel(info: SessionInfo): string {
    return gameTitle(info.gameType);
  }

  protected onDigit(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    input.value = value;
    this.digits.update((current) => current.map((digit, i) => (i === index ? value : digit)));
    if (value && index < CODE_LENGTH - 1) {
      this.focusDigit(index + 1);
    }
  }

  protected onDigitKey(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      event.preventDefault();
      this.digits.update((current) => current.map((digit, i) => (i === index - 1 ? '' : digit)));
      this.focusDigit(index - 1);
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusDigit(index - 1);
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      this.focusDigit(index + 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    if (!pasted) {
      return;
    }
    event.preventDefault();
    this.setCode(pasted.slice(0, CODE_LENGTH));
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.f().markAsTouched();
    this.toast.set(null);
    this.passwordError.set(null);
    this.nicknameServerError.set(null);

    const code = this.joined();
    if (code.length < CODE_LENGTH) {
      this.codeError.set('Six digits, please.');
      return;
    }
    if (this.f().invalid() || this.busy()) {
      return;
    }

    const { nickname, password } = this.model();
    this.busy.set(true);
    try {
      const result = await firstValueFrom(
        this.api.join(code, { nickname: nickname.trim(), ...(password ? { password } : {}) }),
      );
      this.identity.save({
        code: result.session.code,
        playerId: result.playerId,
        playerToken: result.playerToken,
        nickname: result.session.me.nickname,
      });
      await this.router.navigate(['/s', result.session.code]);
    } catch (error) {
      this.showJoinError(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async lookup(code: string, cancelled: () => boolean): Promise<void> {
    try {
      const info = await firstValueFrom(this.api.info(code));
      if (cancelled()) {
        return;
      }
      this.info.set(info);
      this.codeError.set(info.joinable ? null : this.notJoinableReason(info));
    } catch (error) {
      if (cancelled()) {
        return;
      }
      this.info.set(null);
      this.codeError.set(errorMessage(toApiError(error)));
    } finally {
      if (!cancelled()) {
        this.looking.set(false);
      }
    }
  }

  private notJoinableReason(info: SessionInfo): string {
    if (info.playerCount >= info.maxPlayers) {
      return `Room is full — ${info.playerCount} of ${info.maxPlayers}.`;
    }
    if (info.status === 'finished') {
      return 'That game is already over.';
    }
    return 'That room is not taking anyone new.';
  }

  private showJoinError(error: ReturnType<typeof toApiError>): void {
    const message = errorMessage(error);
    switch (error.code) {
      case 'nickname-taken':
        this.nicknameServerError.set(message);
        return;
      case 'unauthorized':
        this.passwordError.set(message);
        return;
      case 'not-found':
      case 'gone':
      case 'session-full':
      case 'session-finished':
        this.codeError.set(message);
        return;
      default:
        this.toast.set(message);
    }
  }

  private setCode(code: string): void {
    const next = Array<string>(CODE_LENGTH).fill('');
    for (let i = 0; i < code.length && i < CODE_LENGTH; i++) {
      next[i] = code[i];
    }
    this.digits.set(next);
    this.focusDigit(Math.min(code.length, CODE_LENGTH - 1));
  }

  private focusDigit(index: number): void {
    queueMicrotask(() => {
      const input = this.inputs()[index]?.nativeElement;
      input?.focus();
      input?.select();
    });
  }
}
