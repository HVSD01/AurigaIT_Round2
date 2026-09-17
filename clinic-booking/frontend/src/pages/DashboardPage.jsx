import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import AppointmentForm from '../components/AppointmentForm';
import DoctorDayView from '../components/DoctorDayView';
import SearchBar from '../components/SearchBar';
import AppointmentList from '../components/AppointmentList';
import {
  Calendar,
  LogOut,
  Clock,
  Mail,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Bell,
  X,
  Stethoscope,
  Info
} from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingApts, setLoadingApts] = useState(false);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('startTime');
  const [order, setOrder] = useState('asc');
  const [isSearching, setIsSearching] = useState(false);

  // Trigger to reload components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [cancelModalApt, setCancelModalApt] = useState(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('09:00');
  const [rescheduleEnd, setRescheduleEnd] = useState('09:30');
  const [rescheduleError, setRescheduleError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Virtual Clock & Outbox state (Twists 2 & 3)
  const [currentTime, setCurrentTime] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [showClockModal, setShowClockModal] = useState(false);
  const [customClockTime, setCustomClockTime] = useState('');
  const [outboxEntries, setOutboxEntries] = useState([]);
  const [showOutboxModal, setShowOutboxModal] = useState(false);

  // Load initial doctors, patients, clock
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [docRes, patRes, clockRes] = await Promise.all([
          axiosClient.get('/doctors'),
          axiosClient.get('/patients'),
          axiosClient.get('/clock'),
        ]);
        setDoctors(docRes.data.data || []);
        setPatients(patRes.data.data || []);
        setCurrentTime(clockRes.data.currentTime);
        setIsVirtual(clockRes.data.isVirtual);
      } catch (err) {
        console.error('Failed to load initial metadata', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch paginated appointments
  const fetchAppointments = async () => {
    setLoadingApts(true);
    try {
      const res = await axiosClient.get(
        `/appointments?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`
      );
      setAppointments(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
      setIsSearching(false);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoadingApts(false);
    }
  };

  useEffect(() => {
    if (!isSearching) {
      fetchAppointments();
    }
  }, [page, sortBy, order, refreshTrigger]);

  // Handle Patient Search
  const handleSearch = async (patientName) => {
    setLoadingApts(true);
    try {
      const res = await axiosClient.get(`/appointments/search?patientName=${encodeURIComponent(patientName)}`);
      setAppointments(res.data.data || []);
      setTotalPages(1);
      setPage(1);
      setTotal(res.data.count || 0);
      setIsSearching(true);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoadingApts(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setPage(1);
    fetchAppointments();
  };

  // Appointment Created Callback
  const handleAppointmentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Patient Added Callback
  const handlePatientAdded = (newPatient) => {
    setPatients((prev) => [...prev, newPatient]);
  };

  // Cancel Flow
  const handleOpenCancelModal = (apt) => {
    setCancelModalApt(apt);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalApt) return;
    setActionLoading(true);
    try {
      await axiosClient.patch(`/appointments/${cancelModalApt._id}/cancel`);
      setCancelModalApt(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule Flow (Twist 1)
  const handleOpenRescheduleModal = (apt) => {
    setRescheduleModalApt(apt);
    const datePart = new Date(apt.startTime).toISOString().split('T')[0];
    const startPart = new Date(apt.startTime).toISOString().substr(11, 5);
    const endPart = new Date(apt.endTime).toISOString().substr(11, 5);
    setRescheduleDate(datePart);
    setRescheduleStart(startPart);
    setRescheduleEnd(endPart);
    setRescheduleError('');
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleModalApt) return;
    setRescheduleError('');

    const startISO = new Date(`${rescheduleDate}T${rescheduleStart}:00.000Z`).toISOString();
    const endISO = new Date(`${rescheduleDate}T${rescheduleEnd}:00.000Z`).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setRescheduleError('Start time must be strictly before end time.');
      return;
    }

    setActionLoading(true);
    try {
      await axiosClient.patch(`/appointments/${rescheduleModalApt._id}/reschedule`, {
        startTime: startISO,
        endTime: endISO,
      });
      setRescheduleModalApt(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      if (err.response?.status === 409) {
        setRescheduleError(err.response.data.message);
      } else {
        setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Virtual Clock Flow (Twist 2 & 3)
  const handleSetClock = async (timeISO) => {
    try {
      const res = await axiosClient.post('/clock', { time: timeISO });
      setCurrentTime(res.data.virtualTime);
      setIsVirtual(true);
      setShowClockModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set clock');
    }
  };

  const handleResetClock = async () => {
    try {
      const res = await axiosClient.post('/clock/reset');
      setCurrentTime(res.data.currentTime);
      setIsVirtual(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert('Failed to reset clock');
    }
  };

  const handleOpenOutbox = async () => {
    try {
      const res = await axiosClient.get('/outbox');
      setOutboxEntries(res.data.data || []);
      setShowOutboxModal(true);
    } catch (err) {
      alert('Failed to load outbox entries');
    }
  };

  // Calculate cancellation preview details
  const getCancelPreview = (apt) => {
    if (!apt) return null;
    const now = currentTime ? new Date(currentTime) : new Date();
    const start = new Date(apt.startTime);
    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLate = diffHours <= 2;
    const fee = isLate ? ((apt.doctor?.consultationFee || 0) * 0.10) : 0;
    return { diffHours, isLate, fee };
  };

  const cancelPreview = cancelModalApt ? getCancelPreview(cancelModalApt) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0.85rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>MedSync Desk Portal</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staff: {user?.name} ({user?.email})</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Clock Widget */}
            <div
              onClick={() => setShowClockModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isVirtual ? '#fef3c7' : '#f1f5f9',
                color: isVirtual ? '#92400e' : '#334155',
                border: isVirtual ? '1px solid #fde68a' : '1px solid var(--border)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title="Click to adjust virtual clock or simulate time"
            >
              <Clock size={16} color={isVirtual ? '#b45309' : 'var(--primary)'} />
              <span>{isVirtual ? 'Virtual Clock: ' : 'System Clock: '}</span>
              <strong style={{ fontFamily: 'monospace' }}>
                {currentTime ? new Date(currentTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Loading...'}
              </strong>
            </div>

            {/* Outbox Button */}
            <button
              onClick={handleOpenOutbox}
              className="btn btn-secondary btn-sm"
              title="View morning reminder notifications"
            >
              <Bell size={16} /> Outbox
            </button>

            {/* Logout */}
            <button onClick={logout} className="btn btn-secondary btn-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1300px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
        {/* Top Booking Form */}
        <AppointmentForm
          doctors={doctors}
          patients={patients}
          onAppointmentCreated={handleAppointmentCreated}
          onPatientAdded={handlePatientAdded}
        />

        {/* Doctor's Day View */}
        <DoctorDayView
          doctors={doctors}
          onCancelClick={handleOpenCancelModal}
          onRescheduleClick={handleOpenRescheduleModal}
          refreshTrigger={refreshTrigger}
        />

        {/* Search Bar for Appointments by Patient Name */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', color: '#0369a1', marginBottom: '0.75rem' }}>
            Find Patient Appointments
          </h4>
          <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
          {isSearching && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Showing search results ({total} found)</span>
              <button onClick={handleClearSearch} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
                Reset View
              </button>
            </div>
          )}
        </div>

        {/* Paginated & Sortable Appointment List */}
        <AppointmentList
          appointments={appointments}
          loading={loadingApts}
          page={page}
          totalPages={totalPages}
          total={total}
          sortBy={sortBy}
          order={order}
          onPageChange={setPage}
          onSortChange={(newSort, newOrder) => {
            setSortBy(newSort);
            setOrder(newOrder);
          }}
          onCancelClick={handleOpenCancelModal}
          onRescheduleClick={handleOpenRescheduleModal}
        />
      </main>

      {/* Cancellation Confirmation Modal with Fee Calculation */}
      {cancelModalApt && cancelPreview && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Confirm Appointment Cancellation</h3>
            </div>

            <p style={{ color: '#334155', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Are you sure you want to cancel the appointment for <strong>{cancelModalApt.patient?.name}</strong> with <strong>{cancelModalApt.doctor?.name}</strong>?
            </p>

            {cancelPreview.isLate ? (
              <div className="alert alert-danger" style={{ display: 'block' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={18} /> Late Cancellation Fee Applies (Within 2 Hours)
                </strong>
                <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                  This appointment starts at {new Date(cancelModalApt.startTime).toLocaleTimeString()} ({Math.max(0, cancelPreview.diffHours).toFixed(1)} hours from now).
                  Per clinic policy, cancellations within 2 hours incur a <strong>10% fee of the doctor's ${cancelModalApt.doctor?.consultationFee} fee</strong>:
                </p>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginTop: '0.5rem' }}>
                  Charge Amount: ${cancelPreview.fee.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="alert alert-success" style={{ display: 'block' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <CheckCircle size={18} /> Free Cancellation (&gt; 2 Hours Notice)
                </strong>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  This appointment is scheduled for {new Date(cancelModalApt.startTime).toLocaleDateString()} at {new Date(cancelModalApt.startTime).toLocaleTimeString()} ({cancelPreview.diffHours.toFixed(1)} hours away). No late fee will be charged.
                </p>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46', marginTop: '0.35rem' }}>
                  Fee Charged: $0.00
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelModalApt(null)}
                disabled={actionLoading}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm & Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal (Twist 1) */}
      {rescheduleModalApt && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0369a1' }}>
                <RefreshCw size={20} /> Reschedule Appointment
              </h3>
              <button
                onClick={() => setRescheduleModalApt(null)}
                style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem' }}>
              Rescheduling for <strong>{rescheduleModalApt.patient?.name}</strong> with <strong>{rescheduleModalApt.doctor?.name}</strong>.
            </p>

            {rescheduleError && (
              <div className="alert alert-danger">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReschedule}>
              <div className="form-group">
                <label>New Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRescheduleModalApt(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Checking Availability...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Clock Modal (Twists 2 & 3) */}
      {showClockModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0369a1' }}>
                <Clock size={20} /> Virtual Clock Controller
              </h3>
              <button onClick={() => setShowClockModal(false)} style={{ background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Simulate time passage to test automated morning reminders in the Outbox and the 30-minute auto no-show rule.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Set Specific ISO Time:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={customClockTime}
                  onChange={(e) => setCustomClockTime(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (customClockTime) {
                      handleSetClock(new Date(customClockTime).toISOString());
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const curr = new Date(currentTime || Date.now());
                  curr.setDate(curr.getDate() + 1);
                  handleSetClock(curr.toISOString());
                }}
              >
                Advance +1 Calendar Day (Trigger Outbox Reminders)
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const curr = new Date(currentTime || Date.now());
                  curr.setMinutes(curr.getMinutes() + 35);
                  handleSetClock(curr.toISOString());
                }}
              >
                Advance +35 Minutes (Trigger Auto No-Show)
              </button>

              {isVirtual && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={handleResetClock}
                >
                  Reset Clock to Real System Time
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Outbox Modal (Twist 2) */}
      {showOutboxModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0369a1' }}>
                <Bell size={20} /> Notification Outbox
              </h3>
              <button onClick={() => setShowOutboxModal(false)} style={{ background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Generated reminders dispatched upon calendar day advances.
            </p>

            {outboxEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No notifications in outbox.
              </div>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {outboxEntries.map((item) => (
                  <div key={item._id} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span className="badge badge-booked">{item.type}</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

