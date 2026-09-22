import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon';

/**
 * "Answers in" — one pip per answerer, readable across a table without counting,
 * plus a chip per player. Shared by the asker's screen and the answerer's, in every game.
 */
@Component({
  selector: 'app-answers-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="card answers">
      <div class="field-row">
        <span class="answers__title">{{ title() }}</span>
        <span class="mono answers__count" [class.answers__count--all]="complete()">
          {{ answered().length }} / {{ eligible().length }}
        </span>
      </div>

      <div class="pips" role="img" [attr.aria-label]="answered().length + ' of ' + eligible().length + ' answered'">
        @for (id of eligible(); track id) {
          <span class="pips__pip" [class.pips__pip--on]="isAnswered(id)"></span>
        }
      </div>

      <div class="answers__chips">
        @for (id of eligible(); track id) {
          @if (isAnswered(id)) {
            <span class="chip chip--done">
              <app-icon name="check" [size]="14" [width]="3" class="answers__tick" />
              {{ nameOf()(id) }}
            </span>
          } @else {
            <span class="chip chip--waiting">{{ nameOf()(id) }} {{ waiting() }}</span>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .answers {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .answers__title {
      font-size: 14.5px;
      font-weight: 600;
    }

    .answers__count {
      font-size: 14px;
      color: var(--muted);
    }

    .answers__count--all {
      color: var(--go);
    }

    .answers__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .answers__tick {
      color: var(--go);
    }
  `,
})
export class AnswersProgressComponent {
  readonly eligible = input.required<string[]>();
  readonly answered = input.required<string[]>();
  readonly nameOf = input.required<(playerId: string) => string>();
  /** Games that take something other than a written answer relabel it — "Numbers in", say. */
  readonly title = input('Answers in');
  readonly waiting = input('is typing…');

  private readonly answeredSet = computed(() => new Set(this.answered()));
  readonly complete = computed(() => this.eligible().length > 0 && this.answered().length === this.eligible().length);

  isAnswered(playerId: string): boolean {
    return this.answeredSet().has(playerId);
  }
}
