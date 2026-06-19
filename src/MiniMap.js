// MiniMap.js — 2D radar canvas showing Obi, chickens, skunk, and player positions

import { FENCE_LIMIT } from './World.js';

export class MiniMap {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 160;
    this.canvas.id = 'minimap';
    this.canvas.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      width: 160px; height: 160px;
      border-radius: 12px;
      background: rgba(30, 50, 20, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.25);
      z-index: 15;
      pointer-events: none;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.visible = false;
  }

  show() {
    this.canvas.style.display = 'block';
    this.visible = true;
  }

  hide() {
    this.canvas.style.display = 'none';
    this.visible = false;
  }

  // Convert world coords to minimap coords
  worldToMap(x, z) {
    const scale = 160 / (FENCE_LIMIT * 2);
    return {
      x: 80 + x * scale,
      y: 80 + z * scale,
    };
  }

  update(player, obi, chickens, skunk) {
    if (!this.visible) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 160, 160);

    // Background
    ctx.fillStyle = 'rgba(50, 80, 40, 0.6)';
    ctx.fillRect(0, 0, 160, 160);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * 160;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 160); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(160, p); ctx.stroke();
    }

    // Chicken coop marker (brown square)
    const coop = this.worldToMap(-15, 20);
    ctx.fillStyle = '#b8864a';
    ctx.fillRect(coop.x - 5, coop.y - 4, 10, 8);

    // Chickens (yellow dots, red if scared/caught)
    chickens.forEach(c => {
      const p = this.worldToMap(c.pos.x, c.pos.z);
      if (c.caught) {
        ctx.fillStyle = '#cc4444';
      } else if (c.scared) {
        ctx.fillStyle = '#ff8844';
      } else {
        ctx.fillStyle = '#ffdd44';
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Skunk (if active)
    if (skunk.active) {
      const p = this.worldToMap(skunk.pos.x, skunk.pos.z);
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // White stripe
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 2, p.y);
      ctx.lineTo(p.x + 2, p.y);
      ctx.stroke();
    }

    // Obi (brown paw print icon)
    const op = this.worldToMap(obi.pos.x, obi.pos.z);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.arc(op.x, op.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Obi direction indicator
    if (obi.state === 'chase') {
      // Red ring when chasing
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(op.x, op.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (obi.state === 'flee') {
      // Yellow ring when fleeing
      ctx.strokeStyle = '#ffdd33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(op.x, op.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (obi.state === 'tagged') {
      // Green checkmark
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(op.x - 3, op.y);
      ctx.lineTo(op.x - 1, op.y + 2);
      ctx.lineTo(op.x + 3, op.y - 2);
      ctx.stroke();
    }

    // Player (blue triangle)
    const pp = this.worldToMap(player.pos.x, player.pos.z);
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y - 5);
    ctx.lineTo(pp.x - 4, pp.y + 4);
    ctx.lineTo(pp.x + 4, pp.y + 4);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '9px sans-serif';
    ctx.fillText('MAP', 5, 14);
  }
}