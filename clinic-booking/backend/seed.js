require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');
const Appointment = require('./src/models/Appointment');
const Outbox = require('./src/models/Outbox');
const { getNow } = require('./src/utils/clock');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Outbox.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Front Desk Staff User...');
    const staffUser = await User.create({
      name: 'Sarah FrontDesk',
      email: 'desk@clinic.com',
      password: 'password123',
    });

    console.log('[Seed] Seeding Doctors...');
    const doctors = await Doctor.insertMany([
      { name: 'Dr. Gregory House', specialization: 'Diagnostic Medicine', consultationFee: 250 },
      { name: 'Dr. Allison Cameron', specialization: 'Immunology', consultationFee: 180 },
      { name: 'Dr. Robert Chase', specialization: 'Intensive Care & Surgery', consultationFee: 200 },
      { name: 'Dr. James Wilson', specialization: 'Oncology', consultationFee: 220 },
    ]);

    console.log('[Seed] Seeding Patients...');
    const patients = await Patient.insertMany([
      { name: 'John Doe', phone: '+1 555-0101', email: 'john.doe@example.com' },
      { name: 'Jane Smith', phone: '+1 555-0102', email: 'jane.smith@example.com' },
      { name: 'Robert Johnson', phone: '+1 555-0103', email: 'robert.j@example.com' },
      { name: 'Emily Davis', phone: '+1 555-0104', email: 'emily.d@example.com' },
      { name: 'Michael Brown', phone: '+1 555-0105', email: 'michael.b@example.com' },
    ]);

    console.log('[Seed] Seeding Initial Appointments...');
    const today = new Date().toISOString().split('T')[0];

    const apt1 = await Appointment.create({
      doctor: doctors[0]._id,
      patient: patients[0]._id,
      startTime: new Date(`${today}T09:00:00.000Z`),
      endTime: new Date(`${today}T09:30:00.000Z`),
      status: 'booked',
      createdBy: staffUser._id,
    });

    const apt2 = await Appointment.create({
      doctor: doctors[0]._id,
      patient: patients[1]._id,
      startTime: new Date(`${today}T10:00:00.000Z`),
      endTime: new Date(`${today}T10:45:00.000Z`),
      status: 'booked',
      createdBy: staffUser._id,
    });

    const apt3 = await Appointment.create({
      doctor: doctors[1]._id,
      patient: patients[2]._id,
      startTime: new Date(`${today}T11:00:00.000Z`),
      endTime: new Date(`${today}T11:30:00.000Z`),
      status: 'booked',
      createdBy: staffUser._id,
    });

    console.log('[Seed] Seeding completed successfully!');
    console.log('-------------------------------------------');
    console.log('Staff Credentials:');
    console.log('Email: desk@clinic.com');
    console.log('Password: password123');
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();

