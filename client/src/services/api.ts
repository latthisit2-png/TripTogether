// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response types
export interface Trip {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  inviteToken: string;
  status: 'OPEN' | 'CONFIRMED' | 'CLOSED';
  confirmedDate?: string;
  confirmedTimeSlots?: string[];
  votingClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  displayName: string;
  createdAt: string;
}

export interface AvailabilityResponse {
  id: string;
  participantId: string;
  displayName: string;
  date: string;
  status: 'AVAILABLE' | 'MAYBE' | 'UNAVAILABLE';
  timeSlots: string[];
}

export interface DayMatch {
  date: string;
  availableCount: number;
  maybeCount: number;
  unavailableCount: number;
  noResponseCount: number;
  totalParticipants: number;
  allAvailable: boolean;
  availableNames: string[];
  maybeNames: string[];
  unavailableNames: string[];
  noResponseNames: string[];
  timeSlotSummary: {
    morning: { available: number; maybe: number };
    afternoon: { available: number; maybe: number };
    evening: { available: number; maybe: number };
  };
  score: number;
}

// API functions
export async function createTrip(data: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
}) {
  const res = await api.post('/trips', data);
  return res.data as {
    success: boolean;
    data: { trip: Trip; inviteToken: string; ownerToken: string };
  };
}

export async function getTripById(tripId: string) {
  const res = await api.get(`/trips/${tripId}`);
  return res.data as {
    success: boolean;
    data: { trip: Trip; participants: Participant[] };
  };
}

export async function getTripByInviteToken(inviteToken: string) {
  const res = await api.get(`/trips/invite/${inviteToken}`);
  return res.data as {
    success: boolean;
    data: { trip: Trip; participants: Participant[] };
  };
}

export async function joinTrip(tripId: string, data: { displayName: string; inviteToken: string }) {
  const res = await api.post(`/trips/${tripId}/participants`, data);
  return res.data as {
    success: boolean;
    data: { participant: Participant; participantToken: string };
  };
}

export async function saveAvailability(
  tripId: string,
  data: {
    participantToken: string;
    responses: { date: string; status: string; timeSlots: string[] }[];
  }
) {
  const res = await api.put(`/trips/${tripId}/availability`, data);
  return res.data as { success: boolean; message: string };
}

export async function getAvailability(tripId: string) {
  const res = await api.get(`/trips/${tripId}/availability`);
  return res.data as {
    success: boolean;
    data: { trip: Trip; participants: Participant[]; responses: AvailabilityResponse[] };
  };
}

export async function getBestMatches(tripId: string) {
  const res = await api.get(`/trips/${tripId}/matches`);
  return res.data as {
    success: boolean;
    data: { trip: Trip; totalParticipants: number; matches: DayMatch[] };
  };
}

export async function confirmTrip(
  tripId: string,
  data: { ownerToken: string; confirmedDate: string; confirmedTimeSlots: string[] }
) {
  const res = await api.patch(`/trips/${tripId}/confirm`, data);
  return res.data as { success: boolean; data: { trip: Trip } };
}

export async function closeVoting(tripId: string, ownerToken: string) {
  const res = await api.patch(`/trips/${tripId}/close-voting`, { ownerToken });
  return res.data as { success: boolean; data: { trip: Trip } };
}

export async function openVoting(tripId: string, ownerToken: string) {
  const res = await api.patch(`/trips/${tripId}/open-voting`, { ownerToken });
  return res.data as { success: boolean; data: { trip: Trip } };
}

export default api;
