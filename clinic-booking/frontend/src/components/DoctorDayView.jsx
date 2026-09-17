import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Calendar, Stethoscope, Clock, AlertCircle } from 'lucide-react';

const DoctorDayView = ({ doctors, onCancelClick, onRescheduleClick, refreshTrigger }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?._id || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedDoctorId && doctors.length > 0) {
      setSelectedDoctorId(doctors[0]._id);
    }
  }, [doctors]);

  useEffect(() => {
    const fetchDaySchedule = async () => {
      if (!selectedDoctorId || !selectedDate) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/doctors/${selectedDoctorId}/day?date=${selectedDate}`);
        setSchedule(res.data.data || []);
        setDoctorInfo(res.data.doctor || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor day schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchDaySchedule();
  }, [selectedDoctorId, selectedDate, refreshTrigger]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1' }}>
          <Stethoscope size={20} /> Doctor's Day Schedule
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '200px' }}
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </select>

          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading schedule...</p>
      ) : schedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 500 }}>No appointments scheduled for {doctorInfo?.name || 'this doctor'} on {selectedDate}.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The doctor's calendar is completely free for new bookings.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span>Consultation Fee: ${doctorInfo?.consultationFee || 0}</span>
            <span>Total Bookings Today: {schedule.length}</span>
          </div>

          {schedule.map((apt) => (
            <div
              key={apt._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: apt.status === 'cancelled' ? '#fef2f2' : apt.status === 'no-show' ? '#fffbeb' : '#ffffff',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Clock size={16} color="var(--primary)" />
                  <strong>
                    {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                  </strong>
                  <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                  {apt.feeCharged > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                      Fee: ${apt.feeCharged.toFixed(2)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                  Patient: <strong>{apt.patient?.name || 'Unknown'}</strong> ({apt.patient?.phone || 'No phone'})
                </div>
              </div>

              {apt.status === 'booked' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onRescheduleClick(apt)}
                    className="btn btn-secondary btn-sm"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => onCancelClick(apt)}
                    className="btn btn-danger btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDayView;

