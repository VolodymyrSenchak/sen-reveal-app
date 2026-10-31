import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, SenRevealRoundView } from '../../../../../models';
import { SenReveal } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { SessionTopComponent } from '../../../../../ui/session-top';

/**
 * Revealed.dc.html — `phase: 'revealed'`. Everyone sees the same cards; only the asker
 * (`canPickResult`) gets the Best / Worst buttons and the confirm.
 */
@Component({
  selector: 'app-reveal-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionTopComponent, AvatarComponent],
  templateUrl: './reveal.view.html',
  styleUrl: './reveal.view.scss',
})
export class RevealView {
  protected readonly store = inject(SessionStore);

  readonly banner = input.required<ConnectionState>();
  readonly toast = input<string | null>(null);

  readonly act = output<GameAction>();
  readonly exit = output<void>();

  /** The shell only renders this view for `sen-reveal`, so the narrowing holds. */
  protected readonly round = computed(() => this.store.roundAs<SenRevealRoundView>());

  protected readonly asker = computed(() => this.store.askerNickname());
  protected readonly nameOf = computed(() => this.store.nicknameOf());
  protected readonly answers = computed(() => this.round()?.answers ?? []);

  /** Cleared when the round moves on, so a new reveal never starts with last round's picks. */
  protected readonly winnerId = seededSignal<number, string | null>(
    () => this.round()?.number ?? 0,
    () => null,
  );
  protected readonly loserId = seededSignal<number, string | null>(
    () => this.round()?.number ?? 0,
    () => null,
  );

  /** With a single answer the loser may be null; otherwise both are required and distinct. */
  protected readonly canConfirm = computed(() => {
    const winner = this.winnerId();
    if (!winner) {
      return false;
    }
    return this.answers().length === 1 ? true : this.loserId() !== null && this.loserId() !== winner;
  });

  protected readonly confirmHint = computed(() => {
    if (this.canConfirm()) {
      return 'Final — no take-backs. Everyone else just reads the cards and waits for you.';
    }
    if (!this.winnerId()) {
      return 'Pick the best one first.';
    }
    return this.answers().length === 1 ? '' : 'Now pick the worst — it has to be someone else.';
  });

  protected pickBest(playerId: string): void {
    this.winnerId.set(this.winnerId() === playerId ? null : playerId);
    if (this.loserId() === playerId) {
      this.loserId.set(null);
    }
  }

  protected pickWorst(playerId: string): void {
    this.loserId.set(this.loserId() === playerId ? null : playerId);
    if (this.winnerId() === playerId) {
      this.winnerId.set(null);
    }
  }

  protected confirm(): void {
    const winner = this.winnerId();
    if (!winner || !this.canConfirm()) {
      return;
    }
    this.act.emit(SenReveal.pickResult(winner, this.answers().length === 1 ? null : this.loserId()));
  }
}
