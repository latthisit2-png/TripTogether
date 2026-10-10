// src/controllers/tripController.ts
import { Request, Response, NextFunction } from 'express';
import { AvailabilityStatus } from '@prisma/client';
import prisma from '../config/database';
import { generateToken, hashToken, verifyToken } from '../utils/token';
import { calculateBestMatches, ParticipantAvailability, TimeSlot } from '../services/matchService';
import { createError } from '../middleware/errorHandler';

// POST /api/trips
export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, location, startDate, endDate } = req.body;

    const inviteToken = generateToken(16);
    const ownerToken = generateToken(32);
    const ownerTokenHash = await hashToken(ownerToken);

    const trip = await prisma.trip.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        inviteToken,
        ownerTokenHash,
      },
    });

    res.status(201).json({
      success: true,
      message: 'สร้างทริปสำเร็จ',
      data: {
        trip: sanitizeTrip(trip),
        inviteToken,
        ownerToken, // Only returned once at creation
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trips/:tripId
export async function getTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: {
          select: { id: true, displayName: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    res.json({
      success: true,
      data: {
        trip: sanitizeTrip(trip),
        participants: trip.participants,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trips/invite/:inviteToken
export async function getTripByInviteToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inviteToken = req.params.inviteToken as string;

    const trip = await prisma.trip.findUnique({
      where: { inviteToken },
      include: {
        participants: {
          select: { id: true, displayName: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!trip) {
      return next(createError('ไม่พบทริปนี้ หรือลิงก์เชิญไม่ถูกต้อง', 404));
    }

    res.json({
      success: true,
      data: {
        trip: sanitizeTrip(trip),
        participants: trip.participants,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/trips/:tripId/participants
export async function joinTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;
    const { displayName, inviteToken } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    if (trip.inviteToken !== inviteToken) {
      return next(createError('ลิงก์เชิญไม่ถูกต้อง', 403));
    }

    if (trip.votingClosed) {
      return next(createError('ทริปนี้ปิดรับการโหวตแล้ว', 403));
    }

    const participantToken = generateToken(24);
    const participantTokenHash = await hashToken(participantToken);

    const participant = await prisma.tripParticipant.create({
      data: {
        tripId,
        displayName,
        participantTokenHash,
      },
      select: { id: true, displayName: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      message: 'เข้าร่วมทริปสำเร็จ',
      data: {
        participant,
        participantToken, // Only returned once
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/trips/:tripId/availability
export async function saveAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;
    const { participantToken, responses } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    if (trip.votingClosed) {
      return next(createError('ทริปนี้ปิดรับการโหวตแล้ว ไม่สามารถแก้ไขคำตอบได้', 403));
    }

    // Find participant by token
    const participants = await prisma.tripParticipant.findMany({
      where: { tripId },
    });

    let matchedParticipant = null;
    for (const p of participants) {
      const isValid = await verifyToken(participantToken, p.participantTokenHash);
      if (isValid) {
        matchedParticipant = p;
        break;
      }
    }

    if (!matchedParticipant) {
      return next(createError('ไม่พบข้อมูลสมาชิกหรือ token ไม่ถูกต้อง', 403));
    }

    // Validate dates are within trip range
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);

    // Upsert each response
    const upsertPromises = responses.map(
      (r: { date: string; status: AvailabilityStatus; timeSlots: TimeSlot[] }) => {
        const availableDate = new Date(r.date);
        if (availableDate < tripStart || availableDate > tripEnd) {
          throw createError(`วันที่ ${r.date} อยู่นอกช่วงทริป`, 400);
        }

        return prisma.availabilityResponse.upsert({
          where: {
            participantId_availableDate: {
              participantId: matchedParticipant!.id,
              availableDate,
            },
          },
          update: {
            status: r.status,
            timeSlots: r.timeSlots,
          },
          create: {
            participantId: matchedParticipant!.id,
            tripId,
            availableDate,
            status: r.status,
            timeSlots: r.timeSlots,
          },
        });
      }
    );

    await Promise.all(upsertPromises);

    res.json({
      success: true,
      message: 'บันทึกวันว่างสำเร็จ',
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trips/:tripId/availability
export async function getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: {
          select: { id: true, displayName: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    const responses = await prisma.availabilityResponse.findMany({
      where: { tripId },
      include: {
        participant: { select: { displayName: true } },
      },
      orderBy: { availableDate: 'asc' },
    });

    res.json({
      success: true,
      data: {
        trip: sanitizeTrip(trip),
        participants: trip.participants,
        responses: responses.map((r) => ({
          id: r.id,
          participantId: r.participantId,
          displayName: r.participant.displayName,
          date: r.availableDate,
          status: r.status,
          timeSlots: r.timeSlots,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trips/:tripId/matches
export async function getBestMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: { select: { id: true, displayName: true } },
      },
    });

    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    const responses = await prisma.availabilityResponse.findMany({
      where: { tripId },
    });

    const participantResponses: ParticipantAvailability[] = responses.map((r) => ({
      participantId: r.participantId,
      displayName: trip.participants.find((p) => p.id === r.participantId)?.displayName || '',
      availableDate: r.availableDate,
      status: r.status,
      timeSlots: (r.timeSlots as TimeSlot[]) || [],
    }));

    const matches = calculateBestMatches(
      trip.participants,
      participantResponses,
      trip.startDate,
      trip.endDate
    );

    res.json({
      success: true,
      data: {
        trip: sanitizeTrip(trip),
        totalParticipants: trip.participants.length,
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/trips/:tripId/confirm
export async function confirmTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;
    const { ownerToken, confirmedDate, confirmedTimeSlots } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    const isOwner = await verifyToken(ownerToken, trip.ownerTokenHash);
    if (!isOwner) {
      return next(createError('คุณไม่มีสิทธิ์ยืนยันวันนัดของทริปนี้', 403));
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'CONFIRMED',
        confirmedDate: new Date(confirmedDate),
        confirmedTimeSlots,
        votingClosed: true,
      },
    });

    res.json({
      success: true,
      message: 'ยืนยันวันนัดสำเร็จ',
      data: { trip: sanitizeTrip(updatedTrip) },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/trips/:tripId/close-voting
export async function closeVoting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;
    const { ownerToken } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    const isOwner = await verifyToken(ownerToken, trip.ownerTokenHash);
    if (!isOwner) {
      return next(createError('คุณไม่มีสิทธิ์ปิดการโหวตของทริปนี้', 403));
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { votingClosed: true, status: 'CLOSED' },
    });

    res.json({
      success: true,
      message: 'ปิดรับการโหวตสำเร็จ',
      data: { trip: sanitizeTrip(updatedTrip) },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/trips/:tripId/open-voting
export async function openVoting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = req.params.tripId as string;
    const { ownerToken } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return next(createError('ไม่พบทริปนี้', 404));
    }

    const isOwner = await verifyToken(ownerToken, trip.ownerTokenHash);
    if (!isOwner) {
      return next(createError('คุณไม่มีสิทธิ์เปิดการโหวตของทริปนี้', 403));
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { votingClosed: false, status: 'OPEN' },
    });

    res.json({
      success: true,
      message: 'เปิดรับการโหวตสำเร็จ',
      data: { trip: sanitizeTrip(updatedTrip) },
    });
  } catch (error) {
    next(error);
  }
}

// Helper: strip sensitive fields from trip before sending
function sanitizeTrip(trip: any): any {
  const { ownerTokenHash, ...rest } = trip;
  void ownerTokenHash;
  return rest;
}
