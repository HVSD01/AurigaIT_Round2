const mongoose = require('mongoose');
const { getNow } = require('../utils/clock');

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Appointment start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'Appointment end time is required'],
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled', 'completed', 'no-show'],
      default: 'booked',
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    feeCharged: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    createdAt: {
      type: Date,
      default: () => getNow(),
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for fast doctor's day lookups and overlap checks
appointmentSchema.index({ doctor: 1, startTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;

