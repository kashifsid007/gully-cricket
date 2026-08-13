import React, { useState } from 'react';
import { Edit2, Camera } from 'lucide-react';
import { getPlayerByName, updatePlayerPhoto, getPlayerInitials } from '../utils/playerDb';

export default function BroadcastPlayerBanner({
  strikerName,
  strikerStats,
  nonStrikerName,
  nonStrikerStats,
  bowlerName,
  bowlerStats,
  onSwapBatsmen,
  onRenameClick,
}) {
  const [, setRefreshKey] = useState(0);

  const strikerProfile = getPlayerByName(strikerName);
  const nonStrikerProfile = getPlayerByName(nonStrikerName);
  const bowlerProfile = getPlayerByName(bowlerName);

  const handleQuickPhotoUpload = (name, e) => {
    e.stopPropagation();
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
        updatePlayerPhoto(name, dataUrl);
        setRefreshKey(prev => prev + 1);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const formatBowlerOvers = (balls) => {
    return `${Math.floor(balls / 6)}.${balls % 6}`;
  };

  return (
    <div className="tv-player-banner-container">
      {/* 1. STRIKER CELL */}
      <div className="tv-player-cell striker-cell">
        {/* Perfectly Aligned Centered Top Avatar */}
        <label className="tv-popout-avatar striker" title="Click to Upload Photo">
          {strikerProfile && strikerProfile.photo ? (
            <img src={strikerProfile.photo} alt={strikerName} className="tv-avatar-img" />
          ) : (
            <div className="tv-avatar-initials striker">
              {getPlayerInitials(strikerName)}
            </div>
          )}
          <div className="tv-avatar-overlay-icon">
            <Camera size={9} color="#ffffff" />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleQuickPhotoUpload(strikerName, e)} 
            style={{ display: 'none' }} 
          />
        </label>

        {/* Striker Arrow Indicator */}
        <div className="striker-arrow-badge">▶</div>

        <div className="tv-player-info">
          <div className="tv-player-name-row">
            <span className="tv-player-name">{strikerName.toUpperCase()}</span>
            <button 
              className="tv-edit-btn" 
              onClick={() => onRenameClick('striker', strikerName)}
              title="Rename Striker"
            >
              <Edit2 size={10} />
            </button>
          </div>
          <div className="tv-player-score-main">
            {strikerStats.runs} <span className="tv-balls-faced">({strikerStats.balls})</span>
          </div>
        </div>
      </div>

      {/* 2. NON-STRIKER CELL */}
      <div 
        className="tv-player-cell non-striker-cell" 
        onClick={onSwapBatsmen} 
        title="Click to swap strike manually"
      >
        {/* Perfectly Aligned Centered Top Avatar */}
        <label className="tv-popout-avatar non-striker" title="Click to Upload Photo" onClick={(e) => e.stopPropagation()}>
          {nonStrikerProfile && nonStrikerProfile.photo ? (
            <img src={nonStrikerProfile.photo} alt={nonStrikerName} className="tv-avatar-img" />
          ) : (
            <div className="tv-avatar-initials non-striker">
              {getPlayerInitials(nonStrikerName)}
            </div>
          )}
          <div className="tv-avatar-overlay-icon">
            <Camera size={9} color="#ffffff" />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleQuickPhotoUpload(nonStrikerName, e)} 
            style={{ display: 'none' }} 
          />
        </label>

        <div className="tv-player-info">
          <div className="tv-player-name-row">
            <span className="tv-player-name">{nonStrikerName.toUpperCase()}</span>
            <button 
              className="tv-edit-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onRenameClick('nonStriker', nonStrikerName);
              }}
              title="Rename Non-Striker"
            >
              <Edit2 size={10} />
            </button>
          </div>
          <div className="tv-player-score-main">
            {nonStrikerStats.runs} <span className="tv-balls-faced">({nonStrikerStats.balls})</span>
          </div>
        </div>
      </div>

      {/* 3. BOWLER CELL */}
      <div className="tv-player-cell bowler-cell">
        {/* Perfectly Aligned Centered Top Avatar */}
        <label className="tv-popout-avatar bowler" title="Click to Upload Photo">
          {bowlerProfile && bowlerProfile.photo ? (
            <img src={bowlerProfile.photo} alt={bowlerName} className="tv-avatar-img" />
          ) : (
            <div className="tv-avatar-initials bowler">
              {getPlayerInitials(bowlerName)}
            </div>
          )}
          <div className="tv-avatar-overlay-icon">
            <Camera size={9} color="#ffffff" />
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleQuickPhotoUpload(bowlerName, e)} 
            style={{ display: 'none' }} 
          />
        </label>

        <div className="tv-player-info">
          <div className="tv-player-name-row">
            <span className="tv-player-name">{bowlerName.toUpperCase()}</span>
            <button 
              className="tv-edit-btn" 
              onClick={() => onRenameClick('bowler', bowlerName)}
              title="Rename Bowler"
            >
              <Edit2 size={10} />
            </button>
          </div>
          <div className="tv-player-score-main bowler-figs">
            {bowlerStats.wickets}-{bowlerStats.runs} <span className="tv-balls-faced">({formatBowlerOvers(bowlerStats.balls)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
