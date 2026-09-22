import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'start',
    loadComponent: () => import('./features/start/pick-game.page').then((m) => m.PickGamePage),
  },
  {
    // one setup screen for every game; `gameType` is what it creates the session with
    path: 'start/:gameType',
    loadComponent: () => import('./features/start/create-session.page').then((m) => m.CreateSessionPage),
  },
  {
    path: 'join',
    loadComponent: () => import('./features/join/join-session.page').then((m) => m.JoinSessionPage),
  },
  {
    // One route for the whole session. State arrives by push; a route per phase would turn every
    // snapshot into a navigation, and a reconnect that replays one into a second navigation.
    path: 's/:code',
    loadComponent: () => import('./features/session/session.page').then((m) => m.SessionPage),
  },
  { path: '**', redirectTo: '' },
];
