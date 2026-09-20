# SenReveal App — Implementation Plan

The client for [sen-reveal-api](../../../sen-reveal-api/README.md). Screens: [docs/design](../design/README.md).
API contract: [sen-reveal.api.implementation-plan.md](../../../sen-reveal-api/docs/implementation/sen-reveal.api.implementation-plan.md) §7–9.

**Confirmed from the requirements**
- Angular 22, signal-based.
- Responsive, big controls — this is played on phones, in a room, at night.
- Phrase Expose (`sen-reveal`) only. Number guess and Who am I are visible on the pick screen as "soon".

**What already exists**
- The API is built through Phase 5: HTTP + Socket.IO, per-viewer projection, presence, polling fallback, 56 passing tests.
- The design is drawn: 11 screens, the UI kit, and the edge states.
- This repo: an empty Angular-less repo with a README. Everything below is new.

**Prerequisites that are not ours but block us**
1. The Supabase objects from API plan §4.1 do not exist yet, so the API cannot run against a real DB. Until the owner creates them, run the API locally and point at a Supabase project that has them.
2. The Vercel WebSocket spike (API Phase 0) is still open. If it comes back no-go, the socket transport is dead and the app runs on polling alone. **The transport layer below is designed so that outcome changes one provider and nothing else.**

---

## 1. Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Angular 22, standalone components, no NgModules | Requirement |
| Change detection | Zoneless (`provideZonelessChangeDetection()`) | Socket.IO callbacks fire outside the Angular zone. Zoneless removes `NgZone.run` wrappers entirely: a signal write updates the view wherever it happens |
| State | Plain signals in injectable services. **No NgRx / NgXs** | There is one piece of state — the latest `SessionView` from the server — and the server already computed it per viewer. A reducer layer on top would restate rules the server owns |
| Forms | Reactive forms, or signal forms if v22 has them stable | Four short forms in the whole app. See §11 |
| HTTP | `HttpClient` with `provideHttpClient(withFetch())` + a token interceptor | — |
| Realtime | `socket.io-client` ^4.8, `transports: ['websocket']` | Matches the server; the polling transport is not available on Vercel |
| Styling | Plain SCSS + CSS custom properties from the design's UI kit. No component library | The design is 11 screens with ~10 repeated parts. A library would be fought, not used |
| i18n | English only, copy inline | Not a requirement |
| Testing | Vitest (matches the API repo) + a thin harness over a fake transport | §12 |
| Hosting | Vercel static, `CORS_ORIGINS` on the API must include its origin | The API already defaults to `localhost:4200` for dev |

**Version note.** Everything here uses APIs stable since v20: standalone components, `signal` / `computed` / `effect` / `linkedSignal`, `input()` / `output()`, `inject()`, built-in control flow, zoneless CD. Two things to check against the v22 release notes in Phase 0 before committing to them: **signal-based forms** (`@angular/forms/signals`) and **`httpResource`**. Both are conveniences here, not load-bearing — if either is still developer preview, use reactive forms and `HttpClient` and move on.

> **Phase 0 answer (Angular 22.1.7).** Both are stable: the whole of `@angular/forms/signals` and
> `httpResource` are marked `@publicApi 22.0`.
> - **Signal forms: used**, for the two forms that have validation — create and join. `form()` over
>   a model signal, `required` / `maxLength` in the schema, `[formField]` on the input. Note that
>   the directive owns `maxlength` on a bound field: binding it yourself is a compile error
>   (NG8022). Server-side failures (`nickname-taken`, wrong password) are *not* validators — they
>   are separate signals rendered under the same field, cleared on the next attempt.
> - **`httpResource`: not used.** Every request here is a command with a redirect or an error
>   placement attached, not a declarative read of a URL. The one thing that would fit it — the
>   `/info` lookup on the join screen — needs cancel-on-stale and a code-shaped error, which the
>   existing effect does in fewer moving parts. `HttpClient` throughout.
>
> Angular 22 is zoneless by default (no `zone.js` in `package.json`, no polyfill in `angular.json`),
> so `provideZonelessChangeDetection()` is not needed and is not called.
>
> **npm note.** npm 11.4.2 crashes resolving vitest's optional peer set
> (`Cannot read properties of null (reading 'edgesOut')`). `vitest` is pinned to an exact `4.0.8`
> in `devDependencies` to keep `npm install` working without `--legacy-peer-deps`.

