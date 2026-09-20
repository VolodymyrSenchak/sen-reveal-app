import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Initial tile plus the presence dot. Host is the lime tile; the dot is `isOnline` from the server. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.width.px]="size()" [style.height.px]="size()">
      <span
        class="avatar__tile"
        [class.avatar__tile--host]="isHost()"
        [class.avatar__tile--offline]="!isOnline()"
        [style.font-size.px]="size() * 0.42"
      >
        {{ initial() }}
      </span>
      @if (showDot()) {
        <span
          class="avatar__dot"
          [class.avatar__dot--offline]="!isOnline()"
          [style.border-color]="dotRing()"
        ></span>
      }
    </span>
  `,
})
export class AvatarComponent {
  readonly nickname = input('');
  readonly isHost = input(false);
  readonly isOnline = input(true);
  readonly showDot = input(false);
  readonly size = input(40);
  /** The dot punches a hole in whatever surface it sits on. */
  readonly dotRing = input('var(--card)');

  readonly initial = computed(() => this.nickname().trim().charAt(0).toUpperCase() || '?');
}
