import { LENGTH } from './config';

/**
 * Length is enforced in code, never trusted to the model: all three models broke
 * the 400-600 range at least once when merely asked to obey it.
 */
export function checkLength(body: string): { ok: boolean; len: number } {
  const len = body.trim().length;
  return { ok: len >= LENGTH.min && len <= LENGTH.max, len };
}