---

## 2. Architecture

Three layers, one direction of data.

```
  SessionTransport            SessionStore                 Screens
  ──────────────────          ──────────────────           ──────────────────
  socket | polling   ──────>  view: Signal<SessionView>  ──────>  components read
  connection: Signal          derived signals                     signals, call
                                                                  store.dispatch()
        <──────────────────── dispatch(action)  <──────────────────────
```

- **Nothing in the app derives game rules.** Whether a button exists is `game.round.canReveal`, not "am I the active player and has everyone answered". The server computes those flags for the viewer (`senReveal.projection.ts`); the client renders them. This is the single most important rule in this plan — it is what keeps five phones agreeing with each other.
- **Components are dumb.** They take signal inputs and emit actions. No component injects `HttpClient` or the socket.
- **One store instance per session**, provided at the session route, destroyed when you leave it.

---

## 3. Project structure

```
src/app/
  app.config.ts                  providers: zoneless, router, http + interceptor, APP_CONFIG
  app.routes.ts
  core/
    api.config.ts                APP_CONFIG token: apiUrl (from environment)
    identity.service.ts          { code, playerId, playerToken, nickname } in localStorage
    token.interceptor.ts         adds X-Player-Token to /sessions/:code/{state,actions,history}
    session-api.service.ts       create / info / join / getState / postAction / getHistory
    api-error.ts                 ApiError type + `toApiError(HttpErrorResponse)`
  session/
    session.store.ts             the signal store (§4)
    session.transport.ts         SessionTransport interface + connection signal
    socket.transport.ts          Socket.IO implementation
    polling.transport.ts         HTTP polling implementation
    transport.manager.ts         picks one, handles the switch (§5)
    visibility.service.ts        document visibility as a signal (tab hidden > 60s)
    actions.ts                   typed action creators (§6)
  models/
    session.model.ts             SessionView, SessionPlayerView, SessionInfo — mirrors the API
    sen-reveal.model.ts          SenRevealView, SenRevealRoundView, SenRevealScoreView
    error-code.ts                ErrorCode union
  features/
    home/                        Main.dc.html
    start/
      pick-game.page.ts          PickGame.dc.html
      create-session.page.ts     CreateSession.dc.html
    join/join-session.page.ts    JoinSession.dc.html
    session/
      session.page.ts            shell: subscribes, picks the child by phase (§7)
      lobby/lobby.view.ts        Lobby.dc.html
      round/
        ask.view.ts              RoundActive.dc.html
        answer.view.ts           RoundAnswer.dc.html
        reveal.view.ts           Revealed.dc.html
        result.view.ts           Result.dc.html
      ended.view.ts              expired / kicked / finished — States.dc.html
  ui/
    button/ field/ chip/ avatar/ player-row/ progress-pips/ code-display/ answer-card/
    connection-banner/           reconnecting / polling indicator
styles/
  _tokens.scss                   colours, type, spacing, radii from Styleguide.dc.html
  _base.scss
```

`models/` is hand-written to match the API's `SessionView` and `SenRevealView`. It is ~80 lines and it is the contract; do not generate it, and do not import from the API package.

---

## 4. The session store

One signal holds the server's view. Everything else is `computed`.

```ts
@Injectable()
export class SessionStore {
  private readonly _view = signal<SessionView<SenRevealView> | null>(null);

  readonly view = this._view.asReadonly();
  readonly status = computed(() => this._view()?.status ?? null);
  readonly me = computed(() => this._view()?.me ?? null);
  readonly players = computed(() => this._view()?.players ?? []);
  readonly isHost = computed(() => this._view()?.me.isHost ?? false);
  readonly game = computed(() => this._view()?.game ?? null);
  readonly round = computed(() => this.game()?.round ?? null);
  readonly phase = computed(() => this.round()?.phase ?? null);
  readonly isAsker = computed(() => this.round()?.activePlayerId === this.me()?.playerId);

  /** §9.3 rule 4 — never go backwards. */
  apply(next: SessionView<SenRevealView>): void {
    const current = this._view();
    if (current && next.version < current.version) return;
    this._view.set(next);
  }
}
```

