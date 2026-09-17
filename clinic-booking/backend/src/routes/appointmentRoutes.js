const express = require('express');
const { body, param } = require('express-validator');
const {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointments,
  searchAppointmentsByPatient,
  getAppointmentById,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const createAppointmentValidation = [
  body('doctor')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid Doctor ID format'),
  body('patient')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isMongoId()
    .withMessage('Invalid Patient ID format'),
  body('startTime')
    .notEmpty()
    .withMessage('startTime is required')
    .isISO8601()
    .withMessage('startTime must be a valid ISO 8601 date string'),
  body('endTime')
    .notEmpty()
    .withMessage('endTime is required')
    .isISO8601()
    .withMessage('endTime must be a valid ISO 8601 date string'),
];

const rescheduleValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Appointment ID'),
  body('startTime')
    .notEmpty()
    .withMessage('startTime is required')
    .isISO8601()
    .withMessage('startTime must be a valid ISO 8601 date string'),
  body('endTime')
    .notEmpty()
    .withMessage('endTime is required')
    .isISO8601()
    .withMessage('endTime must be a valid ISO 8601 date string'),
];

// All appointment routes require authentication
router.use(protect);

router.post('/', validate(createAppointmentValidation), createAppointment);
router.get('/', getAppointments);
router.get('/search', searchAppointmentsByPatient);
router.get('/:id', getAppointmentById);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/reschedule', validate(rescheduleValidation), rescheduleAppointment);

module.exports = router;

