import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAMES } from '../../core/games';
import { GameType } from '../../models';
import { IconComponent } from '../../ui/icon';
import { PageHeaderComponent } from '../../ui/page-header';

/** PickGame.dc.html — `sen-reveal` and `number-guess` are built; `who-am-i` is still wired only. */
@Component({
  selector: 'app-pick-game',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="screen">
      <app-page-header step="Step 1 of 2" backTo="/" backLabel="Back to home" />

      <div class="stack">
        <h1 class="pick__title">Which game tonight?</h1>
        <p class="pick__lede">Everyone joins the same room. The game decides what people type in.</p>
      </div>

      <div class="pick__list" role="radiogroup" aria-label="Pick a game">
        @for (game of games; track game.type) {
          <button
            type="button"
            role="radio"
            class="game game--ready"
            [class.game--on]="selected() === game.type"
            [attr.aria-checked]="selected() === game.type"
            (click)="selected.set(game.type)"
          >
            <div class="game__top">
              <span class="game__badge game__badge--ready">
                <app-icon [name]="game.type === 'number-guess' ? 'bars' : 'speech'" [size]="24" [width]="2.2" />
              </span>
              <div class="game__body">
                <div class="game__heading">
                  <h2 class="game__name">{{ game.title }}</h2>
                  <span class="tag tag--ready">Ready</span>
                </div>
                <p class="game__copy">{{ game.lede }}</p>
              </div>
            </div>
            <div class="game__meta">
              <span class="chip">3–20 players</span>
              <span class="chip">{{ game.inputLabel }}</span>
            </div>
          </button>
        }

        <div class="game game--soon">
          <div class="game__top">
            <span class="game__badge">
              <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <circle cx="12" cy="9" r="4" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
              </svg>
            </span>
            <div class="game__body">
              <div class="game__heading">
                <h2 class="game__name">Who Am I</h2>
                <span class="tag tag--soon">Soon</span>
              </div>
              <p class="game__copy">
                Everyone secretly names someone else. You see every name on the table except the one stuck to you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="spacer"></div>

      <a class="btn btn--primary" [routerLink]="['/start', selected()]">Continue with {{ selectedTitle() }}</a>
      <p class="footnote">Who Am I is wired for the same room — just not built yet.</p>
    </div>
  `,
  styles: `
    .pick__title {
      font-size: 32px;
      letter-spacing: -0.9px;
    }

    .pick__lede {
      font-size: 15px;
      line-height: 1.45;
      color: var(--muted);
    }

    .pick__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .game {
      border-radius: 20px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      width: 100%;
    }

    .game--ready {
      border: 1.5px solid var(--line);
      background: var(--card);
      color: var(--text);
      cursor: pointer;
      transition: border-color var(--t-quick) ease;
    }

    /* the picked one is the only card with the accent border, so the choice reads at a glance */
    .game--on {
      border: 2px solid var(--go);
      padding: 17.5px;
    }

    .game--soon {
      border: 1.5px solid var(--line);
      background: var(--field);
      color: var(--faint);
    }

    .game__top {
      display: flex;
      align-items: flex-start;
      gap: 13px;
    }

    .game__badge {
      width: 46px;
      height: 46px;
      flex-shrink: 0;
      border-radius: 15px;
      background: var(--chip);
      color: var(--faint);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game--on .game__badge--ready {
      background: var(--go);
      color: var(--room);
    }

    .game__body {
      flex-grow: 1;
    }

    .game__heading {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .game__name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .game--soon .game__name {
      color: var(--muted);
    }

    .game__copy {
      margin-top: 5px;
      font-size: 14px;
      line-height: 1.45;
      color: var(--text-2);
    }

    .game--soon .game__copy {
      color: var(--faint);
    }

    .game__meta {
      display: flex;
      gap: 7px;
      padding-left: 59px;
    }

    .game__meta .chip {
      padding: 5px 10px;
      font-size: 12px;
      color: var(--text-2);
    }
  `,
})
export class PickGamePage {
  protected readonly games = GAMES;
  protected readonly selected = signal<GameType>(GAMES[0].type);
  protected readonly selectedTitle = computed(
    () => this.games.find((game) => game.type === this.selected())?.title ?? '',
  );
}
