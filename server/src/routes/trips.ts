// src/routes/trips.ts
import { Router } from 'express';
import {
  createTrip,
  getTrip,
  getTripByInviteToken,
  joinTrip,
  saveAvailability,
  getAvailability,
  getBestMatches,
  confirmTrip,
  closeVoting,
  openVoting,
} from '../controllers/tripController';
import {
  createTripValidators,
  joinTripValidators,
  availabilityValidators,
  confirmTripValidators,
  ownerTokenValidators,
} from '../validators/tripValidators';
import { validate } from '../middleware/validate';

const router = Router();

// Public routes
router.post('/', createTripValidators, validate, createTrip);
router.get('/invite/:inviteToken', getTripByInviteToken);
router.get('/:tripId', getTrip);
router.get('/:tripId/availability', getAvailability);
router.get('/:tripId/matches', getBestMatches);

// Requires inviteToken in body (participant joins)
router.post('/:tripId/participants', joinTripValidators, validate, joinTrip);

// Requires participantToken in body
router.put('/:tripId/availability', availabilityValidators, validate, saveAvailability);

// Requires ownerToken in body
router.patch('/:tripId/confirm', confirmTripValidators, validate, confirmTrip);
router.patch('/:tripId/close-voting', ownerTokenValidators, validate, closeVoting);
router.patch('/:tripId/open-voting', ownerTokenValidators, validate, openVoting);

export default router;
