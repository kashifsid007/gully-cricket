import React, { useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import BroadcastScorecard from './BroadcastScorecard';

export default function ShareModal({
  isOpen,
  onClose,
  matchSettings,
  currentInnings,
  strikerName,
  strikerStats,
  nonStrikerName,
  nonStrikerStats,
  bowlerName,
  bowlerStats,
  stumpsStatus,
  resultText,
  inningsList,
  currentInningsIndex
}) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const teamName = currentInnings?.team || 'Batting Team';
  const runs = currentInnings?.runs || 0;
  const wickets = currentInnings?.wickets || 0;
  const balls = currentInnings?.balls || 0;
  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const runRate = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  // Build formatted plain text for sharing
  const generateShareText = () => {
    let text = `🏏 *GULLY CRICKET MATCH SCORECARD* 🏏\n`;
    text += `------------------------------------\n`;
    text += `🏆 *${matchSettings?.team1 || 'Team A'} vs ${matchSettings?.team2 || 'Team B'}*\n`;
    text += `📌 Format: ${matchSettings?.format === 'test' ? 'Test Match' : `${matchSettings?.overs} Overs`}\n`;
    if (stumpsStatus) {
      text += `🌙 Status: ${stumpsStatus}\n`;
    } else if (resultText) {
      text += `📢 Result: ${resultText}\n`;
    }
    text += `------------------------------------\n`;
    text += `🔥 *${teamName}*: ${runs}/${wickets} (${oversStr} Overs)\n`;
    text += `⚡ CRR: ${runRate}\n\n`;

    if (strikerName && strikerStats) {
      text += `🏏 *${strikerName}*: ${strikerStats.runs} (${strikerStats.balls}b, ${strikerStats.fours}x4, ${strikerStats.sixes}x6)\n`;
    }
    if (nonStrikerName && nonStrikerStats) {
      text += `🚶‍♂️ *${nonStrikerName}*: ${nonStrikerStats.runs} (${nonStrikerStats.balls}b, ${nonStrikerStats.fours}x4, ${nonStrikerStats.sixes}x6)\n`;
    }
    if (bowlerName && bowlerStats) {
      const bOvers = `${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6}`;
      text += `🥎 *${bowlerName}*: ${bowlerStats.wickets}/${bowlerStats.runs} (${bOvers} ov)\n`;
    }

    text += `------------------------------------\n`;
    text += `Shared via Gully Cricket App 🚀`;
    return text;
  };

  // Copy text handler
  const handleCopyText = async () => {
    try {
      const shareText = generateShareText();
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Web Share API handler
  const handleWebShare = async () => {
    const shareText = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gully Cricket Scorecard',
          text: shareText,
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      handleCopyText();
    }
  };

  // Download scorecard image using Canvas API
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    const width = 600;
    const height = 750;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Canvas Background - Indigo Broadcast Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#060b26');
    bgGradient.addColorStop(0.5, '#111a42');
    bgGradient.addColorStop(1, '#081738');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Dynamic Accent Geometry Lines
    ctx.save();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(width - 150, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, 150);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(123, 31, 162, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, height - 120);
    ctx.lineTo(150, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Outer Glow Border Box
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // App Header
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ GULLY CRICKET SCORECARD ⚡', width / 2, 60);

    // Match Teams Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${matchSettings?.team1 || 'TEAM A'}  VS  ${matchSettings?.team2 || 'TEAM B'}`, width / 2, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    const fmtText = matchSettings?.format === 'test' ? 'Test Match' : `${matchSettings?.overs || 5} Overs Match`;
    ctx.fillText(fmtText, width / 2, 135);

    // Broadcast TV Score Box (Dark Blue Panel)
    const boxX = 40;
    const boxY = 160;
    const boxW = width - 80;
    const boxH = 260;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Team Code + Score (Row 1)
    const teamCode = (teamName.substring(0, 4) || 'TEAM').toUpperCase();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(teamCode, boxX + 30, boxY + 70);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(`${runs}-${wickets}`, boxX + boxW - 30, boxY + 75);

    // Line separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, boxY + 105);
    ctx.lineTo(boxX + boxW - 20, boxY + 105);
    ctx.stroke();

    // Overs (Row 2)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('OVERS', boxX + 30, boxY + 160);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(oversStr, boxX + boxW - 30, boxY + 160);

    // Run Rate (Row 3)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('RUN RATE', boxX + 30, boxY + 220);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(runRate, boxX + boxW - 30, boxY + 220);

    // Stumps status or Result text
    let currentY = boxY + boxH + 45;
    if (stumpsStatus) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`🌙 ${stumpsStatus.toUpperCase()}`, width / 2, currentY);
      currentY += 40;
    } else if (resultText) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`📢 ${resultText}`, width / 2, currentY);
      currentY += 40;
    }

    // Active Batting & Bowling Stats Card
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CURRENT PLAYERS', 40, currentY);
    currentY += 30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(40, currentY, width - 80, 160);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(40, currentY, width - 80, 160);

    let statsY = currentY + 40;

    if (strikerName && strikerStats) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🏏 ${strikerName} (Striker):`, 55, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${strikerStats.runs} (${strikerStats.balls}b)  [4s: ${strikerStats.fours} | 6s: ${strikerStats.sixes}]`, 300, statsY);
      statsY += 40;
    }

    if (nonStrikerName && nonStrikerStats) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`🚶‍♂️ ${nonStrikerName}:`, 55, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${nonStrikerStats.runs} (${nonStrikerStats.balls}b)`, 300, statsY);
      statsY += 40;
    }

    if (bowlerName && bowlerStats) {
      const bOv = `${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6}`;
      ctx.fillStyle = '#00d2ff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🥎 ${bowlerName} (Bowler):`, 55, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${bowlerStats.wickets}-${bowlerStats.runs} (${bOv} ov)`, 300, statsY);
    }

    // Watermark / Date at Bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Generated on ${new Date().toLocaleDateString()} • Gully Cricket Scorecard`, width / 2, height - 30);

    // Convert canvas to image and trigger download
    const link = document.createElement('a');
    link.download = `scorecard_${teamCode}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="overlay" style={{ zIndex: 1000 }}>
      <div className="modal share-modal" style={{ maxWidth: '440px', width: '92%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="var(--primary)" /> Share Scorecard
          </h3>
          <button className="edit-name-btn" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Live Broadcast Card Preview */}
        <div ref={cardRef} style={{ marginBottom: '20px' }}>
          <BroadcastScorecard
            teamName={teamName}
            runs={runs}
            wickets={wickets}
            balls={balls}
            isTest={matchSettings?.format === 'test'}
            stumpsStatus={stumpsStatus}
            inningsList={inningsList}
            inningsIndex={currentInningsIndex}
          />
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleDownloadImage} style={{ justifyContent: 'center', gap: '8px' }}>
            <Download size={18} /> Download Scorecard Image
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleCopyText} style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
              {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button className="btn btn-secondary" onClick={handleWebShare} style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                <Share2 size={16} /> Share App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
