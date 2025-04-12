
import React from 'react';

export default function XPBar({ xp }: { xp: number }) {
  const percent = Math.min(xp % 100, 100);
  return (
    <div style={{ border: "1px solid #00f", padding: 4, width: "100%", borderRadius: 5 }}>
      <div style={{ background: "#00f", height: 10, width: `${percent}%`, transition: "width 0.3s" }}></div>
      <small>{xp} XP</small>
    </div>
  );
}
