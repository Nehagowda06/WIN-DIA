"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './goodbye.css';

export default function GoodbyePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="goodbye-page">
      <div className="goodbye-card">
        <div className="goodbye-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7A5A44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
          </svg>
        </div>
        <h1 className="goodbye-title">See you soon</h1>
        <p className="goodbye-message">Thank you for shopping with WINDIA.<br />Your journey stays saved, right where you left it.</p>
      </div>
    </div>
  );
}