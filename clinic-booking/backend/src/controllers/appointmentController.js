const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { checkDoctorOverlap } = require('../utils/overlapCheck');
const { calculateCancellationFee } = require('../utils/cancellationFee');

// @desc    Book a new appointment (enforcing server-side overlap check)
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res, next) => {
  try {
    const { doctor, patient, startTime, endTime } = req.body;

    // Validate Doctor exists
    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Validate Patient exists
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime or endTime ISO timestamp',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'startTime must be strictly before endTime',
      });
    }

    // Enforce Server-Side Overlap Rule
    const { hasConflict, conflictingAppointment } = await checkDoctorOverlap({
      doctorId: doctor,
      startTime: start,
      endTime: end,
    });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Doctor already has an active appointment overlapping with this time slot',
        conflict: {
          id: conflictingAppointment._id,
          startTime: conflictingAppointment.startTime,
          endTime: conflictingAppointment.endTime,
          status: conflictingAppointment.status,
        },
      });
    }

    const appointment = await Appointment.create({
      doctor,
      patient,
      startTime: start,
      endTime: end,
      status: 'booked',
      createdBy: req.user ? req.user._id : undefined,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule an existing appointment (Twist 1)
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.status !== 'booked') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment with status "${appointment.status}"`,
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime or endTime ISO timestamp',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'startTime must be strictly before endTime',
      });
    }

    // Overlap check excluding this appointment itself
    const { hasConflict, conflictingAppointment } = await checkDoctorOverlap({
      doctorId: appointment.doctor,
      startTime: start,
      endTime: end,
      excludeAppointmentId: appointment._id,
    });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Doctor already has an active appointment overlapping with the new proposed time slot',
        conflict: {
          id: conflictingAppointment._id,
          startTime: conflictingAppointment.startTime,
          endTime: conflictingAppointment.endTime,
          status: conflictingAppointment.status,
        },
      });
    }

    appointment.startTime = start;
    appointment.endTime = end;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an appointment (enforcing 2h cancellation fee logic)
// @route   PATCH /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate('doctor');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled',
      });
    }

    const doctorFee = appointment.doctor ? appointment.doctor.consultationFee : 0;
    const { feeCharged, hoursUntilAppointment, isLateCancellation, cancelledAt } = calculateCancellationFee(
      appointment.startTime,
      doctorFee
    );

    appointment.status = 'cancelled';
    appointment.cancelledAt = cancelledAt;
    appointment.feeCharged = feeCharged;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: isLateCancellation
        ? `Appointment cancelled within 2 hours of start time. A 10% late cancellation fee of $${feeCharged.toFixed(2)} has been charged.`
        : 'Appointment cancelled free of charge (>2 hours before appointment start).',
      feeDetails: {
        hoursUntilAppointment: Math.round(hoursUntilAppointment * 100) / 100,
        isLateCancellation,
        feeCharged,
        doctorConsultationFee: doctorFee,
      },
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated & sortable list of appointments
// @route   GET /api/appointments?page=&limit=&sortBy=&order=&status=&doctorId=
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const sortBy = req.query.sortBy || 'startTime';
    const order = req.query.order === 'desc' ? -1 : 1;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.doctorId) {
      filter.doctor = req.query.doctorId;
    }

    const total = await Appointment.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search appointments by patient name
// @route   GET /api/appointments/search?patientName=...
// @access  Private
const searchAppointmentsByPatient = async (req, res, next) => {
  try {
    const { patientName } = req.query;

    if (!patientName || patientName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "patientName" is required',
      });
    }

    // Step 1: Find matching patients
    const matchingPatients = await Patient.find({
      name: { $regex: patientName.trim(), $options: 'i' },
    }).select('_id');

    const patientIds = matchingPatients.map((p) => p._id);

    if (patientIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Step 2: Find all appointments for these patients
    const appointments = await Appointment.find({
      patient: { $in: patientIds },
    })
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization consultationFee')
      .populate('patient', 'name phone email')
      .populate('createdBy', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointments,
  searchAppointmentsByPatient,
  getAppointmentById,
};

