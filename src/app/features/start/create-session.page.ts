import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessage, toApiError } from '../../core/api-error';
import { IdentityService } from '../../core/identity.service';
import { SessionApiService } from '../../core/session-api.service';
import { MAX_PLAYERS, MIN_PLAYERS, NICKNAME_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '../../models';
import { PageHeaderComponent } from '../../ui/page-header';

/** CreateSession.dc.html */
@Component({
  selector: 'app-create-session',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, PageHeaderComponent],
  template: `
    <form class="screen" (submit)="submit($event)">
      <app-page-header step="Step 2 of 2" backTo="/start" backLabel="Back to game choice" />

      <div class="stack">
        <h1 class="create__title">Set up the room</h1>
        <p class="create__lede">Phrase Expose · you'll be the host and get the six-digit code on the next screen.</p>
      </div>

      <div class="stack">
        <label class="label" for="nickname">Your nickname</label>
        <input
          id="nickname"
          class="input"
          type="text"
          autocomplete="nickname"
          [class.input--invalid]="nicknameError() || serverError() === 'nickname'"
          [formField]="f.nickname"
        />
        @if (nicknameError(); as message) {
          <span class="field-error">{{ message }}</span>
        } @else if (serverError() === 'nickname') {
          <span class="field-error">{{ errorText() }}</span>
        } @else {
          <span class="hint">Up to {{ nicknameMax }} characters. Has to be free among the people currently online.</span>
        }
      </div>

      <div class="card card--quiet create__block">
        <div class="create__row">
          <div class="create__rowText">
            <div class="create__rowTitle">Lock with a password</div>
            <div class="hint">Optional. Codes are short — a password keeps strangers out.</div>
          </div>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="usePassword()"
            aria-label="Lock with a password"
            class="toggle"
            [class.toggle--on]="usePassword()"
            (click)="usePassword.set(!usePassword())"
          >
            <span class="toggle__knob"></span>
          </button>
        </div>
        @if (usePassword()) {
          <div class="stack">
            <label class="label" for="roompass">Room password</label>
            <input
              id="roompass"
              class="input input--mono create__pass"
              type="password"
              autocomplete="new-password"
              [formField]="f.password"
            />
          </div>
        }
      </div>

      <div class="create__settings">
        <div class="create__row create__row--boxed">
          <div class="create__rowText">
            <div class="create__rowTitle">Max players</div>
            <div class="hint">Minimum {{ minPlayers }} to start a round.</div>
          </div>
          <div class="stepper">
            <button type="button" class="stepper__btn" aria-label="Fewer players" (click)="stepPlayers(-1)">−</button>
            <span class="mono stepper__value" aria-live="polite">{{ f.maxPlayers().value() }}</span>
            <button type="button" class="stepper__btn" aria-label="More players" (click)="stepPlayers(1)">+</button>
          </div>
        </div>

        <div class="create__row create__row--boxed">
          <div class="create__rowText">
            <div class="create__rowTitle">Let latecomers in</div>
            <div class="hint">They join the circle already running.</div>
          </div>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="f.allowJoinInProgress().value()"
            aria-label="Let latecomers in"
            class="toggle"
            [class.toggle--on]="f.allowJoinInProgress().value()"
            (click)="f.allowJoinInProgress().value.set(!f.allowJoinInProgress().value())"
          >
            <span class="toggle__knob"></span>
          </button>
        </div>
      </div>

      @if (serverError() === 'toast') {
        <p class="toast toast--error" role="alert">{{ errorText() }}</p>
      }

      <div class="spacer"></div>

      <button class="btn btn--primary" type="submit" [disabled]="busy()">
        {{ busy() ? 'Creating…' : 'Create the session' }}
      </button>
      <p class="footnote">The room stays open for 24 hours, then the code dies.</p>
    </form>
  `,
  styles: `
    .create__title {
      font-size: 32px;
      letter-spacing: -0.9px;
    }

    .create__lede {
      font-size: 15px;
      line-height: 1.45;
      color: var(--muted);
    }

    .create__block {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .create__settings {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .create__row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .create__row--boxed {
      padding: 14px 16px;
      border-radius: var(--r-field);
      background: var(--field);
      border: 1.5px solid var(--line);
    }

    .create__rowText {
      flex-grow: 1;
    }

    .create__rowTitle {
      font-size: 15px;
      font-weight: 600;
    }

    .create__pass {
      height: 52px;
      border-radius: 14px;
      background: var(--card);
    }

    .toggle {
      width: 56px;
      height: 32px;
      flex-shrink: 0;
      border-radius: var(--r-pill);
      border: none;
      background: var(--chip);
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      cursor: pointer;
      transition: background var(--t-quick) ease;
    }

    .toggle--on {
      background: var(--go);
      justify-content: flex-end;
    }

    .toggle__knob {
      width: 26px;
      height: 26px;
      border-radius: var(--r-pill);
      background: var(--room);
      display: block;
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stepper__btn {
      width: var(--tap);
      height: var(--tap);
      border-radius: var(--r-tile);
      border: 1.5px solid var(--line-strong);
      background: transparent;
      color: var(--text);
      font-size: 21px;
      line-height: 1;
      cursor: pointer;
    }

    .stepper__value {
      min-width: 34px;
      text-align: center;
      font-size: 19px;
    }
  `,
})
export class CreateSessionPage {
  private readonly api = inject(SessionApiService);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  protected readonly nicknameMax = NICKNAME_MAX_LENGTH;
  protected readonly minPlayers = MIN_PLAYERS;

