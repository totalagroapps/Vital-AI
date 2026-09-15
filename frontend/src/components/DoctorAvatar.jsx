import React, { useState } from 'react';

const HONORIFICS = new Set(['dr', 'dr.', 'dra', 'dra.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.']);

export function getInitials(fullName) {
  if (!fullName) return '?';
  const words = fullName.trim().split(/\s+/);
  const meaningful = words.filter((w) => !HONORIFICS.has(w.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : words;
  const initials = source.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return initials || '?';
}

// Doctor photo, falls back to initials. `bgColor` overrides the default color.
const DoctorAvatar = ({ avatarUrl, fullName, size = 80, bgColor }) => {
  const [broken, setBroken] = useState(false);
  if (avatarUrl && !broken) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        onError={() => setBroken(true)}
        className="rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full font-bold flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${
        bgColor ? 'text-white' : 'bg-brand-blue/10 text-brand-blue'
      }`}
      style={{ width: size, height: size, fontSize: size * 0.32, background: bgColor }}
    >
      {getInitials(fullName)}
    </div>
  );
};

export default DoctorAvatar;
