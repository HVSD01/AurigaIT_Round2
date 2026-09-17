import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Clock, Users, ArrowRight, CheckCircle2, Sparkles, Building2, MessageSquare, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Nav */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>MedSync Clinic</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conflict-Free Front Desk System</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary">
                Open Staff Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Staff Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register Staff <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)', padding: '4.5rem 2rem 3.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e0f2fe', color: '#0369a1', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <ShieldCheck size={16} /> Built for High-Volume Medical Practices
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Never double-book a doctor again. Handle cancellations fairly.
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '720px', margin: '0 auto 2rem' }}>
            MedSync gives clinic front desk staff bulletproof server-side overlap protection, an automated 2-hour late cancellation fee policy, fast patient lookups, and complete daily schedule visibility.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1.05rem' }}>
              Launch Front Desk Portal <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}>
              Explore Architecture
            </a>
          </div>
        </div>
      </section>

      {/* Target Audience & How It Helps */}
      <section style={{ padding: '3.5rem 2rem', background: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#dbeafe', color: '#1e40af', padding: '0.6rem', borderRadius: '8px' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Target Audience</h3>
            </div>
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
              Specially engineered for <strong>Clinic Front Desk Receptionists, Practice Managers, and Medical Scheduling Staff</strong> who manage appointments across multiple physicians in busy outpatient clinics.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> Primary care and multi-specialty practices
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> Dental, pediatric, and specialty care clinics
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> Fast-paced front desk environments
              </li>
            </ul>
          </div>

          <div className="card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.6rem', borderRadius: '8px' }}>
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>How It Solves Clinic Pain</h3>
            </div>
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
              Eliminates the human error of overlapping calendar slots while protecting clinic revenue against last-minute patient no-shows.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> <strong>Zero Double-Bookings:</strong> Atomic MongoDB interval checks block collisions.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> <strong>Fair Cancellation Rule:</strong> Automated 10% fee if cancelled within 2 hours.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="var(--success)" /> <strong>Instant Patient Lookup:</strong> Rapid search by patient name in seconds.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Core Features */}
      <section id="features" style={{ padding: '3.5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Core System Capabilities</h2>
            <p style={{ color: 'var(--text-muted)' }}>Engineered with strict server-side validation and enterprise security standards</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><ShieldCheck size={28} /></div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Conflict-Free Booking</h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Every reservation executes server-side interval checking: <code>newStart &lt; existingEnd &amp;&amp; newEnd &gt; existingStart</code>. Rejects overlaps with 409 Conflict.
              </p>
            </div>

            <div className="card">
              <div style={{ color: 'var(--warning)', marginBottom: '0.75rem' }}><AlertOctagon size={28} /></div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fair Cancellation Rule</h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Cancellations &gt; 2 hours prior are 100% free. Cancellations within 2 hours automatically assess 10% of that doctor's consultation fee.
              </p>
            </div>

            <div className="card">
              <div style={{ color: 'var(--success)', marginBottom: '0.75rem' }}><Clock size={28} /></div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Doctor Day View &amp; Virtual Clock</h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                View complete daily doctor rosters. Integrated virtual clock simulation handles morning reminder outbox dispatch and automatic 30-min no-show transitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Features Planned Next */}
      <section style={{ padding: '3.5rem 2rem', background: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={16} /> Product Roadmap
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.35rem' }}>3 Features Planned Next</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#0369a1' }}>
                <MessageSquare size={20} />
                <h4 style={{ fontWeight: 600, margin: 0 }}>1. Automated SMS &amp; WhatsApp Reminders</h4>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Direct Twilio integration consuming our Outbox to send SMS / WhatsApp notifications 24 hours and 2 hours before the visit with one-tap confirmation replies.
              </p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#065f46' }}>
                <Building2 size={20} />
                <h4 style={{ fontWeight: 600, margin: 0 }}>2. Multi-Branch &amp; Room Management</h4>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Support multi-location clinics with room assignments, medical equipment availability, and cross-facility doctor rotations without calendar collisions.
              </p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#92400e' }}>
                <Users size={20} />
                <h4 style={{ fontWeight: 600, margin: 0 }}>3. Smart Waitlist Auto-Fill</h4>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                When a patient cancels an appointment, automatically notify the next queued patient on the waitlist to claim the newly opened slot, maximizing clinic utilization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', background: '#0f172a', color: '#94a3b8', padding: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p>© 2026 MedSync Clinic Booking System. Built for High-Volume Medical Practices.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

