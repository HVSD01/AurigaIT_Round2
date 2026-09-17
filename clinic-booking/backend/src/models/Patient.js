const mongoose = require('mongoose');
const { getNow } = require('../utils/clock');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
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

// Text index on name for fast prefix/substring search
patientSchema.index({ name: 'text' });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