Three details that are easy to get wrong:

1. **The guard is `<`, not `<=`.** Presence updates deliberately do not bump `version` (API §3.9), so an online/offline change arrives as a *new snapshot at the same version*. Dropping equal versions freezes the presence dots.
2. **Replace, never merge.** The snapshot is already projected for this viewer; a partial merge would keep stale fields that the server intentionally dropped (for example `round.answers` going back to `null` on a new round).
3. **`round.answers` is an array**, not a map, and `scoreboard` is an array ordered by active players — the API made both deterministic for the ETag. Type them that way.

Derived state the screens need that is *not* on the wire:
```ts
readonly nicknameOf = computed(() => new Map(this.players().map(p => [p.id, p.nickname])));
```
`round.answers[i].playerId`, `winnerId`, `loserId` and `answeredPlayerIds` are all ids; every screen that shows a name resolves it through this map. A player who left mid-round is gone from `players` but may still be in `answers` — fall back to "(left)" rather than rendering an empty name.

---

## 5. Transport

```ts
export interface SessionTransport {
  readonly state: Signal<ConnectionState>;   // 'connecting' | 'live' | 'degraded' | 'closed'
  readonly snapshots: Observable<SessionView<SenRevealView>>;
  readonly terminal: Observable<TerminalReason>; // expired | kicked | left | replaced | unauthorized | not-found
  dispatch(action: GameAction): Promise<ActionResult>;
  connect(): void;
  close(): void;
}
```

`TransportManager` owns one socket transport and one polling transport and decides which is active. The rules come straight from API §9.3 — they are not negotiable, the server is built around them:

| Trigger | Behaviour |
|---|---|
| Start | Socket first. `io(apiUrl, { path: '/socket.io', transports: ['websocket'], auth: { code, playerToken } })` |
| Socket connects | Server pushes `session:state` immediately — that is the initial load, no separate GET needed |
| Server closes at max duration (~300 s) | Socket.IO reconnects on its own. **Show nothing for the first 3 s** — this happens by design every five minutes |
| 3 consecutive failed connects | Switch to polling. Retry the socket every 60 s; on success, stop polling |
| `session:idle` (20 min quiet) | Server disconnects. Reconnect on the next user interaction or visibility change — not on a timer |
| Tab hidden > 60 s | `socket.disconnect()`. Reconnect when visible. Polling drops to 10 s while hidden |
| `session:expired` / `player:removed` | Emit terminal, close, stop everything |
| `connect_error` | `err.data.code` is one of `not-found` / `unauthorized` / `kicked` / `left` / `gone` → terminal |

**Polling transport.** `GET /api/sessions/:code/state` every `view.poll.intervalMs` (3000 pending / 1500 in progress / 10000 finished, or 10000 while hidden), one request in flight at a time.

> Do **not** implement `If-None-Match` by hand. The API sets `ETag` + `Cache-Control: private, no-cache`, so the browser revalidates and sends the conditional header itself — and turns the 304 back into a 200 from cache before `HttpClient` ever sees it. You will never observe a 304 in app code. It still saves the payload on the wire, which is the point. Adding the header manually just breaks the browser's own handling.

**Dispatch.** Socket `emit('action', { type, payload }, ack)` when live; `POST /api/sessions/:code/actions` otherwise. Both return the post-action `SessionView` — feed it through `store.apply()` so the actor sees the result without waiting for the push. Give the ack a timeout (~5 s) and fall back to HTTP on timeout.

---

## 6. Actions

Wire types are namespaced strings. Wrap them once so no component types a string:

