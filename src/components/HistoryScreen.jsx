import React, { useState, useEffect } from 'react';
import { Trash2, Play, Eye, ArrowLeft, Calendar, Award } from 'lucide-react';

export default function HistoryScreen({ onContinueMatch, onViewStats, onBack }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const loadedMatches = JSON.parse(localStorage.getItem('gully_cricket_matches') || '[]');
    setMatches(loadedMatches);
  }, []);

  const handleDelete = (matchId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this match record?')) return;
    
    const updated = matches.filter(m => m.id !== matchId);
    setMatches(updated);
    localStorage.setItem('gully_cricket_matches', JSON.stringify(updated));
  };

  const getFormatLabel = (settings) => {
    if (!settings) return 'Unknown Format';
    return settings.format === 'test' ? 'Test Match' : `${settings.overs} Overs`;
  };

  // Helper to construct a brief summary of scores
  const getScoreSummary = (match) => {
    if (!match.inningsList || match.inningsList.length === 0) return 'No scores available';
    
    const isTest = match.matchSettings?.format === 'test';
    
    if (isTest) {
      // Group innings by team to show aggregate/detailed scores
      const teamScores = {};
      match.inningsList.forEach((inn, idx) => {
        if (inn.balls > 0 || inn.declared || inn.wickets > 0) {
          if (!teamScores[inn.team]) teamScores[inn.team] = [];
          teamScores[inn.team].push(`${inn.runs}/${inn.wickets}${inn.declared ? 'd' : ''}`);
        }
      });
      
      return Object.entries(teamScores).map(([team, scores]) => {
        return `${team}: ${scores.join(' & ')}`;
      }).join(' | ');
    } else {
      // Limited Overs score
      return match.inningsList.map((inn, idx) => {
        const overs = `${Math.floor(inn.balls / 6)}.${inn.balls % 6}`;
        return `${inn.team}: ${inn.runs}/${inn.wickets} (${overs} ov)`;
      }).join(' vs ');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
        <button 
          onClick={onBack}
          className="edit-name-btn" 
          style={{ padding: '8px', color: 'var(--text-primary)', marginLeft: 0 }}
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>Match History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            View stats or resume incomplete games
          </p>
        </div>
      </div>

      {/* Match List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {matches.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1, 
            gap: '16px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '32px'
          }}>
            <Calendar size={48} style={{ opacity: 0.5 }} />
            <p>No matches recorded yet. Start a new match to see it here!</p>
          </div>
        ) : (
          <div className="history-list">
            {matches.map((match) => (
              <div key={match.id} className="history-card">
                <div className="history-card-header">
                  <div className="history-card-teams">
                    {match.matchSettings?.team1 || 'Team A'} vs {match.matchSettings?.team2 || 'Team B'}
                  </div>
                  <span className={`badge ${match.status === 'Completed' ? 'badge-active' : 'badge-secondary'}`}>
                    {match.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={14} color="var(--primary)" />
                    {getFormatLabel(match.matchSettings)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span>{match.date}</span>
                </div>

                <div className="history-card-scores">
                  {getScoreSummary(match)}
                </div>

                <div className="history-card-footer">
                  {match.status === 'Incomplete' && (
                    <button 
                      onClick={() => onContinueMatch(match)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}
                    >
                      <Play size={14} /> Resume Play
                    </button>
                  )}
                  
                  <button 
                    onClick={() => onViewStats(match)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', flex: match.status === 'Incomplete' ? 1 : 'none', width: match.status === 'Incomplete' ? 'auto' : '100%' }}
                  >
                    <Eye size={14} /> View Scorecard
                  </button>

                  <button 
                    onClick={(e) => handleDelete(match.id, e)}
                    className="btn btn-danger"
                    style={{ padding: '10px', width: 'auto', flexShrink: 0 }}
                    title="Delete Match"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
