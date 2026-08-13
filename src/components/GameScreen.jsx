import React, { useState, useEffect } from 'react';
import { Undo, ArrowRight, Edit2, Share2, Moon } from 'lucide-react';
import BroadcastScorecard from './BroadcastScorecard';
import BroadcastPlayerBanner from './BroadcastPlayerBanner';
import ShareModal from './ShareModal';
import { getPlayerByName, autoRegisterPlayer, getPlayerInitials } from '../utils/playerDb';

export default function GameScreen({
  matchSettings,
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
  onDayStumps,
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
  const [showStumpsConfirm, setShowStumpsConfirm] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // Player Renaming Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState('striker'); // striker, nonStriker, bowler
  const [renameOldName, setRenameOldName] = useState('');
  const [renameNewName, setRenameNewName] = useState('');

  // Animation Splash Screen State
  const [activeAnimation, setActiveAnimation] = useState(null); // 'FOUR', 'SIX', 'WICKET', null

  // Test Match Day Stumps state
  const [stumpsStatus, setStumpsStatus] = useState(null);

  // Auto-register current players in Player DB
  useEffect(() => {
    if (strikerName) autoRegisterPlayer(strikerName);
    if (nonStrikerName) autoRegisterPlayer(nonStrikerName);
    if (bowlerName) autoRegisterPlayer(bowlerName);
  }, [strikerName, nonStrikerName, bowlerName]);

  // Fetch player profiles from DB (for photo avatars)
  const strikerProfile = getPlayerByName(strikerName);
  const nonStrikerProfile = getPlayerByName(nonStrikerName);
  const bowlerProfile = getPlayerByName(bowlerName);

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
    const firstInnings = inningsList[0];
    target = firstInnings.runs + 1;
    runsNeeded = target - totalRuns;
    ballsRemaining = (matchSettings.overs * 6) - totalBalls;
    reqRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
  } else if (isTest && currentInningsIndex === 3) {
    const battingTeam = currentInnings.team;
    const bowlingTeam = currentInnings.bowlingTeam;
    const battingInnings1 = inningsList.find((inn, idx) => idx < 3 && inn.team === battingTeam);
    const bowlingInningsList = inningsList.filter((inn, idx) => idx < 3 && inn.team === bowlingTeam);
    
    if (battingInnings1 && bowlingInningsList.length === 2) {
      const bowlingTeamTotal = bowlingInningsList[0].runs + bowlingInningsList[1].runs;
      target = bowlingTeamTotal - battingInnings1.runs + 1;
      runsNeeded = target - totalRuns;
    }
  }

  // Handle Day Stumps (Test format)
  const handleDeclareStumps = () => {
    // Calculate day number based on total balls or innings
    let dayNum = 1;
    const totalMatchBalls = inningsList.reduce((sum, inn) => sum + inn.balls, 0);
    // Assume ~90 overs per day in test match
    dayNum = Math.min(5, Math.floor(totalMatchBalls / (90 * 6)) + 1);
    
    const label = `Day ${dayNum} Stumps`;
    setStumpsStatus(label);
    setShowStumpsConfirm(false);

    if (onDayStumps) {
      onDayStumps(label);
    }
  };

  // Wicket type handler
  const handleWicketSubmit = (e) => {
    e.preventDefault();
    if (!newBatsmanName.trim()) return;
    if (newBatsmanName.trim() === strikerName || newBatsmanName.trim() === nonStrikerName) {
      alert("New batsman cannot be the same as current batsmen!");
      return;
    }

    autoRegisterPlayer(newBatsmanName.trim());

    onBallScored({
      type: 'wicket',
      wicketType,
      whoIsOut,
      newBatsman: newBatsmanName.trim(),
    });

    setShowWicketModal(false);
    setNewBatsmanName('');
    setWicketType('bowled');
    setWhoIsOut('striker');

    setActiveAnimation('WICKET');
    setTimeout(() => setActiveAnimation(null), 1800);
  };

  // Bowler change handler
  const handleBowlerSubmit = (e) => {
    e.preventDefault();
    if (!nextBowlerName.trim()) return;
    
    autoRegisterPlayer(nextBowlerName.trim());

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
    autoRegisterPlayer(renameNewName.trim());
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', paddingBottom: '70px' }}>
      
      {/* Top Header Actions (Share & Day Stumps) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="badge badge-active">
          {isTest ? `Innings ${currentInningsIndex + 1}` : 'Live Match'}
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
          {isTest && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowStumpsConfirm(true)}
              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', border: '1px solid rgba(147, 51, 234, 0.4)' }}
            >
              <Moon size={12} /> Stumps
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => setShowShareModal(true)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(0, 229, 255, 0.3)' }}
          >
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      {/* Broadcast TV Style Scorecard Header */}
      <BroadcastScorecard
        teamName={currentInnings.team}
        runs={totalRuns}
        wickets={totalWickets}
        balls={totalBalls}
        isTest={isTest}
        inningsIndex={currentInningsIndex}
        stumpsStatus={stumpsStatus}
        targetInfo={runsNeeded > 0 ? { runsNeeded, ballsRemaining, reqRunRate } : null}
        inningsList={inningsList}
      />

      {/* TV BROADCAST HORIZONTAL PLAYER BANNER WITH POP-OUT AVATARS (Matching Reference Image) */}
      <BroadcastPlayerBanner
        strikerName={strikerName}
        strikerStats={strikerStats}
        nonStrikerName={nonStrikerName}
        nonStrikerStats={nonStrikerStats}
        bowlerName={bowlerName}
        bowlerStats={bowlerStats}
        onSwapBatsmen={onSwapBatsmen}
        onRenameClick={handleRenameClick}
      />

      {/* Over History Bubble Feed */}
      <div className="over-balls-container" style={{ marginTop: '12px' }}>
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
          padding: '10px',
          animation: 'pulse-cyan 2s infinite',
          cursor: 'pointer',
          marginTop: '8px',
          marginBottom: '8px'
        }} onClick={triggerNewBowlerPrompt}>
          <span style={{ color: 'var(--secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}>
            🔄 Over Complete! Click to change bowler <ArrowRight size={16} />
          </span>
        </div>
      )}

      {/* Scoring Keypad Controls */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
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

        {/* Action button row */}
        <div className="btn-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onUndo} style={{ flex: '1 1 28%', padding: '8px' }}>
            <Undo size={14} /> Undo Ball
          </button>
          
          {isTest && (
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDeclareConfirm(true)}
              style={{ flex: '1 1 28%', padding: '8px' }}
            >
              🏁 Declare
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAllOutConfirm(true)}
            style={{ 
              flex: '1 1 28%', 
              padding: '8px',
              background: 'rgba(255, 145, 0, 0.15)', 
              color: 'var(--warning)', 
              border: '1px solid rgba(255, 145, 0, 0.4)' 
            }}
          >
            🛑 All Out
          </button>
        </div>
      </div>

      {/* SHARE SCORECARD MODAL */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        matchSettings={matchSettings}
        currentInnings={currentInnings}
        strikerName={strikerName}
        strikerStats={strikerStats}
        nonStrikerName={nonStrikerName}
        nonStrikerStats={nonStrikerStats}
        bowlerName={bowlerName}
        bowlerStats={bowlerStats}
        stumpsStatus={stumpsStatus}
        inningsList={inningsList}
        currentInningsIndex={currentInningsIndex}
      />

      {/* RENAME PLAYER MODAL */}
      {showRenameModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">✏️ Rename {renameType.replace(/^\w/, c => c.toUpperCase())}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Modify name of <strong>{renameOldName}</strong>. Stats will be preserved.
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

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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

      {/* WICKET MODAL */}
      {showWicketModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🛑 Wicket / Dismissal</h3>
            <form onSubmit={handleWicketSubmit}>
              <div className="form-group">
                <label className="form-label">Who is Out?</label>
                <div className="btn-group">
                  <button 
                    type="button" 
                    className={`btn ${whoIsOut === 'striker' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setWhoIsOut('striker')}
                  >
                    🏏 Striker ({strikerName})
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${whoIsOut === 'nonStriker' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setWhoIsOut('nonStriker')}
                  >
                    🚶‍♂️ Non-Striker ({nonStrikerName})
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dismissal Type</label>
                <select 
                  className="form-select"
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                >
                  <option value="bowled">Bowled</option>
                  <option value="caught">Caught</option>
                  <option value="run out">Run Out</option>
                  <option value="lbw">LBW</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit wicket">Hit Wicket</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">New Batsman Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter incoming batsman name..."
                  value={newBatsmanName}
                  onChange={(e) => setNewBatsmanName(e.target.value)}
                  required
                  maxLength={20}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowWicketModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                >
                  Confirm Wicket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW BOWLER MODAL */}
      {showBowlerModal && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🔄 Over Complete - Select Bowler</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Current Bowler: <strong>{bowlerName}</strong>. Enter next bowler.
            </p>
            <form onSubmit={handleBowlerSubmit}>
              <div className="form-group">
                <label className="form-label">Next Bowler Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter bowler name..."
                  value={nextBowlerName}
                  onChange={(e) => setNextBowlerName(e.target.value)}
                  required
                  maxLength={20}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Set Bowler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECLARE INNINGS CONFIRMATION MODAL */}
      {showDeclareConfirm && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🏁 Declare Innings?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
              Are you sure you want to declare <strong>{currentInnings.team}</strong>'s innings at {totalRuns}/{totalWickets}?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeclareConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => { setShowDeclareConfirm(false); onDeclare(); }} style={{ flex: 1 }}>
                Yes, Declare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL OUT CONFIRMATION MODAL */}
      {showAllOutConfirm && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🛑 Force All Out?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
              Declare <strong>{currentInnings.team}</strong> all out with fewer than 10 wickets?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAllOutConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleAllOutSubmit} style={{ flex: 1 }}>
                Yes, End Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAY STUMPS CONFIRMATION MODAL */}
      {showStumpsConfirm && (
        <div className="overlay">
          <div className="modal">
            <h3 className="modal-title">🌙 Declare Day Stumps?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
              This will mark the end of today's play in this Test match. The score <strong>{currentInnings.team} {totalRuns}/{totalWickets}</strong> will be saved as Day Stumps and you can resume anytime from the Incomplete Matches tab!
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowStumpsConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleDeclareStumps} 
                style={{ flex: 1, background: 'linear-gradient(135deg, #7e22ce, #9333ea)' }}
              >
                Declare Day Stumps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
