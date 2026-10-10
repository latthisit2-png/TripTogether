// src/__tests__/matchService.test.ts
import { calculateBestMatches } from '../services/matchService';
import { AvailabilityStatus } from '@prisma/client';

describe('calculateBestMatches', () => {
  const start = new Date('2025-10-12');
  const end = new Date('2025-10-14');

  const participants = [
    { id: 'p1', displayName: 'A' },
    { id: 'p2', displayName: 'B' },
    { id: 'p3', displayName: 'C' },
  ];

  test('วันที่ทุกคนว่างแน่นอนต้องอยู่อันดับแรก', () => {
    const responses = [
      // Oct 12: all available
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p2', displayName: 'B', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p3', displayName: 'C', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      // Oct 13: only 2 available
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-13'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p2', displayName: 'B', availableDate: new Date('2025-10-13'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
    ];

    const matches = calculateBestMatches(participants, responses, start, end);
    expect(matches[0].date).toBe('2025-10-12');
    expect(matches[0].allAvailable).toBe(true);
  });

  test('จัดอันดับโดย availableCount จากมากไปน้อยเมื่อไม่มีวันที่ทุกคนว่าง', () => {
    const responses = [
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p2', displayName: 'B', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      // Oct 13: 1 available
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-13'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
    ];

    const matches = calculateBestMatches(participants, responses, start, end);
    expect(matches[0].date).toBe('2025-10-12');
    expect(matches[0].availableCount).toBe(2);
  });

  test('ไม่นับสมาชิกที่ยังไม่ตอบว่าไม่ว่าง', () => {
    const responses = [
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
    ];

    const matches = calculateBestMatches(participants, responses, start, end);
    const oct12 = matches.find((m) => m.date === '2025-10-12');
    expect(oct12?.noResponseCount).toBe(2);
    expect(oct12?.unavailableCount).toBe(0);
    expect(oct12?.allAvailable).toBe(false);
  });

  test('allAvailable ต้องเป็น false เมื่อยังมีสมาชิกไม่ตอบ', () => {
    const responses = [
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p2', displayName: 'B', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      // p3 has not responded
    ];

    const matches = calculateBestMatches(participants, responses, start, end);
    const oct12 = matches.find((m) => m.date === '2025-10-12');
    expect(oct12?.allAvailable).toBe(false);
    expect(oct12?.noResponseCount).toBe(1);
  });

  test('กรณีไม่มีสมาชิกและไม่มีคำตอบ', () => {
    const matches = calculateBestMatches([], [], start, end);
    expect(matches).toHaveLength(3);
    expect(matches[0].totalParticipants).toBe(0);
  });

  test('คำนวณ noResponseNames ได้ถูกต้อง', () => {
    const responses = [
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
    ];

    const matches = calculateBestMatches(participants, responses, start, end);
    const oct12 = matches.find((m) => m.date === '2025-10-12');
    expect(oct12?.noResponseNames).toContain('B');
    expect(oct12?.noResponseNames).toContain('C');
    expect(oct12?.availableNames).toContain('A');
  });

  test('จัดอันดับโดยใช้ maybeCount เป็น tiebreaker', () => {
    const participants2 = [
      { id: 'p1', displayName: 'A' },
      { id: 'p2', displayName: 'B' },
    ];
    const responses = [
      // Oct 12: 1 available, 0 maybe
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-12'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      // Oct 13: 1 available, 1 maybe
      { participantId: 'p1', displayName: 'A', availableDate: new Date('2025-10-13'), status: AvailabilityStatus.AVAILABLE, timeSlots: [] },
      { participantId: 'p2', displayName: 'B', availableDate: new Date('2025-10-13'), status: AvailabilityStatus.MAYBE, timeSlots: [] },
    ];

    const start2 = new Date('2025-10-12');
    const end2 = new Date('2025-10-13');
    const matches = calculateBestMatches(participants2, responses, start2, end2);
    // Oct 13 has 1 available + 1 maybe (score = 1010) vs Oct 12 has 1 available + 0 maybe (score = 1000)
    expect(matches[0].date).toBe('2025-10-13');
  });
});
