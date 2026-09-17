const mongoose = require('mongoose');
const { getNow } = require('../utils/clock');

const outboxSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: 'reminder',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    message: {
      type: String,
      required: true,
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

outboxSchema.index({ createdAt: -1 });

const Outbox = mongoose.model('Outbox', outboxSchema);

module.exports = Outbox;

