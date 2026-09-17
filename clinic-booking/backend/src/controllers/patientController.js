const Patient = require('../models/Patient');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    const patient = await Patient.create({
      name,
      phone,
      email: email || '',
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search patients by name
// @route   GET /api/patients/search?name=...
// @access  Private
const searchPatients = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "name" is required',
      });
    }

    // Case-insensitive regex search
    const patients = await Patient.find({
      name: { $regex: name.trim(), $options: 'i' },
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients (for UI dropdowns)
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().sort({ name: 1 }).limit(100);
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  searchPatients,
  getPatients,
};

