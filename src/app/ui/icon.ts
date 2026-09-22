import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'bars'
  | 'check'
  | 'chevron-right'
  | 'clock'
  | 'copy'
  | 'crown'
  | 'eye'
  | 'lock'
  | 'more'
  | 'question'
  | 'share'
  | 'speech'
  | 'warning'
  | 'x';

/** One inline SVG sprite. The design draws every icon at 24×24 on a 2.2–2.6 stroke. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="width()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('arrow-right') {
          <path d="M5 12h13" />
          <path d="M12 5l7 7-7 7" />
        }
        @case ('arrow-left') {
          <path d="M19 12H6" />
          <path d="M12 5l-7 7 7 7" />
        }
        @case ('bars') {
          <path d="M4 18h16" />
          <path d="M7 18V9" />
          <path d="M12 18V5" />
          <path d="M17 18v-6" />
        }
        @case ('check') {
          <path d="M20 6L9 17l-5-5" />
        }
        @case ('chevron-right') {
          <path d="M9 5l7 7-7 7" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v4l3 2" />
        }
        @case ('copy') {
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M5 15V6a1 1 0 0 1 1-1h9" />
        }
        @case ('crown') {
          <path d="M4 8l4 4 4-7 4 7 4-4-2 10H6z" />
        }
        @case ('eye') {
          <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.6" />
        }
        @case ('lock') {
          <rect x="4" y="10" width="16" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        }
        @case ('more') {
          <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
        }
        @case ('question') {
          <path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7v.5" />
          <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
        }
        @case ('share') {
          <path d="M12 16V4" />
          <path d="M8 8l4-4 4 4" />
          <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
        }
        @case ('speech') {
          <path d="M3 5h18v11H8l-5 4z" />
          <path d="M8 10h8" />
        }
        @case ('warning') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5" />
          <circle cx="12" cy="16.3" r="1.1" fill="currentColor" stroke="none" />
        }
        @case ('x') {
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(19);
  readonly width = input(2.3);
}
