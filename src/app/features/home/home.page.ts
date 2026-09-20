import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../ui/icon';

/** Main.dc.html */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="screen home">
      <header class="home__bar">
        <div class="home__brand">
          <span class="home__mark"><app-icon name="speech" [size]="15" [width]="2.4" /></span>
          <span class="home__name">SenReveal</span>
        </div>
        <span class="home__kicker">Party game</span>
      </header>

      <div class="home__art" aria-hidden="true">
        <svg viewBox="0 0 342 248" width="100%" height="auto" focusable="false">
          <g stroke="var(--line)" stroke-width="3" stroke-linecap="round">
            <path d="M16 44 L25 35" />
            <path d="M326 62 L317 53" />
            <path d="M300 18 L300 30" />
            <path d="M40 16 L46 22" />
          </g>
          <rect x="92" y="6" width="158" height="58" rx="19" fill="var(--card)" stroke="var(--go)" stroke-width="2" />
          <rect x="112" y="24" width="82" height="9" rx="4.5" fill="var(--go)" />
          <rect x="112" y="41" width="52" height="9" rx="4.5" fill="var(--ghost)" />
          <circle cx="224" cy="38" r="8" fill="var(--go)" />
          <path d="M148 62 L148 84 L176 62 Z" fill="var(--card)" />
          <path d="M148 62 L148 84 L176 62" fill="none" stroke="var(--go)" stroke-width="2" stroke-linejoin="round" />

          <g transform="translate(22 98) rotate(-10)">
            <rect width="104" height="126" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
            <rect x="16" y="22" width="58" height="9" rx="4.5" fill="var(--ghost)" />
            <rect x="16" y="41" width="72" height="9" rx="4.5" fill="var(--ghost)" />
            <rect x="16" y="60" width="40" height="9" rx="4.5" fill="var(--ghost)" />
            <circle cx="26" cy="100" r="10" fill="var(--chip)" />
          </g>
          <g transform="translate(118 90) rotate(3)">
            <rect width="106" height="130" rx="16" fill="var(--go)" />
            <rect x="16" y="22" width="66" height="9" rx="4.5" fill="var(--room)" />
            <rect x="16" y="41" width="74" height="9" rx="4.5" fill="var(--room)" />
            <rect x="16" y="60" width="46" height="9" rx="4.5" fill="var(--room)" />
            <circle cx="26" cy="104" r="10" fill="var(--room)" />
          </g>
          <g transform="translate(216 100) rotate(11)">
            <rect width="104" height="126" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
            <rect x="16" y="22" width="64" height="9" rx="4.5" fill="var(--ghost)" />
            <rect x="16" y="41" width="46" height="9" rx="4.5" fill="var(--ghost)" />
            <rect x="16" y="60" width="60" height="9" rx="4.5" fill="var(--ghost)" />
            <circle cx="26" cy="100" r="10" fill="var(--worst)" />
          </g>
        </svg>
      </div>

      <h1 class="home__title">Ask.&nbsp;Answer.<br />Then&nbsp;<span class="home__accent">reveal</span>.</h1>

      <p class="home__lede">
        One person asks. Everybody answers in secret on their own phone. Nothing shows until the asker hits reveal —
        then all of it lands at once.
      </p>

      <ul class="home__facts">
        <li>3–20 players</li>
        <li>No account</li>
        <li>Room lives 24h</li>
      </ul>

      <div class="spacer"></div>

      <a class="btn btn--primary" routerLink="/start">
        Start a game session
        <app-icon name="arrow-right" [size]="19" [width]="2.6" />
      </a>
      <a class="btn btn--primary home__ghost" routerLink="/join">Join with a code</a>

      <p class="footnote">Six digits is all anyone needs to get in. Same room, same sofa, different screens.</p>
    </div>
  `,
  styles: `
    .home__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .home__brand {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .home__mark {
      width: 26px;
      height: 26px;
      border-radius: 9px;
      background: var(--go);
      color: var(--room);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .home__name {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }

    .home__kicker {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--muted);
    }

    .home__art {
      display: flex;
      justify-content: center;
    }

    .home__title {
      font-size: 40px;
      line-height: 1.02;
      letter-spacing: -1.2px;
    }

    .home__accent {
      color: var(--go);
    }

    .home__lede {
      font-size: 15.5px;
      line-height: 1.45;
      color: var(--muted);
    }

    .home__facts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .home__facts li {
      padding: 7px 12px;
      border-radius: var(--r-pill);
      background: var(--card);
      border: 1px solid var(--line);
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-2);
    }

    .home__ghost {
      background: transparent;
      border: 1.5px solid var(--line-strong);
      color: var(--text);
    }

    .home__ghost:hover {
      background: transparent;
      border-color: var(--go);
    }
  `,
})
export class HomePage {}
