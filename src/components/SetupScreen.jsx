import React, { useState } from 'react';
import { Users, ShieldAlert, Award, Tv, ArrowRight } from 'lucide-react';

export default function SetupScreen({ onSetupComplete, onViewHistory }) {
  const [team1, setTeam1] = useState('IND');
  const [team2, setTeam2] = useState('AUS');
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
      maxInnings: format === 'test' ? 2 : 1,
    });
  };

  return (
    <div className="setup-screen-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
      {/* Broadcast Header Badge */}
      <div style={{ textAlign: 'center', margin: '16px 0 14px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '20px', marginBottom: '8px' }}>
          <Tv size={14} color="#00e5ff" />
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00e5ff', letterSpacing: '0.1em' }}>
            LIVE TV BROADCAST STUDIO
          </span>
        </div>

        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '800', 
          textTransform: 'uppercase', 
          letterSpacing: '0.04em', 
          background: 'linear-gradient(135deg, #ffffff 0%, #00e5ff 60%, #00ff88 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 15px rgba(0, 229, 255, 0.3))'
        }}>
          GULLY CRICKET
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px', fontWeight: '500' }}>
          Official Scoring & Broadcast Dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
        {/* Team Setup Card */}
        <div className="card broadcast-input-card">
          <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#00e5ff' }}>
            <Users size={16} color="#00e5ff" /> Team Registration
          </h3>
          
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Team A Name (Batting First)</label>
            <input 
              type="text" 
              className="form-input" 
              value={team1} 
              onChange={(e) => setTeam1(e.target.value)} 
              placeholder="e.g. IND"
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
              placeholder="e.g. AUS"
              maxLength={20}
              required
            />
          </div>
        </div>

        {/* Match Format Card */}
        <div className="card broadcast-input-card">
          <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#00ff88' }}>
            <Award size={16} color="#00ff88" /> Match Format
          </h3>
          
          <div className="format-grid" style={{ marginBottom: '12px' }}>
            <div 
              className={`format-card ${format === 'limited' ? 'selected' : ''}`}
              onClick={() => setFormat('limited')}
            >
              <h4 style={{ color: format === 'limited' ? '#00e5ff' : 'var(--text-primary)' }}>Limited Overs</h4>
              <p>Standard overs limit (e.g. 5, 10, 20 overs)</p>
            </div>
            
            <div 
              className={`format-card ${format === 'test' ? 'selected' : ''}`}
              onClick={() => setFormat('test')}
            >
              <h4 style={{ color: format === 'test' ? '#00e5ff' : 'var(--text-primary)' }}>Test Format</h4>
              <p>2 Innings per team, declare & Day Stumps</p>
            </div>
          </div>

          {format === 'limited' ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Overs Count: <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.05rem' }}>{overs}</span></label>
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
            <div style={{ background: 'rgba(0, 229, 255, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', gap: '8px' }}>
                <ShieldAlert size={18} color="#00e5ff" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Test Match Rules:</strong> Unlimited overs. Declare anytime and click <strong>Day 1 Stumps</strong> to pause play!
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', gap: '8px', fontSize: '1rem' }}>
            Proceed to Toss <ArrowRight size={18} />
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onViewHistory}
            style={{ justifyContent: 'center' }}
          >
            📂 View Saved Match Archive
          </button>
        </div>
      </form>
    </div>
  );
}
