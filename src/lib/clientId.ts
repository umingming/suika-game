'use client';

const CLIENT_ID_KEY = 'suika-client-id';

export function getOrCreateClientId(): string {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const clientId = window.crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

export function getClientHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-client-id': getOrCreateClientId(),
  };
}
