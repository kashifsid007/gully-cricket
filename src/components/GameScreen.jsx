import React, { useState } from 'react';
import { Undo, RotateCcw, AlertTriangle, ShieldCheck, ArrowRight, UserPlus, HelpCircle, Edit2 } from 'lucide-react';

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
  onRenamePlayer,
  onAllOut,
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
  const [showAllOutConfirm, setShowAllOutConfirm] = useState(false);

  // Player Renaming Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState('striker'); // striker, nonStriker, bowler
  const [renameOldName, setRenameOldName] = useState('');
  const [renameNewName, setRenameNewName] = useState('');

  // Animation Splash Screen State
  const [activeAnimation, setActiveAnimation] = useState(null); // 'FOUR', 'SIX', 'WICKET', null

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
  } else if (isTest && currentInningsIndex === 3) {
    // 4th innings of Test match: Chasing target
    const battingTeam = currentInnings.team;
    const bowlingTeam = currentInnings.bowlingTeam;
    
    // Find the first innings scored by this batting team
    const battingInnings1 = inningsList.find((inn, idx) => idx < 3 && inn.team === battingTeam);
    // Find the two innings scored by the bowling team
    const bowlingInningsList = inningsList.filter((inn, idx) => idx < 3 && inn.team === bowlingTeam);
    
    if (battingInnings1 && bowlingInningsList.length === 2) {
      const bowlingTeamTotal = bowlingInningsList[0].runs + bowlingInningsList[1].runs;
      target = bowlingTeamTotal - battingInnings1.runs + 1;
      runsNeeded = target - totalRuns;
    }
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

    // Trigger Wicket Animation!
    setActiveAnimation('WICKET');
    setTimeout(() => setActiveAnimation(null), 1800);
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
    if (runs === 4) {
      setActiveAnimation('FOUR');
      setTimeout(() => setActiveAnimation(null), 1800);
    } else if (runs === 6) {
      setActiveAnimation('SIX');
      setTimeout(() => setActiveAnimation(null), 1800);
    }
    
    onBallScored({ type: 'runs', value: runs });
  };

  // Helper to open rename modal
  const handleRenameClick = (type, oldName) => {
    setRenameType(type);
    setRenameOldName(oldName);
    setRenameNewName(oldName);
    setShowRenameModal(true);
  };

  // Submit rename handler
  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!renameNewName.trim()) return;
    onRenamePlayer(renameType, renameOldName, renameNewName.trim());
    setShowRenameModal(false);
  };

  // Submit all-out handler
  const handleAllOutSubmit = () => {
    setShowAllOutConfirm(false);
    onAllOut();
  };

  // Check legal balls in current over:
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

  // Render floating animation particles
  const renderParticles = (type) => {
    let emojis = ['🌟', '🏏', '🥎', '✨', '⚡'];
    if (type === 'WICKET') {
      emojis = ['☝️', '🔴', '💥', '💀', '❌'];
    }
    return Array.from({ length: 15 }).map((_, i) => {
      const left = Math.random() * 90 + 5; // 5% to 95%
      const delay = Math.random() * 0.8; // 0s to 0.8s
      const duration = 1.2 + Math.random() * 0.8; // 1.2s to 2s
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      
      return (
        <span 
          key={i} 
          className="particle"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        >
          {emoji}
        </span>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
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
                I{idx+1}: {inn.runs}/{inn.wickets}{inn.declared ? 'd' : ''}
              </span>
            ))}
          </div>
        )}

        {target !== null && runsNeeded > 0 && (
          <div className="target-alert">
            🎯 {runsNeeded} runs needed {ballsRemaining !== null ? `from ${ballsRemaining} balls (Req: ${reqRunRate} RPO)` : 'to win'}
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className="players-container">
        {/* Striker */}
        <div className="player-card active">
          <div>
            <div className="player-name" style={{ display: 'flex', alignItems: 'center' }}>
              🏏 {strikerName} 
              <button 
                className="edit-name-btn"
                onClick={() => handleRenameClick('striker', strikerName)}
                title="Rename Striker"
              >
                <Edit2 size={12} />
              </button>
              <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>(Striker)</span>
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
            <div className="player-name" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              🚶‍♂️ {nonStrikerName}
              <button 
                className="edit-name-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameClick('nonStriker', nonStrikerName);
                }}
                title="Rename Non-Striker"
              >
                <Edit2 size={12} />
              </button>
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
            <div className="player-name" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center' }}>
              🥎 {bowlerName}
              <button 
                className="edit-name-btn"
                onClick={() => handleRenameClick('bowler', bowlerName)}
                title="Rename Bowler"
              >
                <Edit2 size={12} />
              </button>
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
          cursor: 'pointer',
          marginBottom: '16px'
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

        {/* Undo and Extra options */}
        <div className="btn-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onUndo} style={{ flex: '1 1 30%' }}>
            <Undo size={16} /> Undo Ball
          </button>
          
          {isTest && (
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDeclareConfirm(true)}
              style={{ flex: '1 1 30%' }}
            >
              🏁 Declare
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAllOutConfirm(true)}
            style={{ 
              flex: '1 1 30%', 
              background: 'rgba(255, 145, 0, 0.15)', 
              color: 'var(--warning)', 
              border: '1px solid rgba(255, 145, 0, 0.4)' 
            }}
          >
            🛑 All Out
          </button>
        </div>
      </div>

      {/* RENAME PLAYER MODAL OVERLAY */}
      {showRenameModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">✏️ Rename {renameType.replace(/^\w/, c => c.toUpperCase())}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Modify the name of <strong>{renameOldName}</strong>. Stats will be retained.
            </p>
            
            <form onSubmit={handleRenameSubmit} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Player Name</label>
              <input 
                type="text"
                className="form-input"
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                maxLength={20}
                required
                autoFocus
              />
              
              <div className="btn-group" style={{ marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowRenameModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ALL OUT CONFIRMATION MODAL */}
      {showAllOutConfirm && (
        <div className="overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 8px' }} />
            <h3 className="modal-title" style={{ color: 'var(--warning)' }}>Declare Team All Out?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Are you sure you want to end this batting innings for <strong>{currentInnings.team}</strong> as All Out? 
              This will transition to the next innings/match summary.
            </p>
            
            <div className="btn-group" style={{ marginTop: '16px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAllOutConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleAllOutSubmit}
                style={{ flex: 1 }}
              >
                Yes, All Out
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* BROADCAST ANIMATION SPLASH OVERLAY */}
      {activeAnimation && (
        <div 
          className={`animation-overlay ${activeAnimation.toLowerCase()}`}
          onClick={() => setActiveAnimation(null)}
          style={{ cursor: 'pointer' }}
        >
          <div className="particles-container">
            {renderParticles(activeAnimation)}
          </div>
          <h1 className="animation-text-glow">
            {activeAnimation === 'FOUR' && 'FOUR! 🚀'}
            {activeAnimation === 'SIX' && 'MAXIMUM! ☄️'}
            {activeAnimation === 'WICKET' && 'OUT! 🔴'}
          </h1>
          <div className="animation-subtext">
            {activeAnimation === 'FOUR' && 'Splendid Boundary! 🏏'}
            {activeAnimation === 'SIX' && 'Massive Hit over the ropes! 🚀'}
            {activeAnimation === 'WICKET' && 'What a breakthrough! ☝️'}
          </div>
        </div>
      )}
    </div>
  );
}
