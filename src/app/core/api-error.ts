import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ErrorCode } from '../models';

/** Errors the socket hands back in `connect_error` / action acks look the same. */
export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && typeof (value as ApiError).code === 'string';
}

/** Normalises anything HttpClient can throw into the `{ code, message }` shape the API promises. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: ApiError } | null;
    if (body && isApiError(body.error)) {
      return body.error;
    }
    // status 0 is a network failure or a CORS rejection — never a server verdict
    return { code: statusToCode(error.status), message: error.status === 0 ? 'No connection' : error.message };
  }
  return { code: 'internal-server-error', message: error instanceof Error ? error.message : 'Something went wrong' };
}

function statusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'bad-request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 409:
      return 'conflict';
    case 410:
      return 'gone';
    case 429:
      return 'too-many-requests';
    default:
      return 'internal-server-error';
  }
}

/** Copy for the codes that land on a form field or in a toast (plan §11). */
export function errorMessage(error: ApiError): string {
  switch (error.code) {
    case 'nickname-taken':
      return 'Someone online is already using that name. Add a letter.';
    case 'unauthorized':
      return 'Wrong password.';
    case 'not-found':
      return 'No room with that code. Check the last two digits.';
    case 'session-full':
      return 'Room is full.';
    case 'session-finished':
      return 'That game is already over.';
    case 'gone':
      return 'This room is over.';
    case 'conflict':
      return 'The round moved on.';
    case 'too-many-requests':
      return 'Slow down a second.';
    case 'forbidden':
      return "You can't do that right now.";
    default:
      return error.message || 'Something went wrong.';
  }
}
