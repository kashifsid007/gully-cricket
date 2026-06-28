import React, { useState } from 'react';
import { Trophy, Users, ShieldAlert, Award } from 'lucide-react';

export default function SetupScreen({ onSetupComplete, onViewHistory }) {
  const [team1, setTeam1] = useState('Gully Kings');
  const [team2, setTeam2] = useState('Street Warriors');
  const [format, setFormat] = useState('limited'); // 'limited' or 'test'
  const [overs, setOvers] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!team1.trim() || !team2.trim()) return;
    if (team1.trim() === team2.trim()) {
      alert('Teams must have different names!');
      return;
    }
    
    onSetupComplete({
      team1: team1.trim(),
      team2: team2.trim(),
      format,
      overs: format === 'limited' ? Number(overs) : null,
      maxInnings: format === 'test' ? 2 : 1, // Test match has 2 innings per team (total 4 max)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '50%', marginBottom: '12px' }}>
          <Trophy size={40} color="#00ff88" />
        </div>
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', background: 'linear-gradient(to right, #00ff88, #00d2ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Gully Cricket
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Ultimate Scoring Dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Users size={18} color="#00ff88" /> Team Setup
          </h3>
          
          <div className="form-group">
            <label className="form-label">Team A Name (Batting/Bowling First)</label>
            <input 
              type="text" 
              className="form-input" 
              value={team1} 
              onChange={(e) => setTeam1(e.target.value)} 
              placeholder="e.g. Gully Kings"
              maxLength={20}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Team B Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={team2} 
              onChange={(e) => setTeam2(e.target.value)} 
              placeholder="e.g. Street Warriors"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Award size={18} color="#00d2ff" /> Match Format
          </h3>
          
          <div className="format-grid">
            <div 
              className={`format-card ${format === 'limited' ? 'selected' : ''}`}
              onClick={() => setFormat('limited')}
            >
              <h4 style={{ color: format === 'limited' ? 'var(--primary)' : 'var(--text-primary)' }}>Limited Overs</h4>
              <p>Standard overs limit (e.g. 5, 10, 20 overs)</p>
            </div>
            
            <div 
              className={`format-card ${format === 'test' ? 'selected' : ''}`}
              onClick={() => setFormat('test')}
            >
              <h4 style={{ color: format === 'test' ? 'var(--primary)' : 'var(--text-primary)' }}>Test Format</h4>
              <p>2 Innings per team, unlimited overs, declare anytime</p>
            </div>
          </div>

          {format === 'limited' ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Overs Count: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{overs}</span></label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                className="form-input" 
                style={{ padding: 0, height: '6px', cursor: 'pointer' }}
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>1 Over</span>
                <span>10 Overs</span>
                <span>20 Overs</span>
                <span>50 Overs</span>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', gap: '8px' }}>
                <ShieldAlert size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Test Match Rules:</strong> Up to 4 innings will be scored. Over count is unlimited. A team can declare their innings at any point during scoring.
                </span>
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="submit" className="btn btn-primary">
            Proceed to Toss
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onViewHistory}
          >
            📂 View Match History
          </button>
        </div>
      </form>
    </div>
  );
}
