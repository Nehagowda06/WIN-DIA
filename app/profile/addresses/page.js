"use client";

import { useState, useEffect } from 'react';
import './addresses.css';

const EMPTY_FORM = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', is_default: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    const res = await fetch('/api/addresses');
    const result = await res.json();
    if (res.ok) setAddresses(result.addresses);
    setLoading(false);
  };

  useEffect(() => { loadAddresses(); }, []);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEditForm = (address) => {
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }

    setShowForm(false);
    loadAddresses();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    loadAddresses();
  };

  const handleSetDefault = async (address) => {
    await fetch(`/api/addresses/${address.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...address, is_default: true }),
    });
    loadAddresses();
  };

  if (loading) return null;

  return (
    <div>
      <div className="addresses-header">
        <h1 className="addresses-title">Saved addresses</h1>
        {!showForm && (
          <button className="addresses-add-btn" onClick={openAddForm}>+ Add new</button>
        )}
      </div>

      {showForm && (
        <form className="address-form-card" onSubmit={handleSubmit}>
          <div className="address-form-row">
            <input className="address-input" placeholder="Full name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <input className="address-input" placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>

          <input className="address-input" placeholder="Address line 1" value={form.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required />
          <input className="address-input" placeholder="Address line 2 (optional)" value={form.address_line2}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />

          <div className="address-form-row">
            <input className="address-input" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <input className="address-input" placeholder="State" value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            <input className="address-input" placeholder="Pincode" value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          </div>

          <label className="address-checkbox-label">
            <input type="checkbox" checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default address
          </label>

          {error && <p className="address-error">{error}</p>}

          <div className="address-form-actions">
            <button type="submit" className="address-save-btn" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update address' : 'Save address'}
            </button>
            <button type="button" className="address-cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm && (
        <p className="addresses-empty">No saved addresses yet.</p>
      )}

      <div className="addresses-list">
        {addresses.map((address) => (
          <div key={address.id} className={`address-card ${address.is_default ? 'address-card-default' : ''}`}>
            <div className="address-card-top">
              <span className="address-name-line">{address.full_name} &nbsp; {address.phone}</span>
              {address.is_default && <span className="address-badge">Default</span>}
            </div>
            <p className="address-line-text">
              {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} {address.pincode}
            </p>
            <div className="address-actions">
              <button className="address-action-link" onClick={() => openEditForm(address)}>Edit</button>
              <button className="address-action-link" onClick={() => handleDelete(address.id)}>Remove</button>
              {!address.is_default && (
                <button className="address-action-link" onClick={() => handleSetDefault(address)}>Set as default</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}