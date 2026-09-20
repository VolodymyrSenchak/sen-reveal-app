import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IdentityService } from '../../core/identity.service';
import { TerminalReason } from '../../models';
import { IconComponent } from '../../ui/icon';

interface EndedCopy {
  title: string;
  body: string;
  primary: { label: string; link: unknown[]; query?: Record<string, string> };
  secondary?: { label: string; link: unknown[] };
}

/**
 * States.dc.html, "Dead ends". Anything that ends the session ends it on every screen at once —
 * nobody is left staring at a stale round.
 */
@Component({
  selector: 'app-ended-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="screen ended">
      <div class="spacer"></div>

      <div class="ended__card">
        <app-icon name="warning" [size]="30" [width]="2.1" class="ended__icon" />
        <h1 class="ended__title">{{ copy().title }}</h1>
        <p class="ended__body">{{ copy().body }}</p>
      </div>

      <div class="spacer"></div>

      <a class="btn btn--primary" [routerLink]="copy().primary.link" [queryParams]="copy().primary.query ?? {}">
        {{ copy().primary.label }}
      </a>
      @if (copy().secondary; as secondary) {
        <a class="btn btn--primary ended__ghost" [routerLink]="secondary.link">{{ secondary.label }}</a>
      }
    </div>
  `,
  styles: `
    .ended {
      text-align: center;
    }

    .ended__card {
      border: 1.5px solid var(--line);
      border-radius: var(--r-card);
      background: var(--card);
      padding: 26px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .ended__icon {
      color: var(--worst);
    }

    .ended__title {
      font-size: 22px;
      font-weight: 700;
    }

    .ended__body {
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--muted);
    }

    .ended__ghost {
      background: transparent;
      border: 1.5px solid var(--line-strong);
      color: var(--text);
    }

    .ended__ghost:hover {
      background: transparent;
      border-color: var(--go);
    }
  `,
})
export class EndedView implements OnInit {
  private readonly identity = inject(IdentityService);

  readonly reason = input.required<TerminalReason>();
  readonly code = input.required<string>();

  protected readonly copy = computed<EndedCopy>(() => {
    const code = this.code();
    const rejoin = { label: 'Join again', link: ['/join'], query: { code } };
    const fresh = { label: 'Start a fresh one', link: ['/start'] };

    switch (this.reason()) {
      case 'expired':
        return {
          title: 'This room is over',
          body: `Codes live 24 hours. ${code} belongs to nobody now.`,
          primary: fresh,
        };
      case 'kicked':
        return {
          title: 'The host removed you',
          body: 'You can walk back in with the same code — new nickname slot, and the score starts over.',
          primary: rejoin,
          secondary: fresh,
        };
      case 'replaced':
        return {
          title: 'Somebody took your name',
          body: 'You were offline long enough that the nickname went to a rejoining player. Pick another one and come back.',
          primary: rejoin,
          secondary: fresh,
        };
      case 'left':
        return {
          title: 'You left the room',
          body: 'Nothing is lost on their side — the game carries on without you.',
          primary: rejoin,
          secondary: fresh,
        };
      case 'unauthorized':
        return {
          title: 'That pass no longer works',
          body: 'Your place in the room is gone. Rejoin with the code and pick a nickname.',
          primary: rejoin,
          secondary: fresh,
        };
      case 'not-found':
        return {
          title: 'No such room',
          body: `Nothing is running under ${code} any more.`,
          primary: fresh,
        };
      default:
        return {
          title: 'That is the game',
          body: 'The host ended it. Scores are in, arguments are settled.',
          primary: fresh,
          secondary: { label: 'Back home', link: ['/'] },
        };
    }
  });

  ngOnInit(): void {
    // The token is dead in all of these — do not leave it to strand the next visit. A finished
    // game is the exception: the room is still there and the stored token still reads its state.
    if (this.reason() !== 'finished') {
      this.identity.clear(this.code());
    }
  }
}
