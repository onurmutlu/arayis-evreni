
import React from 'react';

export default function BadgeCard({ badge }: { badge: string }) {
  return (
    <div style={{ border: "1px solid #555", borderRadius: 8, padding: 8, margin: 4 }}>
      <strong>🎖 {badge}</strong>
    </div>
  );
}
