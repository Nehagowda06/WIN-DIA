'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderTracker from '../../components/OrderTracker';

function TrackInner() {
  const token = useSearchParams().get('token');
  if (!token) return <p>Missing tracking link.</p>;
  return <OrderTracker trackingToken={token} />;
}

export default function TrackPage() {
  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>Track your order</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <TrackInner />
      </Suspense>
    </main>
  );
}