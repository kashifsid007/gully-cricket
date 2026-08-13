import React, { useState, useEffect } from 'react';
import { UserCheck, Shield } from 'lucide-react';
import { getAllPlayers, autoRegisterPlayer } from '../utils/playerDb';

export default function StrikerSetupScreen({ battingTeam, bowlingTeam, onStartGame }) {
  const [striker, setStriker] = useState('KASHIF');
  const [nonStriker, setNonStriker] = useState('Batter 2');
  const [bowler, setBowler] = useState('Bowler 1');
  const [registeredPlayers, setRegisteredPlayers] = useState([]);

  useEffect(() => {
    const list = getAllPlayers();
    setRegisteredPlayers(list);
    if (list.length >= 1) setStriker(list[0].name);
    if (list.length >= 2) setNonStriker(list[1].name);
    if (list.length >= 3) setBowler(list[2].name);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sName = striker.trim();
    const nsName = nonStriker.trim();
    const bName = bowler.trim();

    if (!sName || !nsName || !bName) return;
    if (sName === nsName) {
      alert('Striker and Non-Striker cannot have the same name!');
      return;
    }

    // Auto-register players in database
    autoRegisterPlayer(sName);
    autoRegisterPlayer(nsName);
    autoRegisterPlayer(bName);

    onStartGame({
      striker: sName,
      nonStriker: nsName,
      bowler: bName,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '70px' }}>
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255, 0, 127, 0.1)', borderRadius: '50%', marginBottom: '8px' }}>
          <UserCheck size={36} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase' }}>Lineup Setup</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Select or enter opening batsmen and bowler.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
        <datalist id="player-suggestions">
          {registeredPlayers.map(p => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', color: 'var(--primary)' }}>
            🏏 Batting: {battingTeam}
          </h3>

          <div className="form-group">
            <label className="form-label">Striker (On Strike)</label>
            <input 
              type="text" 
              className="form-input" 
              value={striker} 
              onChange={(e) => setStriker(e.target.value)} 
              placeholder="e.g. KASHIF"
              list="player-suggestions"
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
              list="player-suggestions"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', color: 'var(--secondary)' }}>
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
              list="player-suggestions"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <button type="submit" className="btn btn-primary">
            Start Match
          </button>
        </div>
      </form>
    </div>
  );
}
