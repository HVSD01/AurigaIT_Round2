const Appointment = require('../models/Appointment');

/**
 * Checks if a proposed appointment time range overlaps with any existing 'booked' appointment
 * for the specified doctor.
 * 
 * Overlap rule:
 * [newStart, newEnd) conflicts with [existingStart, existingEnd) if:
 *   newStart < existingEnd AND newEnd > existingStart
 * 
 * @param {Object} params
 * @param {string|ObjectId} params.doctorId - The ID of the doctor
 * @param {Date|string} params.startTime - Proposed start time
 * @param {Date|string} params.endTime - Proposed end time
 * @param {string|ObjectId} [params.excludeAppointmentId=null] - Optional appointment ID to exclude (e.g. for rescheduling)
 * @returns {Promise<{ hasConflict: boolean, conflictingAppointment: Object|null }>}
 */
const checkDoctorOverlap = async ({ doctorId, startTime, endTime, excludeAppointmentId = null }) => {
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
    throw new Error('Invalid startTime or endTime provided for overlap check');
  }

  if (newStart >= newEnd) {
    throw new Error('Appointment startTime must be strictly before endTime');
  }

  // Find any existing appointment for this doctor in 'booked' status overlapping the proposed window
  const query = {
    doctor: doctorId,
    status: 'booked',
    startTime: { $lt: newEnd },
    endTime: { $gt: newStart },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflictingAppointment = await Appointment.findOne(query);

  return {
    hasConflict: !!conflictingAppointment,
    conflictingAppointment,
  };
};

module.exports = {
  checkDoctorOverlap,
};

