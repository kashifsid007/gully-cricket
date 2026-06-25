import React, { useState } from 'react';
import { UserCheck, Shield } from 'lucide-react';

export default function StrikerSetupScreen({ battingTeam, bowlingTeam, onStartGame }) {
  const [striker, setStriker] = useState('Batter 1');
  const [nonStriker, setNonStriker] = useState('Batter 2');
  const [bowler, setBowler] = useState('Bowler 1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!striker.trim() || !nonStriker.trim() || !bowler.trim()) return;
    if (striker.trim() === nonStriker.trim()) {
      alert('Striker and Non-Striker cannot have the same name!');
      return;
    }

    onStartGame({
      striker: striker.trim(),
      nonStriker: nonStriker.trim(),
      bowler: bowler.trim(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255, 0, 127, 0.1)', borderRadius: '50%', marginBottom: '12px' }}>
          <UserCheck size={40} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>Lineup Setup</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Set opening batsmen and bowler to start the match.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--primary)' }}>
            🏏 Batting: {battingTeam}
          </h3>

          <div className="form-group">
            <label className="form-label">Striker (On Strike)</label>
            <input 
              type="text" 
              className="form-input" 
              value={striker} 
              onChange={(e) => setStriker(e.target.value)} 
              placeholder="e.g. Suresh"
              maxLength={20}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Non-Striker (Off Strike)</label>
            <input 
              type="text" 
              className="form-input" 
              value={nonStriker} 
              onChange={(e) => setNonStriker(e.target.value)} 
              placeholder="e.g. Ramesh"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--secondary)' }}>
            🥎 Bowling: {bowlingTeam}
          </h3>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Opening Bowler</label>
            <input 
              type="text" 
              className="form-input" 
              value={bowler} 
              onChange={(e) => setBowler(e.target.value)} 
              placeholder="e.g. Dinesh"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button type="submit" className="btn btn-primary">
            Start the Match
          </button>
        </div>
      </form>
    </div>
  );
}
