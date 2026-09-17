const express = require('express');
const { body } = require('express-validator');
const { createPatient, searchPatients, getPatients } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const createPatientValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Patient name is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
];

// All patient routes require staff authentication
router.use(protect);

router.get('/', getPatients);
router.post('/', validate(createPatientValidation), createPatient);
router.get('/search', searchPatients);

module.exports = router;

