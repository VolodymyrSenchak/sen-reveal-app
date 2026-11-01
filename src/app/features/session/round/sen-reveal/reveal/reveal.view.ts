import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { GameAction, SenRevealRoundView } from '../../../../../models';
import { SenReveal } from '../../../../../session/actions';
import { seededSignal } from '../../../../../session/seeded-signal';
import { SessionStore } from '../../../../../session/session.store';
import { ConnectionState } from '../../../../../session/session.transport';
import { AvatarComponent } from '../../../../../ui/avatar';
import { SessionTopComponent } from '../../../../../ui/session-top';

/**
 * Revealed.dc.html — `phase: 'revealed'`. Everyone sees the same cards and the picks as they land;
 * only the asker gets the Best / Worst buttons (`canSetPicks`) and the confirm (`canPickResult`).
 * With blind picks the cards start without names, and `canShowNames` comes before the confirm.
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

  /**
   * The asker's taps stay local so they feel instant; only a new round or a lost answer resets them.
   * Everyone else, and the asker once the picks are locked, follows the server.
   */
  private readonly picksKey = computed(() => {
    const round = this.round();
    const base = `${round?.number ?? 0}:${this.answers().length}`;
    return round?.canSetPicks ? base : `${base}:${round?.winnerId}:${round?.loserId}`;
  });
  protected readonly winnerId = seededSignal<string, string | null>(
    () => this.picksKey(),
    () => this.round()?.winnerId ?? null,
  );
  protected readonly loserId = seededSignal<string, string | null>(
    () => this.picksKey(),
    () => this.round()?.loserId ?? null,
  );

  private picksSeq = 0;

  /** With a single answer the loser may be null; otherwise both are required and distinct. */
  protected readonly canConfirm = computed(() => {
    const winner = this.winnerId();
    if (!winner) {
      return false;
    }
    return this.answers().length === 1 ? true : this.loserId() !== null && this.loserId() !== winner;
  });

  protected readonly confirmHint = computed(() => {
    const round = this.round();
    if (round?.picksLocked) {
      return 'Everyone can see the names now. Confirm to go to the results.';
    }
    if (this.canConfirm()) {
      return round?.canShowNames
        ? 'This locks your picks and shows everyone who wrote what.'
        : 'Final — no take-backs. Everyone else is watching your picks.';
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
    this.sendPicks();
  }

  protected pickWorst(playerId: string): void {
    this.loserId.set(this.loserId() === playerId ? null : playerId);
    if (this.winnerId() === playerId) {
      this.winnerId.set(null);
    }
    this.sendPicks();
  }

  private sendPicks(): void {
    this.picksSeq = Math.max(this.picksSeq, this.round()?.picksSeq ?? 0) + 1;
    this.act.emit(SenReveal.setPicks(this.winnerId(), this.loserId(), this.picksSeq));
  }

  protected showNames(): void {
    if (this.canConfirm()) {
      this.act.emit(SenReveal.showNames());
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
