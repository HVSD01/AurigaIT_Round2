const mongoose = require('mongoose');
const { getNow } = require('../utils/clock');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General Practice',
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Consultation fee cannot be negative'],
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

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;

