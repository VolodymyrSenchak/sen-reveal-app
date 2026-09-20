# sen-reveal-app

The player client for [sen-reveal-api](../sen-reveal-api/README.md): a party game you play on
five phones in one room. Angular 22, standalone, zoneless, signal-based.

Design: [docs/design](docs/design/README.md) · Plan: [docs/implementation](docs/implementation/sen-reveal.app.implementation-plan.md)

## Requirements

- Node.js 22+
- sen-reveal-api running somewhere the browser can reach, with this origin in its `CORS_ORIGINS`
  (it already defaults to `localhost:4200` for dev)

## Scripts

```bash
npm start           # dev server on http://localhost:4200
npm run build       # production build into dist/sen-reveal-app/browser
npm test            # vitest in watch mode
npm run test:run    # single run
```

## Configuration

One setting, the API origin, in `src/environments/`:

| File | Used by | `apiUrl` |
|---|---|---|
| `environment.ts` | `npm start`, `ng build --configuration development` | `http://localhost:8080` |
| `environment.production.ts` | `npm run build` | the deployed API |

It reaches the app as the `APP_CONFIG` token; nothing else reads it.

## How it is put together

Three layers and one direction of data:

```
SessionTransport          SessionStore                Screens
socket | polling  ──────> view: Signal<SessionView> ──────> components read
                          derived signals                   signals, emit actions
       <───────────────── dispatch(action) <──────────────────
```

- **Nothing here derives game rules.** Whether a button exists is `round.canReveal`, not "am I
  the asker and has everyone answered". The server computes those flags per viewer; the client
  renders them. That is what keeps five phones agreeing with each other.
- **Components are dumb.** They take signal inputs and emit `GameAction`s. No component injects
  `HttpClient` or the socket.
- **One store and one transport per session**, provided at the `/s/:code` route and destroyed
  when you leave it.

```
src/app/
  core/          APP_CONFIG, identity (localStorage), token interceptor, HTTP client, error mapping
  models/        hand-written mirror of the API's SessionView / SenRevealView — the contract
  session/       the signal store, the two transports, the manager that picks between them
  features/      home · pick game · create · join · the session shell and its seven views
  ui/            the kit from Styleguide.dc.html: button, field, chip, avatar, pips, banner…
src/styles/      _tokens.scss (the palette), _base.scss, _kit.scss
```

### Transport

Socket first (`transports: ['websocket']`, `auth: { code, playerToken }`); the server pushes
`session:state` on the handshake, so there is no separate initial GET. Three failed connects in
a row and `TransportManager` moves to HTTP polling at `view.poll.intervalMs`, retrying the socket
every 60 s. A tab hidden for more than a minute drops the socket and polls at 10 s. `session:idle`
waits for a real touch rather than a timer. `session:expired` and `player:removed` end everything
on every screen at once.

The polling transport does **not** send `If-None-Match`. The API sets `ETag` +
`Cache-Control: private, no-cache`, so the browser revalidates by itself and turns the 304 back
into a 200 from cache before `HttpClient` ever sees it.

### Identity

`{ code, playerId, playerToken, nickname }` in `localStorage`, one key per code, so two rooms in
two tabs do not fight. `X-Player-Token` goes on `/state`, `/actions` and `/history` only, via an
interceptor scoped by URL *and* origin — never on create, info or join, and never off-site.
There are no accounts and no refresh: a lost token means rejoining as a new player with a fresh
score. `/s/:code` with no stored token redirects to `/join?code=…`, which is also the link the
lobby's "Share link" copies.

## Testing

`npm run test:run` covers the parts where a mistake is silent:

- the store's version guard (older dropped, **equal applied** — presence updates do not bump
  `version`) and name resolution for a player who left mid-round
- the transport manager against a fake socket: three failures → polling, recovery → polling stops,
  hidden > 60 s → disconnect, `session:idle` → no reconnect until a touch, every terminal event
- `pickScreen` as a table of `(status, phase, isAsker, terminal)` → screen, `round === null`
  included
- the reveal screen's Best / Worst rules (same player cannot be both; a null loser only with one
  answer)
- the interceptor's scoping

What none of that can fake is five clients agreeing with each other. That test is one real game,
three browser profiles, one full circle, against the API.

## Deploying

Vercel static; `vercel.json` sets the output directory and the SPA rewrite. Add the deployed
origin to the API's `CORS_ORIGINS`.
