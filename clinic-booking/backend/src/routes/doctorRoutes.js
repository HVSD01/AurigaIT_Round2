const express = require('express');
const { body } = require('express-validator');
const { getDoctors, createDoctor, getDoctorDaySchedule } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const createDoctorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required'),
  body('consultationFee')
    .notEmpty()
    .withMessage('Consultation fee is required')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('specialization')
    .optional()
    .trim(),
];

// All doctor routes require staff authentication
router.use(protect);

router.get('/', getDoctors);
router.post('/', validate(createDoctorValidation), createDoctor);
router.get('/:id/day', getDoctorDaySchedule);

module.exports = router;

