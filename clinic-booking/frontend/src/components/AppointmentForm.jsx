import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Calendar, Clock, User, Stethoscope, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

const AppointmentForm = ({ doctors, patients, onAppointmentCreated, onPatientAdded }) => {
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  
  // Quick patient modal state
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuickAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/patients', {
        name: newPatientName,
        phone: newPatientPhone,
        email: newPatientEmail,
      });
      const createdPatient = res.data.data;
      onPatientAdded(createdPatient);
      setPatientId(createdPatient._id);
      setShowNewPatient(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add patient');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setConflictDetails(null);
    setSuccessMsg('');

    if (!doctorId || !patientId || !date || !startTime || !endTime) {
      setError('Please fill in all required booking fields.');
      return;
    }

    const startISO = new Date(`${date}T${startTime}:00.000Z`).toISOString();
    const endISO = new Date(`${date}T${endTime}:00.000Z`).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setError('Start time must be strictly before end time.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/appointments', {
        doctor: doctorId,
        patient: patientId,
        startTime: startISO,
        endTime: endISO,
      });

      setSuccessMsg('Appointment booked successfully!');
      if (onAppointmentCreated) {
        onAppointmentCreated(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.message);
        setConflictDetails(err.response.data.conflict);
      } else {
        setError(err.response?.data?.message || 'Failed to book appointment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0369a1' }}>
        <Calendar size={20} /> Book New Appointment
      </h3>

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Booking Error:</strong> {error}
            {conflictDetails && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                Existing booked conflict: {new Date(conflictDetails.startTime).toLocaleTimeString()} - {new Date(conflictDetails.endTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Doctor Select */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Stethoscope size={16} /> Select Doctor *
            </label>
            <select
              className="form-control"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              required
            >
              <option value="">-- Choose a Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization} - ${doc.consultationFee})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Select with Quick-Add */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={16} /> Select Patient *
              </label>
              <button
                type="button"
                onClick={() => setShowNewPatient(true)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', marginBottom: '0.3rem' }}
              >
                <Plus size={12} /> New Patient
              </button>
            </div>
            <select
              className="form-control"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              <option value="">-- Choose a Patient --</option>
              {patients.map((pat) => (
                <option key={pat._id} value={pat._id}>
                  {pat.name} ({pat.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} /> Appointment Date *
            </label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Start and End Times */}
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} /> Start Time *
              </label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} /> End Time *
              </label>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Verifying Availability & Booking...' : 'Confirm & Book Appointment'}
        </button>
      </form>

      {/* Quick Add Patient Modal */}
      {showNewPatient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Register New Patient</h3>
            <form onSubmit={handleQuickAddPatient}>
              <div className="form-group">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mary Jane"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1 555-0123"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. mary@example.com"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewPatient(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentForm;

