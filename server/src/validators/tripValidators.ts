// src/validators/tripValidators.ts
import { body, param } from 'express-validator';

export const createTripValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกชื่อทริป')
    .isLength({ max: 200 })
    .withMessage('ชื่อทริปต้องไม่เกิน 200 ตัวอักษร'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('รายละเอียดต้องไม่เกิน 1000 ตัวอักษร'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('สถานที่ต้องไม่เกิน 300 ตัวอักษร'),
  body('startDate')
    .notEmpty()
    .withMessage('กรุณาระบุวันที่เริ่มต้น')
    .isISO8601()
    .withMessage('รูปแบบวันที่ไม่ถูกต้อง'),
  body('endDate')
    .notEmpty()
    .withMessage('กรุณาระบุวันที่สิ้นสุด')
    .isISO8601()
    .withMessage('รูปแบบวันที่ไม่ถูกต้อง')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น');
      }
      return true;
    }),
];

export const joinTripValidators = [
  param('tripId').isUUID().withMessage('ID ทริปไม่ถูกต้อง').optional(),
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกชื่อที่ใช้แสดง')
    .isLength({ max: 100 })
    .withMessage('ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  body('inviteToken')
    .notEmpty()
    .withMessage('ต้องระบุ invite token'),
];

export const availabilityValidators = [
  body('participantToken')
    .notEmpty()
    .withMessage('ต้องระบุ participant token'),
  body('responses')
    .isArray({ min: 1 })
    .withMessage('ต้องมีการตอบกลับอย่างน้อย 1 รายการ'),
  body('responses.*.date')
    .isISO8601()
    .withMessage('รูปแบบวันที่ไม่ถูกต้อง'),
  body('responses.*.status')
    .isIn(['AVAILABLE', 'MAYBE', 'UNAVAILABLE'])
    .withMessage('สถานะต้องเป็น AVAILABLE, MAYBE หรือ UNAVAILABLE'),
  body('responses.*.timeSlots')
    .isArray()
    .withMessage('timeSlots ต้องเป็น array')
    .custom((slots: string[]) => {
      const valid = ['morning', 'afternoon', 'evening'];
      if (!slots.every((s) => valid.includes(s))) {
        throw new Error('timeSlots ต้องเป็น morning, afternoon หรือ evening');
      }
      return true;
    }),
];

export const confirmTripValidators = [
  body('ownerToken')
    .notEmpty()
    .withMessage('ต้องระบุ owner token'),
  body('confirmedDate')
    .isISO8601()
    .withMessage('รูปแบบวันที่ไม่ถูกต้อง'),
  body('confirmedTimeSlots')
    .isArray()
    .withMessage('confirmedTimeSlots ต้องเป็น array'),
];

export const ownerTokenValidators = [
  body('ownerToken')
    .notEmpty()
    .withMessage('ต้องระบุ owner token'),
];
