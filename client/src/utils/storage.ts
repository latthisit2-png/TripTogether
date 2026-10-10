// src/utils/storage.ts
// Store tokens in localStorage (client-side only)

const OWNER_TOKENS_KEY = 'tt_owner_tokens';
const PARTICIPANT_TOKENS_KEY = 'tt_participant_tokens';
const MY_TRIPS_KEY = 'tt_my_trips';

export interface StoredTrip {
  id: string;
  title: string;
  inviteToken: string;
  ownerToken?: string;
  participantId?: string;
  participantToken?: string;
  role: 'owner' | 'participant';
  joinedAt: string;
}

function safeGetItem(key: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function safeSetItem(key: string, value: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function saveOwnerToken(tripId: string, ownerToken: string): void {
  const tokens = safeGetItem(OWNER_TOKENS_KEY);
  tokens[tripId] = ownerToken;
  safeSetItem(OWNER_TOKENS_KEY, tokens);
}

export function getOwnerToken(tripId: string): string | null {
  return safeGetItem(OWNER_TOKENS_KEY)[tripId] || null;
}

export function saveParticipantToken(tripId: string, participantToken: string): void {
  const tokens = safeGetItem(PARTICIPANT_TOKENS_KEY);
  tokens[tripId] = participantToken;
  safeSetItem(PARTICIPANT_TOKENS_KEY, tokens);
}

export function getParticipantToken(tripId: string): string | null {
  return safeGetItem(PARTICIPANT_TOKENS_KEY)[tripId] || null;
}

export function saveMyTrip(trip: StoredTrip): void {
  if (typeof window === 'undefined') return;
  try {
    const trips: StoredTrip[] = JSON.parse(localStorage.getItem(MY_TRIPS_KEY) || '[]');
    const existing = trips.findIndex((t) => t.id === trip.id);
    if (existing >= 0) {
      trips[existing] = trip;
    } else {
      trips.unshift(trip);
    }
    localStorage.setItem(MY_TRIPS_KEY, JSON.stringify(trips));
  } catch { /* ignore */ }
}

export function getMyTrips(): StoredTrip[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MY_TRIPS_KEY) || '[]');
  } catch {
    return [];
  }
}
