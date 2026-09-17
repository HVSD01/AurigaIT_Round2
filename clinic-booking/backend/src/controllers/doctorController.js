const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// @desc    List all doctors
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / add a doctor
// @route   POST /api/doctors
// @access  Private
const createDoctor = async (req, res, next) => {
  try {
    const { name, specialization, consultationFee } = req.body;

    const doctor = await Doctor.create({
      name,
      specialization: specialization || 'General Practice',
      consultationFee: Number(consultationFee),
    });

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a doctor's full schedule for a given day
// @route   GET /api/doctors/:id/day?date=YYYY-MM-DD
// @access  Private
const getDoctorDaySchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" is required (format: YYYY-MM-DD)',
      });
    }

    // Parse date range for the entire day [00:00:00.000 to 23:59:59.999] in UTC / local
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    // Find all appointments for that doctor on that date, sorted by startTime
    const appointments = await Appointment.find({
      doctor: id,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
      },
      date,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  createDoctor,
  getDoctorDaySchedule,
};

