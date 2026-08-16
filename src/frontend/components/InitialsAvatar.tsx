// src/frontend/components/InitialsAvatar.tsx
'use client';

interface InitialsAvatarProps {
  name?: string | null;
  email: string;
  size?: number;
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  // fallback: use the part of the email before '@'
  const localPart = email.split('@')[0];
  return localPart.slice(0, 2).toUpperCase();
}

export default function InitialsAvatar({ name, email, size = 96 }: InitialsAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6B4A34', // matches your dark-brown palette
        color: '#F5EFE6',           // cream text
        fontFamily: 'serif',
        fontWeight: 600,
        fontSize: size * 0.35,
        border: '2px solid #E8DCC8',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}