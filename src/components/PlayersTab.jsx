import React, { useState, useEffect } from 'react';
import { UserPlus, Upload, Camera, Search, UserCheck, Trash2 } from 'lucide-react';
import { deletePlayer, getAllPlayers, savePlayer, getPlayerInitials } from '../utils/playerDb';
import { subscribeToMatches, subscribeToPlayers } from '../utils/realtimeDb';
import { buildPlayerStats, getEmptyPlayerStats } from '../utils/playerStats';

export default function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [playerPhoto, setPlayerPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const unsubscribePlayers = subscribeToPlayers(setPlayers);
    const unsubscribeMatches = subscribeToMatches(setMatches);
    return () => {
      unsubscribePlayers();
      unsubscribeMatches();
    };
  }, []);

  const loadPlayers = () => {
    const list = getAllPlayers();
    setPlayers(list);
  };

  // Resize and convert uploaded image file to compressed Base64 string
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPlayerPhoto(dataUrl);
        setPhotoPreview(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = (playerToEdit = null) => {
    if (playerToEdit) {
      setEditingPlayer(playerToEdit);
      setPlayerName(playerToEdit.name);
      setPlayerPhoto(playerToEdit.photo || null);
      setPhotoPreview(playerToEdit.photo || null);
    } else {
      setEditingPlayer(null);
      setPlayerName('');
      setPlayerPhoto(null);
      setPhotoPreview(null);
    }
    setShowAddModal(true);
  };

  const handleSavePlayerSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    savePlayer({
      id: editingPlayer ? editingPlayer.id : Date.now().toString(),
      name: playerName.trim(),
      photo: playerPhoto,
      matches: editingPlayer ? editingPlayer.matches : 0,
      runs: editingPlayer ? editingPlayer.runs : 0,
      wickets: editingPlayer ? editingPlayer.wickets : 0,
    });

    setShowAddModal(false);
    loadPlayers();
  };

  const handleDeletePlayer = (player) => {
    if (!window.confirm(`Delete ${player.name} from the Player Directory? Match history and tournament squads will be kept.`)) return;
    deletePlayer(player.id);
    if (editingPlayer?.id === player.id) {
      setShowAddModal(false);
      setEditingPlayer(null);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const playerStats = buildPlayerStats(matches);
  const rankedPlayers = players.map((player) => ({
    name: player.name,
    stats: playerStats[player.name.toLowerCase()]?.overall || getEmptyPlayerStats().overall,
  }));
  const topRunScorer = [...rankedPlayers].sort((a, b) => b.stats.runs - a.stats.runs)[0];
  const topWicketTaker = [...rankedPlayers].sort((a, b) => b.stats.wickets - a.stats.wickets)[0];
  const hasRecordedStats = rankedPlayers.some((player) => player.stats.matches > 0);

  return (
    <div className="players-tab-container" style={{ paddingBottom: '70px' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>👥 Player Directory</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Upload photos & manage registered players
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => handleOpenAddModal()} 
          style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
        >
          <UserPlus size={16} /> Add Player
        </button>
      </div>

      {hasRecordedStats && (
        <div className="tournament-leader-grid player-leader-grid">
          <div className="card tournament-leader-card runs">
            <span>LEADING RUN SCORER</span>
            <strong>{topRunScorer.name}</strong>
            <b>{topRunScorer.stats.runs} runs</b>
          </div>
          <div className="card tournament-leader-card wickets">
            <span>LEADING WICKET TAKER</span>
            <strong>{topWicketTaker.name}</strong>
            <b>{topWicketTaker.stats.wickets} wickets</b>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-input"
            placeholder="Search player by name (e.g. KASHIF)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Players List Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
          <UserCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>No Players Found</p>
          <p style={{ fontSize: '0.8rem' }}>Add a player with photo to show when they bat or bowl!</p>
        </div>
      ) : (
        <div className="players-grid">
          {filteredPlayers.map((player) => {
            const stats = playerStats[player.name.toLowerCase()] || getEmptyPlayerStats();
            return (
            <div key={player.id} className="player-directory-card card player-stats-card">
              <div className="player-avatar-wrapper">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="player-avatar-img" />
                ) : (
                  <div className="player-avatar-initials">
                    {getPlayerInitials(player.name)}
                  </div>
                )}
              </div>

              <div className="player-directory-info">
                <h3 className="player-directory-name">{player.name}</h3>
                <div className="player-directory-stats">
                  <span>Matches: <strong>{stats.overall.matches}</strong></span>
                  <span>Runs: <strong>{stats.overall.runs}</strong></span>
                  <span>Wkts: <strong>{stats.overall.wickets}</strong></span>
                </div>
              </div>

              <div className="player-card-actions">
                <button
                  className="edit-name-btn"
                  onClick={() => handleOpenAddModal(player)}
                  title="Edit Player Photo / Name"
                  style={{ padding: '8px' }}
                >
                  <Camera size={16} />
                </button>
                <button
                  className="edit-name-btn player-delete-btn"
                  onClick={() => handleDeletePlayer(player)}
                  title={`Delete ${player.name}`}
                  style={{ padding: '8px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="format-stats-grid">
                {[
                  ['Limited', stats.limited],
                  ['Test', stats.test],
                  ['Tournament', stats.tournament],
                ].map(([label, values]) => (
                  <div key={label} className="format-stat-box">
                    <strong>{label}</strong>
                    <span>{values.matches} M</span>
                    <span>{values.runs} R</span>
                    <span>{values.wickets} W</span>
                    <span>HS {values.highestScore}</span>
                  </div>
                ))}
              </div>

              {Object.entries(stats.tournaments).length > 0 && (
                <div className="tournament-stat-list">
                  {Object.entries(stats.tournaments).map(([id, values]) => (
                    <div key={id}>
                      <strong>{values.name}</strong>
                      <span>{values.matches} matches · {values.runs} runs · {values.wickets} wickets</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* ADD / EDIT PLAYER MODAL */}
      {showAddModal && (
        <div className="overlay" style={{ zIndex: 1000 }}>
          <div className="modal">
            <h3 className="modal-title">
              {editingPlayer ? '✏️ Edit Player Profile' : '➕ Register New Player'}
            </h3>
            
            <form onSubmit={handleSavePlayerSubmit}>
              {/* Photo Upload Section */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="player-avatar-wrapper large" style={{ margin: '0 auto 12px' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="player-avatar-img" />
                  ) : (
                    <div className="player-avatar-initials large">
                      {getPlayerInitials(playerName || 'Player')}
                    </div>
                  )}
                </div>

                <label className="btn btn-secondary" style={{ display: 'inline-flex', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <Upload size={16} /> Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  This picture will display on live match cards when batting/bowling!
                </p>
              </div>

              {/* Player Name Input */}
              <div className="form-group">
                <label className="form-label">Player Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. KASHIF" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  required 
                  maxLength={25}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
