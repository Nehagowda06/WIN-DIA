"use client";

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadProfile = async () => {
    const res = await fetch('/api/profile');
    const result = await res.json();

    if (res.ok) {
      setForm({
        full_name: result.profile?.full_name || '',
        email: result.profile?.email || '',
        phone: result.profile?.phone || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }

    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleCancel = () => {
    setError('');
    loadProfile();
    setEditing(false);
  };

  if (loading) return null;

  return (
    <div>
      <div className="profile-details-header">
        <div>
          <h1 className="profile-title">Profile details</h1>
          <p className="profile-subtitle">Manage your personal information</p>
        </div>
        {!editing && (
          <button className="profile-edit-btn" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {success && <p className="profile-success">Saved successfully.</p>}

      {editing ? (
        <form onSubmit={handleSubmit}>
          <label className="profile-field-label">Full name</label>
          <input
            type="text"
            className="profile-input"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />

          <label className="profile-field-label">Email</label>
          <input
            type="email"
            className="profile-input"
            value={form.email}
            disabled
          />

          <label className="profile-field-label">Phone</label>
          <input
            type="tel"
            className="profile-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {error && <p className="profile-error">{error}</p>}

          <div className="profile-form-actions">
            <button type="submit" className="profile-submit-btn" disabled={saving}>
              {saving ? 'Saving...' : 'SAVE CHANGES'}
            </button>
            <button type="button" className="profile-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          <div className="profile-view-row">
            <span className="profile-view-label">Full name</span>
            <span className="profile-view-value">{form.full_name || '—'}</span>
          </div>
          <div className="profile-view-row">
            <span className="profile-view-label">Email</span>
            <span className="profile-view-value">{form.email || '—'}</span>
          </div>
          <div className="profile-view-row">
            <span className="profile-view-label">Phone</span>
            <span className="profile-view-value">{form.phone || '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}