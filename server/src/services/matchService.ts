// src/services/matchService.ts
import { AvailabilityStatus } from '@prisma/client';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ParticipantAvailability {
  participantId: string;
  displayName: string;
  availableDate: Date;
  status: AvailabilityStatus;
  timeSlots: TimeSlot[];
}

export interface DayMatch {
  date: string; // ISO date string YYYY-MM-DD
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

/**
 * Calculate the best matching dates for a trip.
 * Business logic is isolated for testability.
 */
export function calculateBestMatches(
  participants: { id: string; displayName: string }[],
  responses: ParticipantAvailability[],
  tripStartDate: Date,
  tripEndDate: Date
): DayMatch[] {
  const totalParticipants = participants.length;

  // Build a map: participantId -> date -> response
  const responseMap = new Map<string, Map<string, ParticipantAvailability>>();
  for (const response of responses) {
    if (!responseMap.has(response.participantId)) {
      responseMap.set(response.participantId, new Map());
    }
    const dateKey = toDateKey(response.availableDate);
    responseMap.get(response.participantId)!.set(dateKey, response);
  }

  // Enumerate all dates in the trip range
  const dates = enumerateDates(tripStartDate, tripEndDate);

  const dayMatches: DayMatch[] = dates.map((date) => {
    const dateKey = toDateKey(date);

    const availableNames: string[] = [];
    const maybeNames: string[] = [];
    const unavailableNames: string[] = [];
    const noResponseNames: string[] = [];

    const timeSlotSummary = {
      morning: { available: 0, maybe: 0 },
      afternoon: { available: 0, maybe: 0 },
      evening: { available: 0, maybe: 0 },
    };

    for (const participant of participants) {
      const participantResponses = responseMap.get(participant.id);
      const resp = participantResponses?.get(dateKey);

      if (!resp) {
        noResponseNames.push(participant.displayName);
      } else if (resp.status === AvailabilityStatus.AVAILABLE) {
        availableNames.push(participant.displayName);
        for (const slot of resp.timeSlots) {
          if (slot in timeSlotSummary) {
            timeSlotSummary[slot].available++;
          }
        }
      } else if (resp.status === AvailabilityStatus.MAYBE) {
        maybeNames.push(participant.displayName);
        for (const slot of resp.timeSlots) {
          if (slot in timeSlotSummary) {
            timeSlotSummary[slot].maybe++;
          }
        }
      } else {
        unavailableNames.push(participant.displayName);
      }
    }

    const availableCount = availableNames.length;
    const maybeCount = maybeNames.length;
    const unavailableCount = unavailableNames.length;
    const noResponseCount = noResponseNames.length;
    const allAvailable = availableCount === totalParticipants && totalParticipants > 0;

    // Scoring: prioritize available, then maybe, penalize no-response
    const score =
      (allAvailable ? 1000000 : 0) +
      availableCount * 1000 +
      maybeCount * 10 -
      noResponseCount;

    return {
      date: dateKey,
      availableCount,
      maybeCount,
      unavailableCount,
      noResponseCount,
      totalParticipants,
      allAvailable,
      availableNames,
      maybeNames,
      unavailableNames,
      noResponseNames,
      timeSlotSummary,
      score,
    };
  });

  // Sort by score descending
  dayMatches.sort((a, b) => b.score - a.score);

  return dayMatches;
}

function toDateKey(date: Date): string {
  // Ensure we use UTC date to avoid timezone issues
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function enumerateDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(Date.UTC(
    new Date(start).getUTCFullYear(),
    new Date(start).getUTCMonth(),
    new Date(start).getUTCDate()
  ));
  const endTime = new Date(Date.UTC(
    new Date(end).getUTCFullYear(),
    new Date(end).getUTCMonth(),
    new Date(end).getUTCDate()
  )).getTime();

  while (current.getTime() <= endTime) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}