```ts
export const Lobby = {
  start:        () => ({ type: 'lobby.start', payload: {} }),
  kick:         (playerId: string) => ({ type: 'lobby.kick', payload: { playerId } }),
  transferHost: (playerId: string) => ({ type: 'lobby.transferHost', payload: { playerId } }),
  leave:        () => ({ type: 'lobby.leave', payload: {} }),
  end:          () => ({ type: 'lobby.end', payload: {} }),
} as const;

export const SenReveal = {
  setQuestion:  (text: string) => ({ type: 'sen-reveal.setQuestion', payload: { text } }),
  submitAnswer: (value: string) => ({ type: 'sen-reveal.submitAnswer', payload: { value } }),
  reveal:       (force = false) => ({ type: 'sen-reveal.reveal', payload: { force } }),
  pickResult:   (winnerId: string, loserId: string | null) => ({ type: 'sen-reveal.pickResult', payload: { winnerId, loserId } }),
  nextRound:    () => ({ type: 'sen-reveal.nextRound', payload: {} }),
  skipRound:    () => ({ type: 'sen-reveal.skipRound', payload: {} }),
} as const;
```

Server-side limits worth enforcing in the UI so the user is not surprised: question ≤ 300 chars, answer 1–200 (`settings.maxAnswerLength`, hard cap 500), nickname 1–20 trimmed, password ≤ 64. An empty `setQuestion` text resets the question to `null` — that is how the asker un-types a question, and the placeholder comes back.

---

## 7. Routing and screens

```
/                    HomePage                 Main.dc.html
/start               PickGamePage             PickGame.dc.html
/start/sen-reveal    CreateSessionPage        CreateSession.dc.html
/join                JoinSessionPage          JoinSession.dc.html   (?code=042137 prefills)
/s/:code             SessionPage              the shell — everything below lives here
```

**The session is one route, not one route per phase.** State arrives by push; if each phase were a route, a snapshot would trigger navigation, and a reconnect that replays a snapshot would re-navigate. Instead `SessionPage` provides the store and renders a child chosen by a computed:

```ts
readonly screen = computed<Screen>(() => {
  const view = this.store.view();
  if (!view) return 'loading';
  if (this.terminal()) return 'ended';
  if (view.status === 'pending') return 'lobby';
  if (view.status === 'finished') return 'ended';
  const round = this.store.round();
  if (!round) return 'paused';                     // pausedReason: 'not-enough-players'
  if (round.phase === 'answering') return this.store.isAsker() ? 'ask' : 'answer';
  return round.phase === 'revealed' ? 'reveal' : 'result';
});
```

Note `'paused'` — `round` is `null` when fewer than 3 active players remain mid-game. The design does not have that screen yet; the lobby's "needs 3 players" copy is the right starting point for it. Flag it when you get there.

**Screen → what it renders**

| Screen | Design | Key bindings |
|---|---|---|
| lobby | `Lobby.dc.html` | `code`, `players` + `isOnline`, `settings.maxPlayers`, `expiresAt` countdown, `isHost` → Start (`lobby.start`), kick, transfer host |
| ask | `RoundActive.dc.html` | `round.question` ↔ `setQuestion` (debounced ~500 ms), `answeredPlayerIds` vs `eligiblePlayerIds`, `canReveal` → primary, `canForceReveal` → "Reveal without X", `canSkipRound` → skip |
| answer | `RoundAnswer.dc.html` | `question` or the out-loud placeholder, `myAnswer` seeds the textarea, `canSubmitAnswer` → submit, progress from `answeredPlayerIds` |
| reveal | `Revealed.dc.html` | `answers` (all, now visible), `canPickResult` → Best/Worst selection + Confirm; non-askers see the same cards with "Vova is picking" |
| result | `Result.dc.html` | `winnerId` / `loserId` / `answers`, `scoreboard`, `circle.number`, `canGoNext` → Next round |
| ended | `States.dc.html` | expired / kicked / removed / finished, each with "Join again" or "Start a new one" |

**Every action button is bound to its `can*` flag.** Not disabled — absent, unless the design shows a disabled state (the asker waiting on the last answer does; that is `canReveal === false && canForceReveal === true`).

---

## 8. Identity

