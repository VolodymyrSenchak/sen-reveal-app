# SenReveal — player app design

Visual design for the client, drawn against the API contract in
[sen-reveal-api §8–9](../../../sen-reveal-api/docs/implementation/sen-reveal.api.implementation-plan.md).
Live canvas (pan / zoom / click-through): https://claude.ai/artifact/JmgzuBmfbCPFGQKb5TCDGw

Each `.dc.html` is one screen, self-contained, all styling inline. Open any of them
straight in a browser — the `support.js` 404 is harmless, it's only the canvas editor's
runtime. `canvas.json` is the canvas layout (frame positions and notes); it is not needed
to view a screen.

Sized 390×844 (phone). Dark only — no light mode planned.

## Screens

| File | Screen | API state behind it |
|---|---|---|
| `Main.dc.html` | Home | — |
| `PickGame.dc.html` | Pick a game | `gameType`; only `sen-reveal` is built |
| `CreateSession.dc.html` | Start a session | `POST /api/sessions` |
| `JoinSession.dc.html` | Join a session | `GET /:code/info` + `POST /:code/join` |
| `Lobby.dc.html` | Lobby | `status: 'pending'`, `lobby.start` / `kick` / `transferHost` |
| `RoundActive.dc.html` | Asker's screen | `phase: 'answering'`, viewer is `round.activePlayerId` |
| `RoundAnswer.dc.html` | Answerer's screen | `phase: 'answering'`, viewer in `eligiblePlayerIds` |
| `Revealed.dc.html` | Answers + pick | `phase: 'revealed'`, `canPickResult` |
| `Result.dc.html` | Round result | `phase: 'resolved'`, `canGoNext` |
| `States.dc.html` | Edge states | force reveal, no question, reconnect, expired, kicked, inline errors |
| `Styleguide.dc.html` | UI kit | colours, type, buttons, fields, parts, rules |

## Rules the screens assume

- **Buttons follow the server.** Every action button maps to a `can*` flag in the projected
  view (`canSetQuestion`, `canSubmitAnswer`, `canReveal`, `canForceReveal`, `canPickResult`,
  `canGoNext`, `canSkipRound`). Don't re-derive the rules on the client.
- **One primary button per screen**, lime, at the bottom: the thing the round is waiting for.
- **Secrecy is shown.** Answers are hidden from everyone including the asker until reveal, so
  every pre-reveal screen carries a lock line saying so.
- **`question: null` is a real state** → "<nickname> is asking out loud", not an empty field.
- **Reconnects are invisible.** The socket closes every 300 s by design; show nothing for the
  first ~3 s.
- Touch targets ≥ 44px, primary actions 56–62px.

## Known gap vs. the game description

The description ends the round at "show answers". The API does not: `pickResult`
(winner + loser, distinct, final) is what moves a round from `revealed` to `resolved`, and
only then does `nextRound` rotate. So `Revealed.dc.html` includes the Best / Worst pick, and
it's what feeds the scoreboard. Pure reveal-and-move-on would need an API change — a
`skipResult` action or a setting that auto-resolves.
