const { getNow } = require('./clock');

/**
 * Calculates late cancellation fee based on consultation fee and appointment start time.
 * 
 * Rules:
 * - Cancelled > 2 hours before appointment start -> fee = 0
 * - Cancelled <= 2 hours of appointment start -> fee = 10% (0.10) of doctor's consultation fee
 * 
 * Uses getNow() for virtual clock compatibility.
 * 
 * @param {Date|string} startTime - The scheduled start time of the appointment
 * @param {number} consultationFee - The doctor's consultation fee
 * @returns {{ feeCharged: number, hoursUntilAppointment: number, isLateCancellation: boolean, cancelledAt: Date }}
 */
const calculateCancellationFee = (startTime, consultationFee = 0) => {
  const now = getNow();
  const appointmentStart = new Date(startTime);

  // Difference in hours
  const diffMs = appointmentStart.getTime() - now.getTime();
  const hoursUntilAppointment = diffMs / (1000 * 60 * 60);

  let feeCharged = 0;
  let isLateCancellation = false;

  if (hoursUntilAppointment <= 2) {
    isLateCancellation = true;
    // 10% of consultation fee, rounded to 2 decimal places
    feeCharged = Math.round(Number(consultationFee) * 0.10 * 100) / 100;
  }

  return {
    feeCharged,
    hoursUntilAppointment,
    isLateCancellation,
    cancelledAt: now,
  };
};

module.exports = {
  calculateCancellationFee,
};

