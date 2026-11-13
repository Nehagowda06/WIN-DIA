'use client';
import { useEffect, useState } from 'react';

type Data = {
  awb: string | null; step: string; label: string; issue: boolean;
  events: { status: string; location: string; time: string }[];
  expectedDelivery?: string; paymentStatus?: string;
};

const STEPS = [
  { key: 'placed', title: 'Order Placed' },
  { key: 'confirmed', title: 'Confirmed' },
  { key: 'shipped', title: 'Shipped' },
  { key: 'out_for_delivery', title: 'Out for Delivery' },
  { key: 'delivered', title: 'Delivered' },
  { key: 'paid', title: 'Payment Collected' },
];

export default function OrderTracker({ trackingToken }: { trackingToken: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/track?token=${encodeURIComponent(trackingToken)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, [trackingToken]);

  if (failed) return <p>Tracking is temporarily unavailable. Please check again shortly.</p>;
  if (!data) return <p>Loading tracking...</p>;

  const paid = data.paymentStatus === 'paid' || data.paymentStatus === 'collected';
  const currentIdx = paid ? 5 : STEPS.findIndex((s) => s.key === data.step);

  return (
    <div>
      <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <li key={s.key} style={{ opacity: i <= currentIdx ? 1 : 0.4, fontWeight: i === currentIdx ? 700 : 400 }}>
            {i <= currentIdx ? '●' : '○'} {s.title}
          </li>
        ))}
      </ol>

      <p><strong>Status:</strong> {data.label}</p>
      {data.issue && <p style={{ color: '#b45309' }}>There is an issue with this delivery. Please contact us.</p>}
      {data.expectedDelivery && <p>Expected delivery: {data.expectedDelivery}</p>}

      {data.events.length > 0 && (
        <ul>
          {data.events.map((e, i) => (
            <li key={i}>{e.status}{e.location ? `, ${e.location}` : ''} <small>({e.time})</small></li>
          ))}
        </ul>
      )}

      {data.awb && (
        <a href={`https://www.dtdc.in/tracking.asp?trackno=${data.awb}`} target="_blank" rel="noreferrer">
          Track on DTDC (AWB {data.awb})
        </a>
      )}
    </div>
  );
}