import React, { useState } from 'react';
import { Calendar, Clock, User, Stethoscope, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

const AppointmentList = ({
  appointments,
  loading,
  page,
  totalPages,
  total,
  sortBy,
  order,
  onPageChange,
  onSortChange,
  onCancelClick,
  onRescheduleClick,
}) => {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ color: '#0369a1', margin: 0 }}>All Clinic Appointments</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {appointments.length} of {total} appointments
          </span>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</label>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [newSort, newOrder] = e.target.value.split('-');
              onSortChange(newSort, newOrder);
            }}
          >
            <option value="startTime-asc">Date & Time (Earliest First)</option>
            <option value="startTime-desc">Date & Time (Latest First)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="feeCharged-desc">Fee Charged (High-Low)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          <Calendar size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 500 }}>No appointments found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Fee Charged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{formatDate(apt.startTime)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{apt.doctor?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {apt.doctor?.specialization} (${apt.doctor?.consultationFee})
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{apt.patient?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {apt.patient?.phone}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${apt.status}`}>
                      {apt.status}
                    </span>
                    {apt.cancelledAt && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        at {formatTime(apt.cancelledAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    {apt.feeCharged > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        ${apt.feeCharged.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>$0.00</span>
                    )}
                  </td>
                  <td>
                    {apt.status === 'booked' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => onRescheduleClick(apt)}
                          className="btn btn-secondary btn-sm"
                          title="Reschedule appointment to a new slot"
                        >
                          <RefreshCw size={12} /> Reschedule
                        </button>
                        <button
                          onClick={() => onCancelClick(apt)}
                          className="btn btn-danger btn-sm"
                          title="Cancel appointment"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No actions
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;

