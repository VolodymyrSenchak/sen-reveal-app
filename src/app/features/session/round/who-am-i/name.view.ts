import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { GameAction, MAX_NAME_LENGTH, WhoAmIView } from '../../../../models';
import { WhoAmI } from '../../../../session/actions';
import { SessionStore } from '../../../../session/session.store';
import { ConnectionState } from '../../../../session/session.transport';
import { AnswersProgressComponent } from '../../../../ui/answers-progress';
import { AvatarComponent } from '../../../../ui/avatar';
import { IconComponent } from '../../../../ui/icon';
import { SessionTopComponent } from '../../../../ui/session-top';

/** `who-am-i`, `canSubmitName`: the viewer still owes their target a name. The table stays shut until they give it. */
@Component({
  selector: 'app-wai-name-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AnswersProgressComponent, AvatarComponent, IconComponent],
  template: `
    @if (round(); as round) {
      <div class="screen">
        <app-session-top
          [code]="store.code() ?? ''"
          [subtitle]="'Round ' + round.number + ' · naming'"
          [banner]="banner()"
          [pollIntervalMs]="store.pollIntervalMs()"
          [toast]="toast()"
          (exit)="exit.emit()"
        />

        <div class="card--accent name__turn">
          <app-icon name="person" [size]="26" [width]="2.3" />
          <div>
            <div class="name__turnTitle">Who is {{ target() }}?</div>
            <div class="name__turnCopy">
              Pick someone everyone knows — real or made up. {{ target() }} won't see it. Everyone else will.
            </div>
          </div>
        </div>

        <section class="name__target">
          <app-avatar [nickname]="target()" [size]="52" />
          <div>
            <div class="eyebrow">You are naming</div>
            <div class="name__targetName">{{ target() }}</div>
          </div>
        </section>

        <div class="stack">
          <div class="field-row">
            <label class="label" for="famous">Their secret identity</label>
            <span class="counter">{{ draft().length }}/{{ nameMax }}</span>
          </div>
          <input
            id="famous"
            class="input"
            type="text"
            autocomplete="off"
            placeholder="Sherlock Holmes"
            [attr.maxlength]="nameMax"
            [value]="draft()"
            (input)="draft.set($any($event.target).value)"
            (keydown.enter)="submit()"
          />
          <span class="hint">Once it's in it's stuck — no take-backs.</span>
        </div>

        <app-answers-progress
          [eligible]="round.eligiblePlayerIds"
          [answered]="round.answeredPlayerIds"
          [nameOf]="store.nicknameOf()"
          title="Names in"
          waiting="is thinking…"
        />

        <div class="spacer"></div>

        <button class="btn btn--primary" type="button" [disabled]="!canSend()" (click)="submit()">
          Stick it on {{ target() }}
        </button>
        <p class="footnote">Then you see every card on the table — except the one on you.</p>
      </div>
    }
  `,
  styles: `
    .name__turn {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .name__turnTitle {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.3px;
      overflow-wrap: anywhere;
    }

    .name__turnCopy {
      margin-top: 2px;
      font-size: 13.5px;
      line-height: 1.4;
      opacity: 0.85;
    }

    .name__target {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border: 1.5px solid var(--line);
      border-radius: var(--r-card-lg);
      background: var(--card);
    }

    .name__targetName {
      margin-top: 2px;
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      overflow-wrap: anywhere;
    }
  `,
})
export class WhoAmINameView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  protected readonly nameMax = MAX_NAME_LENGTH;

  /** The shell only renders this view for `who-am-i`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.gameAs<WhoAmIView>()?.round ?? null);

  protected readonly target = computed(() => this.store.nicknameOf()(this.round()?.myTargetId));

  /** Cleared on a new round, and when a leaver hands the viewer a different target mid-round. */
  protected readonly draft = linkedSignal<string, string>({
    source: () => `${this.round()?.number ?? 0}:${this.round()?.myTargetId ?? ''}`,
    computation: () => '',
  });

  protected readonly canSend = computed(() => {
    const name = this.draft().trim();
    return name.length > 0 && name.length <= MAX_NAME_LENGTH;
  });

  protected submit(): void {
    if (!this.canSend()) {
      return;
    }
    this.act.emit(WhoAmI.submitName(this.draft().trim()));
  }
}
