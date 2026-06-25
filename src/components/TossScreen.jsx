import React, { useState } from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';

export default function TossScreen({ team1, team2, onTossComplete }) {
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState(''); // 'bat' or 'bowl'
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState('');

  const handleSimulateToss = () => {
    setIsSimulating(true);
    setSimulationResult('');
    
    // Simulate coin spin for 1.2 seconds
    setTimeout(() => {
      const winner = Math.random() < 0.5 ? team1 : team2;
      setTossWinner(winner);
      setSimulationResult(winner);
      setIsSimulating(false);
    }, 1200);
  };

  const handleManualSelect = (teamName) => {
    setTossWinner(teamName);
  };

  const handleSubmit = () => {
    if (!tossWinner || !decision) return;
    
    // Calculate who is batting first and bowling first
    let battingFirst, bowlingFirst;
    if (decision === 'bat') {
      battingFirst = tossWinner;
      bowlingFirst = tossWinner === team1 ? team2 : team1;
    } else {
      bowlingFirst = tossWinner;
      battingFirst = tossWinner === team1 ? team2 : team1;
    }

    onTossComplete({
      tossWinner,
      tossDecision: decision,
      battingFirst,
      bowlingFirst,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(0, 210, 255, 0.1)', borderRadius: '50%', marginBottom: '12px' }}>
          <HelpCircle size={40} color="#00d2ff" />
        </div>
        <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>The Toss</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Who won the toss and what did they choose?
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={handleSimulateToss} 
          disabled={isSimulating}
          className="btn btn-secondary"
          style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={16} className={isSimulating ? 'spin' : ''} style={{ animation: isSimulating ? 'shake 0.5s infinite' : 'none' }} />
          {isSimulating ? 'Spinning Coin...' : 'Simulate Random Toss'}
        </button>

        {simulationResult && (
          <div style={{ 
            fontSize: '1rem', 
            color: 'var(--primary)', 
            fontWeight: '600', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            textAlign: 'center',
            width: '100%'
          }}>
            🪙 {simulationResult} won the toss!
          </div>
        )}

        <div style={{ width: '100%' }}>
          <span className="form-label" style={{ display: 'block', marginBottom: '10px', textAlign: 'center' }}>
            Select Toss Winner
          </span>
          <div className="btn-group">
            <button 
              type="button" 
              className={`btn ${tossWinner === team1 ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => handleManualSelect(team1)}
              style={{ flex: 1 }}
            >
              {team1}
            </button>
            <button 
              type="button" 
              className={`btn ${tossWinner === team2 ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => handleManualSelect(team2)}
              style={{ flex: 1 }}
            >
              {team2}
            </button>
          </div>
        </div>
      </div>

      {tossWinner && (
        <div className="card" style={{ animation: 'scale-up 0.3s ease' }}>
          <span className="form-label" style={{ display: 'block', marginBottom: '12px', textAlign: 'center' }}>
            What did {tossWinner} choose to do?
          </span>
          <div className="btn-group">
            <button 
              className={`btn ${decision === 'bat' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDecision('bat')}
              style={{ flex: 1, height: '60px', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '1.1rem' }}>🏏 BAT</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Choose to Bat</span>
            </button>
            <button 
              className={`btn ${decision === 'bowl' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDecision('bowl')}
              style={{ flex: 1, height: '60px', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '1.1rem' }}>🥎 BOWL</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Choose to Bowl</span>
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button 
          onClick={handleSubmit} 
          disabled={!tossWinner || !decision}
          className="btn btn-primary"
        >
          Proceed to Lineup Setup
        </button>
      </div>
    </div>
  );
}
