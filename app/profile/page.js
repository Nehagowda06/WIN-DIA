"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/frontend/hooks/useAuth';

export default function ProfilePage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await authFetch('/api/profile');
      const result = await res.json();

      if (res.ok && result.success) {
        const prof = result.profile || result.data || {};
        setForm({
          full_name: prof.full_name || '',
          email: prof.email || user?.email || '',
          phone: prof.phone || '',
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
      });

      const result = await res.json();
      setSaving(false);

      if (!res.ok || !result.success) {
        setError(typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to update profile');
        return;
      }

      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setSaving(false);
      setError(err.message || 'Something went wrong');
    }
  };

  const handleCancel = () => {
    setError('');
    loadProfile();
    setEditing(false);
  };

  if (authLoading || loading) return null;

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
            <span className="profile-view-value">{form.full_name || '-'}</span>
          </div>
          <div className="profile-view-row">
            <span className="profile-view-label">Email</span>
            <span className="profile-view-value">{form.email || '-'}</span>
          </div>
          <div className="profile-view-row">
            <span className="profile-view-label">Phone</span>
            <span className="profile-view-value">{form.phone || '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
