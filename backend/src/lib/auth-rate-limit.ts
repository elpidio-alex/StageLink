const attempts = new Map<string, { failures: number; lockedUntil: number }>();
const maxFailures = 5;
const lockDurationMs = 15 * 60 * 1000;

export function canAttemptLogin(identifier: string) {
  const state = attempts.get(identifier);
  if (!state) return true;
  if (state.lockedUntil > Date.now()) return false;
  if (state.lockedUntil) attempts.delete(identifier);
  return true;
}

export function recordLoginFailure(identifier: string) {
  const state = attempts.get(identifier) ?? { failures: 0, lockedUntil: 0 };
  state.failures += 1;
  if (state.failures >= maxFailures)
    state.lockedUntil = Date.now() + lockDurationMs;
  attempts.set(identifier, state);
}

export function clearLoginFailures(identifier: string) {
  attempts.delete(identifier);
}
