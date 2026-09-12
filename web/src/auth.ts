import { useSyncExternalStore } from 'react';
export type Session = { email: string; expires: number };
const marker = 'foundations-session';
const pending = 'foundations-logout-pending';
const readSaved = (): Session | null => {
  try {
    const s = JSON.parse(localStorage.getItem(marker) || 'null');
    return s && typeof s.email === 'string' && s.expires > Date.now() ? s : null;
  } catch {
    return null;
  }
};
let session: Session | null = null;
let ready = false;
let generation = 0;
const listeners = new Set<() => void>();
let snapshot: { session: Session | null; ready: boolean } = { session, ready };
function notify() {
  snapshot = { session, ready };
  listeners.forEach((f) => f());
}
export const authSession = () => session;
export const authGeneration = () => generation;
export const useAuth = () =>
  useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => snapshot,
  );
export function lockSession() {
  generation++;
  session = null;
  localStorage.removeItem(marker);
  ready = true;
  notify();
}
let authQueue: Promise<unknown> = Promise.resolve();
function authLock<T>(work: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request('foundations-auth', work);
  const result = authQueue.then(work, work);
  authQueue = result.catch(() => {});
  return result;
}
const revokePending = () => authLock(revokePendingUnlocked);
async function revokePendingUnlocked() {
  if (localStorage.getItem(pending)) {
    const r = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw Error('Could not finish signing out. Try again.');
    localStorage.removeItem(pending);
  }
}
export async function verifySession(): Promise<boolean> {
  const epoch = generation;
  try {
    await revokePending();
    const r = await fetch('/api/v1/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (epoch !== generation) return false;
    if (r.status === 401) {
      lockSession();
      return false;
    }
    if (!r.ok) throw Error('Session unavailable');
    const next = (await r.json()) as Session;
    if (epoch !== generation) return false;
    session = next;
    localStorage.setItem(marker, JSON.stringify(next));
    ready = true;
    notify();
    return true;
  } catch {
    if (epoch !== generation) return false;
    session = localStorage.getItem(pending) ? null : readSaved();
    ready = true;
    notify();
    return false;
  }
}
export async function signIn(email: string, password: string) {
  return authLock(async () => {
    await revokePendingUnlocked();
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok)
      throw Error(
        r.status === 429
          ? 'Too many attempts. Please try again later.'
          : r.status === 401
            ? 'Email or password is incorrect.'
            : 'Could not sign in. Please try again.',
      );
    generation++;
    session = await r.json();
    localStorage.setItem(marker, JSON.stringify(session));
    ready = true;
    notify();
  });
}
export async function signOut() {
  localStorage.setItem(pending, '1');
  lockSession();
  try {
    await revokePending();
  } catch {
    /* Retried before any later login or sync. */
  }
}
window.addEventListener('storage', (e) => {
  if (e.key === marker || e.key === pending) {
    generation++;
    session = localStorage.getItem(pending) ? null : readSaved();
    ready = true;
    notify();
  }
});
let started = false;
export function initializeAuth() {
  if (started) return;
  started = true;
  sessionStorage.removeItem('foundations-key');
  void verifySession();
  window.addEventListener('online', () => void verifySession());
  setInterval(() => {
    if (session && session.expires <= Date.now()) lockSession();
  }, 30000);
}