  protected readonly usePassword = signal(false);
  protected readonly busy = signal(false);
  /** Where the last failure belongs on screen — never kept as state past the next attempt. */
  protected readonly serverError = signal<'nickname' | 'toast' | null>(null);
  protected readonly errorText = signal('');

  private readonly model = signal({
    nickname: this.identity.lastNickname(),
    password: '',
    maxPlayers: MAX_PLAYERS,
    allowJoinInProgress: true,
  });

  protected readonly f = form(this.model, (path) => {
    required(path.nickname, { message: 'Pick a nickname first.' });
    maxLength(path.nickname, NICKNAME_MAX_LENGTH, {
      message: `Nicknames stop at ${NICKNAME_MAX_LENGTH} characters.`,
    });
    maxLength(path.password, PASSWORD_MAX_LENGTH, {
      message: `Passwords stop at ${PASSWORD_MAX_LENGTH} characters.`,
    });
  });

  protected readonly nicknameError = computed(() => {
    const field = this.f.nickname();
    return field.touched() ? (field.errors()[0]?.message ?? null) : null;
  });

  protected stepPlayers(delta: number): void {
    const next = this.f.maxPlayers().value() + delta;
    this.f.maxPlayers().value.set(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, next)));
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.f().markAsTouched();
    this.serverError.set(null);
    if (this.f().invalid() || this.busy()) {
      return;
    }

    const { nickname, password, maxPlayers, allowJoinInProgress } = this.model();
    const trimmed = nickname.trim();
    this.busy.set(true);
    try {
      const result = await firstValueFrom(
        this.api.create({
          gameType: 'sen-reveal',
          nickname: trimmed,
          ...(this.usePassword() && password ? { password } : {}),
          settings: { maxPlayers, allowJoinInProgress },
        }),
      );
      this.identity.save({
        code: result.session.code,
        playerId: result.playerId,
        playerToken: result.playerToken,
        nickname: result.session.me.nickname,
      });
      await this.router.navigate(['/s', result.session.code]);
    } catch (error) {
      const apiError = toApiError(error);
      this.errorText.set(errorMessage(apiError));
      this.serverError.set(apiError.code === 'nickname-taken' ? 'nickname' : 'toast');
    } finally {
      this.busy.set(false);
    }
  }
}