- `POST /api/sessions` and `POST /:code/join` return `{ playerId, playerToken, session }`. Store `{ code, playerId, playerToken, nickname }` in `localStorage` under one key per code, so two sessions in two tabs do not fight.
- `X-Player-Token` goes on `/state`, `/actions`, `/history` via an interceptor scoped by URL — never on `create`, `info` or `join`, and never to any other origin.
- The token is the whole identity: no accounts, no refresh, no reclaim. Lost token → clear it and send the player back to `/join` with the code prefilled. They rejoin as a new player with a fresh score; if their old nickname is still held by someone who has been offline > 30 s, the server hands it over and the stale record gets `player:removed { reason: 'replaced' }`.
- On `/s/:code` with no stored token → redirect to `/join?code=:code`. This is also the shareable link: the Lobby's "Share link" copies `<origin>/join?code=042137`.

---

## 9. Presence, connection and time

- `players[].isOnline` is already computed server-side (last seen < 30 s). Render the dot from it; do not track it locally.
- The connection banner has exactly three states: hidden (live, or reconnecting < 3 s), "Reconnecting…", "Slow line — refreshing every 1.5 s" (polling). It never blocks input: actions queued while degraded go over HTTP anyway.
- `expiresAt` drives the lobby countdown. Compute it against the client clock but never *act* on it — expiry is the server's call, delivered as `session:expired` or `410`. A client whose clock is wrong must not lock itself out.

---

## 10. Styling

Tokens come from `Styleguide.dc.html`, as CSS custom properties on `:root` in `_tokens.scss`:

```scss
--room: #14101F;  --field: #1B1529;  --card: #221B33;  --chip: #2E2542;
--line: #3E3354;  --line-strong: #4A3E63;
--go: #C8F24E;    --worst: #FF6F59;
--text: #F7F3FF;  --muted: #A99FC0;  --faint: #8F84A8;
--r-card: 18px;   --r-field: 16px;   --r-pill: 999px;
--tap: 44px;      --tap-primary: 58px;
```

- Dark only. No light mode, no `prefers-color-scheme` branch — it is played at night and a white flash is a real cost.
- Fonts: Bricolage Grotesque (display), Work Sans (body), Space Mono (codes, counters, scores only). Self-host or preconnect to Google Fonts; do not let a font swap reflow the answer cards mid-reveal.
- Layout is a single column capped at ~480 px, centred, with the primary action pinned to the bottom of the viewport on phones (`dvh`, not `vh` — the mobile URL bar).
- Touch targets: 44 px minimum, 58–62 px for primary actions.
- Motion: reveal is the only animation with weight — cards in sequence, ~180 ms each. Everything else ≤ 120 ms. Respect `prefers-reduced-motion`.

---

## 11. Errors

Every failure is `{ error: { code, message } }`. `code` is one of `bad-request` · `unauthorized` · `forbidden` · `not-found` · `conflict` · `gone` · `too-many-requests` · `internal-server-error` · `kicked` · `left` · `nickname-taken` · `session-full` · `session-finished`.

| Code | Where it shows | What the app does |
|---|---|---|
| `nickname-taken` | under the nickname field | stay on the form |
| `unauthorized` on join | under the password field | "Wrong password" |
| `not-found` | under the code field | "No room with that code" |
| `session-full` | under the code field | — |
| `gone` | full screen | expired; clear the stored token |
| `kicked` / `left` / `replaced` | full screen | clear the token, offer "Join again" |
| `conflict` | inline toast | the round moved on — the next snapshot already fixes the screen, so say little and let it correct itself |
| `too-many-requests` | inline toast | back off; do not retry in a loop |
| `internal-server-error` | inline toast | retry is safe; actions are idempotent per version |

**Do not model errors as state.** A failed action leaves the store untouched; the next snapshot is the truth. The only errors that persist on screen are the terminal ones and form validation.

---

## 12. Testing

- **Store**: version guard (older dropped, equal applied — the presence case), name resolution for a player who left mid-round.
- **Transport manager** against a fake socket: 3 failures → polling; socket recovers → polling stops; hidden > 60 s → disconnect; `session:idle` → no reconnect until interaction; terminal events close everything.
- **Screen selection**: a table of `(status, phase, isAsker, terminal)` → expected screen, including `round === null` → paused.
- **Component tests** for the ones with logic: reveal's Best/Worst selection (same player cannot be both; loser may be null only with one answer), answer's character limit.
- **One end-to-end pass** against the real API running locally, three browser profiles, one full circle. This is the test that matters and it cannot be faked: the interesting bugs are all about five clients agreeing.

