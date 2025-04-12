
import React from 'react';

export default function MissionCard({ title, description, xp_reward }: any) {
  return (
    <div style={{ border: "1px solid #0a0", borderRadius: 8, padding: 10, marginBottom: 10 }}>
      <h3>{title}</h3>
      <p>{description}</p>
      <strong>+{xp_reward} XP</strong>
    </div>
  );
}
