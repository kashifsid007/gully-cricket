import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, ArrowLeft, ArrowRightLeft, Sparkles, Edit2, Check } from 'lucide-react';
import { autoRegisterPlayer } from '../utils/playerDb';
import { getTeamSquad } from '../utils/squadDb';

export default function StrikerSetupScreen({ battingTeam, bowlingTeam, onStartGame, onBack }) {
  const battingSquad = getTeamSquad(battingTeam);
  const bowlingSquad = getTeamSquad(bowlingTeam);

  // Default player picks
  const defaultStriker = battingSquad[0]?.name || 'KASHIF';
  const defaultNonStriker = battingSquad[1]?.name || (battingSquad[0]?.name ? battingSquad[0].name + ' 2' : 'Batter 2');
  const defaultBowler = bowlingSquad[0]?.name || 'Bowler 1';

  const [striker, setStriker] = useState(defaultStriker);
  const [nonStriker, setNonStriker] = useState(defaultNonStriker);
  const [bowler, setBowler] = useState(defaultBowler);

  // Custom name edit toggles
  const [showCustomStriker, setShowCustomStriker] = useState(false);
  const [showCustomNonStriker, setShowCustomNonStriker] = useState(false);
  const [showCustomBowler, setShowCustomBowler] = useState(false);

  // Initialize on mount or team change
  useEffect(() => {
    if (battingSquad.length >= 1) setStriker(battingSquad[0].name);
    if (battingSquad.length >= 2) setNonStriker(battingSquad[1].name);
    if (bowlingSquad.length >= 1) setBowler(bowlingSquad[0].name);
  }, [battingTeam, bowlingTeam]);

  // Swap striker and non-striker
  const handleSwapStrikers = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sName = striker.trim();
    const nsName = nonStriker.trim();
    const bName = bowler.trim();

    if (!sName || !nsName || !bName) return;
    if (sName.toLowerCase() === nsName.toLowerCase()) {
      alert('Striker 1 and Striker 2 (Non-Striker) cannot have the same name!');
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
    <div className="striker-setup-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
      {/* Top Header with Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={13} /> Back
          </button>
        )}
        <div className="series-pill-badge" style={{ margin: 0 }}>
          <Sparkles size={11} color="#00e5ff" />
          <span>Match Lineup Setup</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
          Select Opening Lineup
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
          Tap squad member to select · No typing required
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
        {/* ================= BATTING SQUAD SELECTION ================= */}
        <div className="card lineup-team-card batting-card" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="lineup-card-header" style={{ paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="lineup-team-tag batting-tag">BATTING</span>
              <h3 className="lineup-team-title" style={{ color: '#00e5ff', fontSize: '0.95rem' }}>{battingTeam}</h3>
            </div>
            <span className="lineup-squad-count" style={{ fontSize: '0.65rem' }}>{battingSquad.length} Players</span>
          </div>

          {/* STRIKER 1 */}
          <div className="lineup-field-group" style={{ gap: '4px' }}>
            <div className="lineup-field-header">
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🏏 Striker 1 (On Strike): <strong style={{ color: '#ffffff', textDecoration: 'underline' }}>{striker}</strong>
              </span>
              <button
                type="button"
                className="btn-custom-toggle"
                onClick={() => setShowCustomStriker(!showCustomStriker)}
                title="Type custom name"
              >
                <Edit2 size={11} /> {showCustomStriker ? 'Done' : 'Custom'}
              </button>
            </div>

            {/* Quick Pick Squad Chips */}
            <div className="squad-quick-chips">
              {battingSquad.map((p, idx) => {
                const isSelected = striker === p.name;
                const isOtherBatter = nonStriker === p.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isOtherBatter}
                    onClick={() => { setStriker(p.name); setShowCustomStriker(false); }}
                    className={`squad-chip ${isSelected ? 'active-striker' : ''} ${isOtherBatter ? 'disabled-chip' : ''}`}
                    title={isOtherBatter ? 'Already selected as Striker 2' : `Select ${p.name}`}
                  >
                    <span className="chip-avatar">{p.name.substring(0, 2).toUpperCase()}</span>
                    <span className="chip-name">{p.name}</span>
                    {p.isCaptain && <span className="chip-crown">👑</span>}
                  </button>
                );
              })}
            </div>

            {showCustomStriker && (
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                value={striker} 
                onChange={(e) => setStriker(e.target.value)} 
                placeholder="Type custom striker name..."
                maxLength={20}
                required
                autoFocus
              />
            )}
          </div>

          {/* SWAP BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1px 0' }}>
            <button
              type="button"
              onClick={handleSwapStrikers}
              className="btn-swap-lineup"
              title="Swap Striker 1 and Striker 2"
            >
              <ArrowRightLeft size={11} /> Swap Striker 1 & 2
            </button>
          </div>

          {/* STRIKER 2 (NON-STRIKER) */}
          <div className="lineup-field-group" style={{ gap: '4px' }}>
            <div className="lineup-field-header">
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🏃 Striker 2 (Non-Striker): <strong style={{ color: '#ffffff', textDecoration: 'underline' }}>{nonStriker}</strong>
              </span>
              <button
                type="button"
                className="btn-custom-toggle"
                onClick={() => setShowCustomNonStriker(!showCustomNonStriker)}
                title="Type custom name"
              >
                <Edit2 size={11} /> {showCustomNonStriker ? 'Done' : 'Custom'}
              </button>
            </div>

            {/* Quick Pick Squad Chips */}
            <div className="squad-quick-chips">
              {battingSquad.map((p, idx) => {
                const isSelected = nonStriker === p.name;
                const isOtherBatter = striker === p.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isOtherBatter}
                    onClick={() => { setNonStriker(p.name); setShowCustomNonStriker(false); }}
                    className={`squad-chip ${isSelected ? 'active-nonstriker' : ''} ${isOtherBatter ? 'disabled-chip' : ''}`}
                    title={isOtherBatter ? 'Already selected as Striker 1' : `Select ${p.name}`}
                  >
                    <span className="chip-avatar">{p.name.substring(0, 2).toUpperCase()}</span>
                    <span className="chip-name">{p.name}</span>
                    {p.isCaptain && <span className="chip-crown">👑</span>}
                  </button>
                );
              })}
            </div>

            {showCustomNonStriker && (
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                value={nonStriker} 
                onChange={(e) => setNonStriker(e.target.value)} 
                placeholder="Type custom non-striker name..."
                maxLength={20}
                required
                autoFocus
              />
            )}
          </div>
        </div>

        {/* ================= BOWLING SQUAD SELECTION ================= */}
        <div className="card lineup-team-card bowling-card" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="lineup-card-header" style={{ paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="lineup-team-tag bowling-tag">BOWLING</span>
              <h3 className="lineup-team-title" style={{ color: '#fb7185', fontSize: '0.95rem' }}>{bowlingTeam}</h3>
            </div>
            <span className="lineup-squad-count" style={{ fontSize: '0.65rem' }}>{bowlingSquad.length} Players</span>
          </div>

          <div className="lineup-field-group" style={{ gap: '4px' }}>
            <div className="lineup-field-header">
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🥎 Opening Bowler: <strong style={{ color: '#ffffff', textDecoration: 'underline' }}>{bowler}</strong>
              </span>
              <button
                type="button"
                className="btn-custom-toggle"
                onClick={() => setShowCustomBowler(!showCustomBowler)}
                title="Type custom name"
              >
                <Edit2 size={11} /> {showCustomBowler ? 'Done' : 'Custom'}
              </button>
            </div>

            {/* Quick Pick Squad Chips */}
            <div className="squad-quick-chips">
              {bowlingSquad.map((p, idx) => {
                const isSelected = bowler === p.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setBowler(p.name); setShowCustomBowler(false); }}
                    className={`squad-chip ${isSelected ? 'active-bowler' : ''}`}
                    title={`Select ${p.name} as Opening Bowler`}
                  >
                    <span className="chip-avatar bowler-avatar">{p.name.substring(0, 2).toUpperCase()}</span>
                    <span className="chip-name">{p.name}</span>
                    {p.isCaptain && <span className="chip-crown">👑</span>}
                  </button>
                );
              })}
            </div>

            {showCustomBowler && (
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '0.8rem', marginTop: '2px' }}
                value={bowler} 
                onChange={(e) => setBowler(e.target.value)} 
                placeholder="Type custom bowler name..."
                maxLength={20}
                required
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Selected Lineup Summary Pill */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px', 
          padding: '6px 10px', 
          fontSize: '0.72rem', 
          textAlign: 'center', 
          color: 'var(--text-secondary)' 
        }}>
          🏏 Batting: <strong style={{ color: '#00e5ff' }}>{striker}</strong> & <strong style={{ color: '#00ff88' }}>{nonStriker}</strong> | 🥎 Bowling: <strong style={{ color: '#fb7185' }}>{bowler}</strong>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.95rem', padding: '11px', width: '100%', justifyContent: 'center' }}>
            Confirm Lineup & Start Match
          </button>
        </div>
      </form>
    </div>
  );
}