---

## 13. Phases

> **Status.** Phases 0–5 are built: every screen in `docs/design`, both transports and the manager,
> the store, identity, the error placements, and 35 tests green (`npm run test:run`). The API
> contract was verified end to end against the real server running on the in-memory repository —
> HTTP create / join / state / actions and the socket handshake, pushes, acks, `player:removed`
> and `connect_error` codes. **Phase 6 is not done**: no game has been played on real phones, and
> none of the screens has been looked at in a browser yet — that is the next thing to do, and it
> is where the layout and the reveal timing will actually get judged.
>
> Two deliberate departures from the drawings, both because the data is not on the wire:
> - The lobby's expiry line drops "Password needed ·". `SessionView` carries no `requiresPassword`
>   (only `/info` does, and that is a pre-join endpoint). Adding it to the projection is a small
>   API change if the line matters.
> - The join screen's found-room line reads "Phrase Expose · 3 of 20 inside" instead of
>   "Vova's room · …", because `/info` does not name the host.

**Phase 0 — Scaffold.** `ng new` (zoneless, SCSS, routing), tokens and base styles, `APP_CONFIG` with `apiUrl`, the `ui/` primitives built from `Styleguide.dc.html`, Vitest running. Confirm the v22 status of signal forms and `httpResource`; record the answer here.
*Done when:* the UI kit renders as a dev-only page and matches `Styleguide.dc.html`.

**Phase 1 — Getting in.** Home, pick game, create, join. `SessionApiService`, `IdentityService`, the interceptor, form validation and the inline errors of §11.
*Done when:* create and join both return a token that lands in `localStorage`, and every error in §11 has a place on screen.

**Phase 2 — Lobby on polling.** Store, polling transport, `SessionPage` shell, lobby view, host controls.
*Done when:* two browsers see each other join, kick and transfer host, with no socket involved.

**Phase 3 — Socket + fallback.** Socket transport, transport manager, the switching rules of §5, connection banner, visibility handling.
*Done when:* the transport tests pass and killing the socket in devtools drops to polling and recovers without the lobby flickering.

**Phase 4 — The round.** All four round screens, the action creators, `can*` bindings.
*Done when:* four clients play a full circle — question, answers, reveal, pick, next — and no client ever renders an answer before `revealed`. Check the network payloads, not just the screen.

**Phase 5 — Edges.** Paused (< 3 players), expired, kicked, replaced, finished, force reveal, skip round, the out-loud placeholder, reconnect banner timing.
*Done when:* every panel of `States.dc.html` is reachable in a real session.

**Phase 6 — Ship.** A11y pass (labels, focus order, `aria-live` on the reveal), `prefers-reduced-motion`, font loading, deploy to Vercel, add the origin to the API's `CORS_ORIGINS`.
*Done when:* one game played on three real phones, one of them on mobile data.

---

## 14. Open questions

1. **The pick step.** The game description ends the round at "show answers", but the API requires `pickResult` (winner + loser, final) to leave `revealed`. The design includes the pick. If you want reveal-and-move-on, that is an API change — a `skipResult` action or a setting that auto-resolves — and it should be decided before Phase 4, not after.
2. **The paused screen** (`round === null`, fewer than 3 players) has no design yet. Built anyway,
   as `paused.view.ts`, from the lobby's "needs 3 players" copy plus the roster and a host-only
   "End the game". It wants a real drawing before Phase 6 — it is the screen a dropped call lands
   people on, so it is worth more than a placeholder.
3. **Rejoin friction.** Clearing storage loses your score with no recovery path. Fine for a party game; worth knowing before someone asks.
4. **Vercel WebSockets** (API Phase 0) — if no-go, Phase 3 collapses into "polling only" and §5's manager keeps a single provider. Nothing else in this plan changes.
