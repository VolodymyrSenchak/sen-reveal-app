import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon';

/** Back arrow plus a step label. The three setup screens share it. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="head">
      <a class="icon-btn head__back" [routerLink]="backTo()" [attr.aria-label]="backLabel()">
        <app-icon name="arrow-left" [size]="21" [width]="2.4" />
      </a>
      <span class="head__step">{{ step() }}</span>
    </div>
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .head__back {
      margin-left: -10px;
      border-radius: 14px;
      color: var(--text);
    }

    .head__step {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--muted);
    }
  `,
})
export class PageHeaderComponent {
  readonly step = input.required<string>();
  readonly backTo = input<string>('/');
  readonly backLabel = input('Back');
}
