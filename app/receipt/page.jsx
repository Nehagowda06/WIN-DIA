'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// ── Data fetcher ──────────────────────────────────────────────────────────────

function useReceipt(token) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/receipt?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d.error || 'Not found'))))
      .then(setOrder)
      .catch((msg) => setError(typeof msg === 'string' ? msg : 'Could not load receipt.'));
  }, [token]);

  return { order, error };
}

// ── Packing slip renderer — identical layout to admin generateShippingLabel ───

function PackingSlip({ order }) {
  const addr  = order.shipping_address || {};
  const items = order.order_items || [];

  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const totalItems = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  const subtotal   = order.items_price    || 0;
  const shipping   = order.shipping_price || 0;
  const discount   = order.discount_price || 0;
  const total      = order.total_price    || 0;

  return (
    <>
      {/* ── Global styles scoped to this page ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: 80mm auto; margin: 0; }
        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          margin: 0;
        }
        .slip-wrap {
          width: 80mm;
          margin: 24px auto;
          background: #fff;
          padding: 5mm;
          box-sizing: border-box;
          color: #000;
          font-size: 11px;
        }
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          margin-bottom: 8px;
          gap: 12px;
        }
        .logo-with-tm { position: relative; display: inline-block; }
        .logo { max-width: 45px; height: auto; display: block; }
        .tm-badge {
          position: absolute; top: 0; right: 2px;
          font-size: 8px; font-weight: bold; color: #000;
        }
        .brand-name {
          font-family: Georgia, serif;
          font-size: 26px; font-weight: bold;
          letter-spacing: 1px; color: #000;
          line-height: 1; padding-top: 2px;
        }
        .title {
          text-align: center; font-size: 14px; font-weight: bold;
          letter-spacing: 3px; padding: 8px 0;
          border-top: 2px solid #000; border-bottom: 2px solid #000;
          margin: 8px 0 12px 0;
        }
        .info-section { margin-bottom: 10px; line-height: 1.7; font-size: 11px; }
        .info-row { display: flex; gap: 5px; }
        .info-label { width: 80px; }
        .info-value { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .ship-to-title { font-weight: bold; margin-bottom: 6px; }
        .address-block { line-height: 1.6; margin-bottom: 10px; font-size: 11px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        .items-table th {
          border-top: 1px solid #000; border-bottom: 1px solid #000;
          padding: 6px 4px; text-align: left; font-weight: bold;
        }
        .items-table td { padding: 6px 4px; border-bottom: 1px dashed #ccc; }
        .qty-col  { width: 30px; text-align: center; }
        .price-col { width: 60px; text-align: right; }
        .summary { margin-top: 10px; font-size: 11px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .total-section {
          border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 8px;
        }
        .total-row {
          display: flex; justify-content: space-between;
          padding: 10px 0; font-size: 14px; font-weight: bold;
        }
        .thank-you { text-align: center; margin: 15px 0 10px; font-size: 11px; }
        .footer {
          margin-top: 15px; padding-top: 12px;
          border-top: 1px solid #ddd; line-height: 1.8;
          font-size: 10px; text-align: center;
        }
        .packed {
          text-align: center; margin-top: 12px; padding-top: 10px;
          border-top: 1px solid #000; font-weight: bold; font-size: 10px;
        }
      `}</style>

      {/* ── Print / download button (hidden when printing) ── */}
      <div className="no-print" style={{
        width: '80mm', margin: '0 auto 12px', display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 24px', background: '#3a2a1e', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Arial, sans-serif',
          }}
        >
          Download / Save as PDF
        </button>
      </div>

      {/* ── Packing slip — exact same structure as admin generateShippingLabel ── */}
      <div className="slip-wrap">
        <div className="header">
          <div className="logo-with-tm">
            <img src="/images/windia-logo.png" alt="WIN-DIA" className="logo" />
            <span className="tm-badge">TM</span>
          </div>
          <div className="brand-name">WIN-DIA</div>
        </div>

        <div className="title">PACKING SLIP</div>

        <div className="info-section">
          <div className="info-row">
            <span className="info-label">Order #</span>
            <span className="info-value">: {order.order_number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Order Date</span>
            <span className="info-value">: {orderDate}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="ship-to-title">SHIP TO:</div>
        <div className="address-block">
          {addr.full_name || addr.name || 'Customer Name'}<br />
          {addr.address_line1 || addr.street || 'Address Line 1'}<br />
          {addr.address_line2 && <>{addr.address_line2}<br /></>}
          {addr.city || 'City'}, {addr.state || 'State'} - {addr.pincode || 'PIN'}<br />
          Phone: +91 {addr.phone || '00000 00000'}
        </div>

        <div className="divider" />

        <table className="items-table">
          <thead>
            <tr>
              <th>ITEM NAME</th>
              <th className="qty-col">QTY</th>
              <th className="price-col">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const productName = item.name || item.product_name || 'Product';
              const flavor      = item.flavor || '';
              const displayName = flavor ? `${productName} - ${flavor}` : productName;
              const qty         = item.qty || item.quantity || 1;
              return (
                <tr key={idx}>
                  <td>{displayName}</td>
                  <td className="qty-col">{qty}</td>
                  <td className="price-col">₹{((item.price || 0) * qty).toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="summary">
          <div className="summary-row"><span>Items</span><span>{totalItems}</span></div>
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>₹{shipping.toFixed(0)}</span></div>
          {discount > 0 && (
            <div className="summary-row"><span>Discount</span><span>- ₹{discount.toFixed(0)}</span></div>
          )}
        </div>

        <div className="total-section">
          <div className="total-row"><span>TOTAL</span><span>₹{total.toFixed(0)}</span></div>
        </div>

        <div className="divider" />
        <div className="thank-you">Thank you for choosing WIN-DIA! 🌿</div>

        <div className="footer">
          🌐 www.windiafoods.com<br />
          📞 Customer Support: +91 96861 53413<br />
          📷 @Kalpavristi_Coco_FAB
        </div>

        <div className="packed">🌱 Packed with care in Mysuru</div>
      </div>
    </>
  );
}

// ── Shell (handles loading / error states) ────────────────────────────────────

function ReceiptInner() {
  const token = useSearchParams().get('token');
  const { order, error } = useReceipt(token);

  if (!token) {
    return <p style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>Missing receipt link.</p>;
  }
  if (error) {
    return <p style={{ textAlign: 'center', marginTop: 60, color: '#b91c1c' }}>{error}</p>;
  }
  if (!order) {
    return <p style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>Loading…</p>;
  }
  return <PackingSlip order={order} />;
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>Loading…</p>}>
      <ReceiptInner />
    </Suspense>
  );
}
