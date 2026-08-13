import React, { useState, useEffect } from 'react';
import { Play, Calendar, Trash2, Moon, Clock } from 'lucide-react';

export default function IncompleteMatchesTab({ onResumeMatch }) {
  const [incompleteMatches, setIncompleteMatches] = useState([]);

  useEffect(() => {
    loadIncompleteMatches();
  }, []);

  const loadIncompleteMatches = () => {
    try {
      const matches = JSON.parse(localStorage.getItem('gully_cricket_matches') || '[]');
      const incomplete = matches.filter(m => m.status !== 'Completed' && m.screen !== 'SUMMARY');
      setIncompleteMatches(incomplete);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  const handleDeleteMatch = (matchId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved match?')) {
      const matches = JSON.parse(localStorage.getItem('gully_cricket_matches') || '[]');
      const updated = matches.filter(m => m.id !== matchId);
      localStorage.setItem('gully_cricket_matches', JSON.stringify(updated));
      loadIncompleteMatches();
    }
  };

  return (
    <div className="incomplete-tab-container" style={{ paddingBottom: '70px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>⏳ Incomplete Matches</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Paused games & Day Stumps matches ready to resume
        </p>
      </div>

      {incompleteMatches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
          <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>No Incomplete Matches</p>
          <p style={{ fontSize: '0.8rem' }}>When you pause a match or declare Day Stumps, it will show here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {incompleteMatches.map((match) => {
            const currentInnings = match.inningsList ? match.inningsList[match.currentInningsIndex] : null;
            const runs = currentInnings ? currentInnings.runs : 0;
            const wickets = currentInnings ? currentInnings.wickets : 0;
            const balls = currentInnings ? currentInnings.balls : 0;
            const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
            const isTest = match.matchSettings?.format === 'test';

            return (
              <div 
                key={match.id} 
                className="card match-card"
                onClick={() => onResumeMatch(match)}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--warning)', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge" style={{ background: 'rgba(255, 234, 0, 0.15)', color: 'var(--warning)' }}>
                        {isTest ? 'Test Match' : `${match.matchSettings?.overs} Overs`}
                      </span>
                      {match.stumpsStatus && (
                        <span className="badge" style={{ background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Moon size={10} /> {match.stumpsStatus}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginTop: '6px' }}>
                      {match.matchSettings?.team1} vs {match.matchSettings?.team2}
                    </h3>
                  </div>

                  <button 
                    className="edit-name-btn"
                    onClick={(e) => handleDeleteMatch(match.id, e)}
                    title="Delete Saved Match"
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {currentInnings?.team}: {runs}/{wickets} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({oversStr} ov)</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Calendar size={12} /> {match.date}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}>
                    <Play size={14} /> Resume
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
