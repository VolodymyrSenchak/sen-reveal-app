/** Every API failure is `{ error: { code, message } }` with one of these codes. */
export type ErrorCode =
  | 'bad-request'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'gone'
  | 'too-many-requests'
  | 'internal-server-error'
  | 'db-error'
  | 'kicked'
  | 'left'
  | 'nickname-taken'
  | 'session-full'
  | 'session-finished';

export interface ApiError {
  code: ErrorCode;
  message: string;
}

/** Why a session screen turned into a dead end. */
export type TerminalReason = 'expired' | 'kicked' | 'left' | 'replaced' | 'unauthorized' | 'not-found' | 'finished';
