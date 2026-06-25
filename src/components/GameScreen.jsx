import React, { useState } from 'react';
import { Undo, RotateCcw, AlertTriangle, ShieldCheck, ArrowRight, UserPlus, HelpCircle } from 'lucide-react';

export default function GameScreen({
  matchSettings,
  toss,
  inningsList,
  currentInningsIndex,
  strikerName,
  nonStrikerName,
  bowlerName,
  onBallScored,
  onUndo,
  onDeclare,
  onSwapBatsmen,
  team1,
  team2,
}) {
  const currentInnings = inningsList[currentInningsIndex];
  const isTest = matchSettings.format === 'test';
  
  // Local modal states
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [whoIsOut, setWhoIsOut] = useState('striker');
  const [newBatsmanName, setNewBatsmanName] = useState('');
  
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [nextBowlerName, setNextBowlerName] = useState('');
  
  const [showDeclareConfirm, setShowDeclareConfirm] = useState(false);

  // Helper calculations
  const totalRuns = currentInnings.runs;
  const totalWickets = currentInnings.wickets;
  const totalBalls = currentInnings.balls;
  const oversStr = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
  const runRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 6).toFixed(2) : '0.00';

  // Get active batsmen stats
  const strikerStats = currentInnings.batsmen[strikerName] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const nonStrikerStats = currentInnings.batsmen[nonStrikerName] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bowlerStats = currentInnings.bowlers[bowlerName] || { balls: 0, maidens: 0, runs: 0, wickets: 0 };

  // Calculate target and required runs
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  let reqRunRate = null;

  const isLimited = matchSettings.format === 'limited';

  if (isLimited && currentInningsIndex === 1) {
    // Second innings of Limited Overs match
    const firstInnings = inningsList[0];
    target = firstInnings.runs + 1;
    runsNeeded = target - totalRuns;
    ballsRemaining = (matchSettings.overs * 6) - totalBalls;
    reqRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
  } else if (isTest) {
    // Test match math
    // 4th innings: Chasing target
    // Wait, let's see how the innings are sequenced:
    // Innings 0: Team A (1st Innings)
    // Innings 1: Team B (1st Innings)
    // Innings 2: Team A or Team B (2nd Innings - e.g. follow on or normal)
    // Innings 3: Team B or Team A (2nd Innings - chasing target)
    // We will compute the exact chase requirements dynamically in App.jsx and pass a target prop, 
    // or let's calculate it here. For simplicity, let's assume we pass target if it's the final chasing innings.
  }

  // Wicket type handler
  const handleWicketSubmit = (e) => {
    e.preventDefault();
    if (!newBatsmanName.trim()) return;
    if (newBatsmanName.trim() === strikerName || newBatsmanName.trim() === nonStrikerName) {
      alert("New batsman cannot be the same as the current batsmen!");
      return;
    }

    onBallScored({
      type: 'wicket',
      wicketType,
      whoIsOut, // 'striker' or 'nonStriker'
      newBatsman: newBatsmanName.trim(),
    });

    // Reset local state
    setShowWicketModal(false);
    setNewBatsmanName('');
    setWicketType('bowled');
    setWhoIsOut('striker');
  };

  // Bowler change handler
  const handleBowlerSubmit = (e) => {
    e.preventDefault();
    if (!nextBowlerName.trim()) return;
    
    onBallScored({
      type: 'bowler_change',
      nextBowler: nextBowlerName.trim()
    });

    setShowBowlerModal(false);
    setNextBowlerName('');
  };

  // Basic run scorer handler
  const handleScoring = (runs) => {
    onBallScored({ type: 'runs', value: runs });
    
    // Check if over completed (and not a wicket or extras that keep same bowler)
    // We check totalBalls + 1 since this runs before parent state completes.
    // Actually, it's safer to let App.jsx trigger the bowler change modal when it receives the ball update
    // But since App.jsx is the state source, we can just trigger bowler modal if the next ball is start of new over.
  };

  // Check if current over is complete (6 legal balls)
  // App.jsx will set a flag or we can check here.
  const isOverComplete = totalBalls > 0 && totalBalls % 6 === 0 && currentInnings.overHistory.filter(x => !x.includes('Wd') && !x.includes('Nb')).length === 6;
  // Actually, standard cricket logic: 6 legal balls in current over = over complete.
  // Let's check legal balls in current over:
  const legalBallsInOver = currentInnings.overHistory.filter(x => !x.includes('wd') && !x.includes('nb')).length;

  const triggerNewBowlerPrompt = () => {
    setShowBowlerModal(true);
  };

  // Helper for ball bubble class
  const getBallBubbleClass = (ball) => {
    if (ball.includes('W')) return 'ball-bubble wicket';
    if (ball.includes('wd') || ball.includes('nb')) return 'ball-bubble extra';
    if (ball === '4') return 'ball-bubble run-4';
    if (ball === '6') return 'ball-bubble run-6';
    return 'ball-bubble';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scoreboard Header */}
      <div className="scoreboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-active">
            {isTest ? `Innings ${currentInningsIndex + 1}` : 'Live Match'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {currentInnings.team} Batting
          </span>
        </div>
        
        <div className="score-row">
          <div className="score-main">
            {totalRuns}<span>/{totalWickets}</span>
          </div>
          <div className="score-overs">
            Overs {oversStr} {isLimited && `(of ${matchSettings.overs})`}
          </div>
        </div>

        {isTest && (
          <div className="toss-info-block" style={{ marginTop: '8px', marginBottom: 0 }}>
            {inningsList.map((inn, idx) => (
              <span key={idx} style={{ 
                marginRight: '12px', 
                color: idx === currentInningsIndex ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: idx === currentInningsIndex ? '700' : 'normal'
              }}>
                I{idx+1}: {inn.runs}/{inn.wickets}
              </span>
            ))}
          </div>
        )}

        {target !== null && runsNeeded > 0 && (
          <div className="target-alert">
            🎯 {runsNeeded} runs needed from {ballsRemaining} balls (Req: {reqRunRate} RPO)
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className="players-container">
        {/* Striker */}
        <div className={`player-card active`}>
          <div>
            <div className="player-name">
              🏏 {strikerName} <span style={{ color: 'var(--primary)' }}>(Striker)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              SR: {strikerStats.balls > 0 ? ((strikerStats.runs / strikerStats.balls) * 100).toFixed(1) : '0.0'}
            </span>
          </div>
          <div className="player-stats">
            {strikerStats.runs} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({strikerStats.balls})</span>
            <span className="player-stats-label">4s: {strikerStats.fours} | 6s: {strikerStats.sixes}</span>
          </div>
        </div>

        {/* Non-Striker */}
        <div className="player-card" style={{ cursor: 'pointer' }} onClick={onSwapBatsmen} title="Click to swap strike manually">
          <div>
            <div className="player-name" style={{ color: 'var(--text-secondary)' }}>
              🚶‍♂️ {nonStrikerName}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              SR: {nonStrikerStats.balls > 0 ? ((nonStrikerStats.runs / nonStrikerStats.balls) * 100).toFixed(1) : '0.0'}
            </span>
          </div>
          <div className="player-stats" style={{ color: 'var(--text-secondary)' }}>
            {nonStrikerStats.runs} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({nonStrikerStats.balls})</span>
            <span className="player-stats-label">4s: {nonStrikerStats.fours} | 6s: {nonStrikerStats.sixes}</span>
          </div>
        </div>

        {/* Bowler */}
        <div className="player-card bowler-card active">
          <div>
            <div className="player-name" style={{ color: 'var(--secondary)' }}>
              🥎 {bowlerName}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Econ: {bowlerStats.balls > 0 ? ((bowlerStats.runs / bowlerStats.balls) * 6).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="player-stats" style={{ color: 'var(--secondary)' }}>
            {bowlerStats.wickets}-{bowlerStats.runs}
            <span className="player-stats-label">
              Overs: {Math.floor(bowlerStats.balls / 6)}.{bowlerStats.balls % 6}
            </span>
          </div>
        </div>
      </div>

      {/* Over History Bubble Feed */}
      <div className="over-balls-container">
        <span className="over-balls-label">This Over ({legalBallsInOver}/6):</span>
        <div className="balls-row">
          {currentInnings.overHistory.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>First ball of the over</span>
          ) : (
            currentInnings.overHistory.map((ball, idx) => (
              <div key={idx} className={getBallBubbleClass(ball)}>
                {ball}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Over End Banner Indicator */}
      {legalBallsInOver === 6 && (
        <div className="card" style={{ 
          background: 'rgba(0, 210, 255, 0.1)', 
          border: '1.5px dashed var(--secondary)', 
          textAlign: 'center', 
          padding: '12px',
          animation: 'pulse-cyan 2s infinite',
          cursor: 'pointer'
        }} onClick={triggerNewBowlerPrompt}>
          <span style={{ color: 'var(--secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            🔄 Over Complete! Click to change bowler <ArrowRight size={16} />
          </span>
        </div>
      )}

      {/* Scoring Keypad Controls */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="keypad-grid">
          {/* Normal Runs */}
          <button className="keypad-btn runs" onClick={() => handleScoring(0)} disabled={legalBallsInOver === 6}>0<span className="label">Dot</span></button>
          <button className="keypad-btn runs" onClick={() => handleScoring(1)} disabled={legalBallsInOver === 6}>1<span className="label">Single</span></button>
          <button className="keypad-btn runs" onClick={() => handleScoring(2)} disabled={legalBallsInOver === 6}>2<span className="label">Double</span></button>
          <button className="keypad-btn runs" onClick={() => handleScoring(3)} disabled={legalBallsInOver === 6}>3<span className="label">Triple</span></button>
          
          <button className="keypad-btn boundary" onClick={() => handleScoring(4)} disabled={legalBallsInOver === 6}>4<span className="label">Four</span></button>
          <button className="keypad-btn boundary" onClick={() => handleScoring(6)} disabled={legalBallsInOver === 6}>6<span className="label">Six</span></button>
          
          {/* Extras */}
          <button className="keypad-btn extras" onClick={() => onBallScored({ type: 'extras', subType: 'wd' })} disabled={legalBallsInOver === 6}>wd<span className="label">Wide</span></button>
          <button className="keypad-btn extras" onClick={() => onBallScored({ type: 'extras', subType: 'nb' })} disabled={legalBallsInOver === 6}>nb<span className="label">No Ball</span></button>
          
          <button className="keypad-btn extras" onClick={() => {
            const byes = prompt("Enter Bye runs (1-4):", "1");
            if (byes && ['1','2','3','4'].includes(byes)) {
              onBallScored({ type: 'extras', subType: 'b', value: Number(byes) });
            }
          }} disabled={legalBallsInOver === 6}>B<span className="label">Byes</span></button>

          <button className="keypad-btn extras" onClick={() => {
            const legByes = prompt("Enter Leg Bye runs (1-4):", "1");
            if (legByes && ['1','2','3','4'].includes(legByes)) {
              onBallScored({ type: 'extras', subType: 'lb', value: Number(legByes) });
            }
          }} disabled={legalBallsInOver === 6}>Lb<span className="label">Leg Byes</span></button>

          {/* Wicket */}
          <button className="keypad-btn out" onClick={() => setShowWicketModal(true)} disabled={legalBallsInOver === 6}>
            OUT 🛑 <span className="label" style={{ color: 'rgba(255, 23, 68, 0.8)' }}>Dismissal</span>
          </button>
        </div>

        {/* Undo and Extra options (Declare) */}
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={onUndo} style={{ flex: 1 }}>
            <Undo size={16} /> Undo Ball
          </button>
          
          {/* Declare Option (Highly relevant for Test matching) */}
          <button 
            className="btn btn-danger" 
            onClick={() => setShowDeclareConfirm(true)}
            style={{ flex: 1 }}
          >
            🏁 Declare Innings
          </button>
        </div>
      </div>

      {/* WICKET MODAL OVERLAY */}
      {showWicketModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🔴 Dismissal Details</h3>
            
            <div className="form-group">
              <label className="form-label">Who is OUT?</label>
              <div className="btn-group" style={{ marginBottom: '10px' }}>
                <button 
                  type="button"
                  className={`btn ${whoIsOut === 'striker' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setWhoIsOut('striker')}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Striker ({strikerName})
                </button>
                <button 
                  type="button"
                  className={`btn ${whoIsOut === 'nonStriker' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setWhoIsOut('nonStriker')}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Non-Striker ({nonStrikerName})
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Type of Wicket</label>
              <div className="dismissal-grid">
                {['bowled', 'caught', 'run out', 'stumped', 'lbw'].map((type) => (
                  <button 
                    key={type}
                    type="button"
                    className={`dismissal-btn ${wicketType === type ? 'selected' : ''}`}
                    onClick={() => setWicketType(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleWicketSubmit} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Name of New Batsman</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Enter new batsman..."
                value={newBatsmanName}
                onChange={(e) => setNewBatsmanName(e.target.value)}
                maxLength={20}
                required
              />
              
              <div className="btn-group" style={{ marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowWicketModal(false);
                    setNewBatsmanName('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  Confirm Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOWLER CHANGE MODAL OVERLAY */}
      {showBowlerModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🥎 Bowler Change</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Select next bowler for the new over. Previous bowler: <strong>{bowlerName}</strong>
            </p>
            
            <form onSubmit={handleBowlerSubmit} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Bowler Name</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Enter bowler name..."
                value={nextBowlerName}
                onChange={(e) => setNextBowlerName(e.target.value)}
                maxLength={20}
                required
              />
              
              <div className="btn-group" style={{ marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowBowlerModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent"
                  style={{ flex: 1 }}
                >
                  Start Over
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECLARE INNINGS CONFIRMATION MODAL */}
      {showDeclareConfirm && (
        <div className="overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 8px' }} />
            <h3 className="modal-title" style={{ color: 'var(--error)' }}>Declare Innings?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Are you sure you want to declare the innings for <strong>{currentInnings.team}</strong> at <strong>{totalRuns}/{totalWickets}</strong>? 
              This will immediately transition to the next innings and cannot be undone.
            </p>
            
            <div className="btn-group" style={{ marginTop: '16px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeclareConfirm(false)}
                style={{ flex: 1 }}
              >
                No, Keep Playing
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  setShowDeclareConfirm(false);
                  onDeclare();
                }}
                style={{ flex: 1 }}
              >
                Yes, Declare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
