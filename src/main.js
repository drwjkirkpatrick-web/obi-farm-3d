// main.js — Obi's Farm Adventure: 3D farm game built with Three.js
// Catch Obi the dachshund before he catches the chickens!
// Watch out for the rascal skunk in the evening!

import * as THREE from 'three';
import {
  createGround, createMapleTrees, createChickenCoop,
  createBlackberryRows, createFence, createHayBales,
  createDecorations, createClouds, WORLD_SIZE, FENCE_LIMIT
} from './World.js';
import { Player } from './Player.js';
import { Obi } from './Obi.js';
import { Chicken, createChickens } from './Chicken.js';
import { Skunk } from './Skunk.js';
import { SoundManager } from './Sound.js';
import {
  FeatherTrail, HeartParticles, SadFace, StinkCloud,
  DustTrail, Confetti, Fireflies
} from './Effects.js';
import { MiniMap } from './MiniMap.js';

// ─── DOM refs ──────────────────────────────────────────────────────────
const titleScreen = document.getElementById('title-screen');
const winScreen = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const tryAgainBtn = document.getElementById('try-again-btn');
const hudEl = document.getElementById('hud');
const touchControls = document.getElementById('touch-controls');
const messageEl = document.getElementById('message');
const sprayEffect = document.getElementById('spray-effect');
const scoreEl = document.getElementById('score');
const chickensSafeEl = document.getElementById('chickens-safe');
const timeLabelEl = document.getElementById('time-label');
const winScoreEl = document.getElementById('win-score');
const winChickensEl = document.getElementById('win-chickens');
const winTimeEl = document.getElementById('win-time');
const loseReasonEl = document.getElementById('lose-reason');
const loseScoreEl = document.getElementById('lose-score');

// ─── Game state ────────────────────────────────────────────────────────
let game = null;

class Game {
  constructor() {
    // ─── Renderer ──────────────────────────────────────────────────────
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas.appendChild(this.renderer.domElement);

    // ─── Scene ────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 120);

    // ─── Camera ───────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 200
    );
    this.camera.position.set(0, 12, 20);

    // ─── Lights ───────────────────────────────────────────────────────
    // Sun
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(30, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    this.scene.add(this.sunLight);

    // Ambient
    this.ambientLight = new THREE.AmbientLight(0x90b8e0, 0.5);
    this.scene.add(this.ambientLight);

    // Hemisphere (sky + ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5a8a3a, 0.4);
    this.scene.add(this.hemiLight);

    // ─── Build world ──────────────────────────────────────────────────
    createGround(this.scene);
    createMapleTrees(this.scene);
    this.coopInfo = createChickenCoop(this.scene);
    this.bushPositions = createBlackberryRows(this.scene);
    createFence(this.scene);
    this.hayBales = createHayBales(this.scene);
    createDecorations(this.scene);
    this.clouds = createClouds(this.scene);

    // ─── Entities ─────────────────────────────────────────────────────
    this.player = new Player(this.scene, this.camera);
    this.obi = new Obi(this.scene);
    this.chickens = createChickens(this.scene, 6);
    this.skunk = new Skunk(this.scene);

    // ─── Audio ────────────────────────────────────────────────────────
    this.sound = new SoundManager();

    // ─── Visual effects ───────────────────────────────────────────────
    this.featherTrail = new FeatherTrail(this.scene);
    this.heartParticles = new HeartParticles(this.scene);
    this.sadFace = new SadFace(this.scene);
    this.stinkCloud = new StinkCloud(this.scene);
    this.dustTrail = new DustTrail(this.scene);
    this.confetti = new Confetti(this.scene);
    this.fireflies = null; // created at evening

    // ─── Mini-map ──────────────────────────────────────────────────────
    this.miniMap = new MiniMap();

    // ─── Effect timers ────────────────────────────────────────────────
    this.featherTimer = 0;
    this.heartTimer = 0;
    this.dustTimer = 0;
    this.stinkTimer = 0;
    this.barkTimer = 0;
    this.cluckTimer = 0;
    this.victoryDanceTimer = 0;
    this.cameraRotateTarget = null;

    // ─── Game state ───────────────────────────────────────────────────
    this.state = 'playing';   // 'playing' | 'won' | 'lost'
    this.score = 0;
    this.gameTime = 0;
    this.dayPhase = 'morning'; // 'morning' | 'afternoon' | 'evening'
    this.obiTagsNeeded = 3;    // tag Obi 3 times to win
    this.obiTagsCount = 0;
    this.maxChickensCaught = 3; // lose if Obi catches 3 chickens
    this.messageTimer = 0;

    // ─── Resize ──────────────────────────────────────────────────────
    window.addEventListener('resize', () => this.onResize());

    // ─── Touch controls ──────────────────────────────────────────────
    this.setupTouchControls();

    // ─── Start loop ──────────────────────────────────────────────────
    this.lastTime = performance.now();
    this.animate();
  }

  // ─── Touch controls ──────────────────────────────────────────────────
  setupTouchControls() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    touchControls.classList.remove('hidden');

    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    const sprintBtn = document.getElementById('sprint-btn');

    let joyActive = false;
    let joyStartX = 0, joyStartY = 0;

    joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = joystickBase.getBoundingClientRect();
      joyStartX = rect.left + rect.width / 2;
      joyStartY = rect.top + rect.height / 2;
      joyActive = true;
    });

    joystickBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!joyActive) return;
      const t = e.touches[0];
      let dx = t.clientX - joyStartX;
      let dy = t.clientY - joyStartY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 40;
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      joystickKnob.style.transform = `translate(${30 + dx}px, ${30 + dy}px)`;
      this.player.touchVector.x = dx / maxDist;
      this.player.touchVector.y = dy / maxDist;
    });

    joystickBase.addEventListener('touchend', (e) => {
      e.preventDefault();
      joyActive = false;
      joystickKnob.style.transform = 'translate(30px, 30px)';
      this.player.touchVector.x = 0;
      this.player.touchVector.y = 0;
    });

    // Sprint button
    sprintBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.player.touchSprinting = true;
      sprintBtn.style.background = 'rgba(120,255,120,0.45)';
    });
    sprintBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.player.touchSprinting = false;
      sprintBtn.style.background = 'rgba(80,200,80,0.25)';
    });

    // Tap on Obi to tag (mobile)
    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (this.state !== 'playing') return;
      // Check if touch is near center of screen (where Obi likely is)
      const t = e.touches[0];
      // Raycast to see if we tapped near Obi
      const mouse = new THREE.Vector2(
        (t.clientX / window.innerWidth) * 2 - 1,
        -(t.clientY / window.innerHeight) * 2 + 1
      );
      // Simple distance check: if player is close to Obi, count as tag
      if (this.player.pos.distanceTo(this.obi.pos) < 3.5) {
        this.tagObi();
      }
    });
  }

  // ─── Tag Obi ─────────────────────────────────────────────────────────
  tagObi() {
    if (this.player.tagCooldown > 0) return;
    this.obi.tag();
    this.obiTagsCount++;
    this.player.tagCooldown = 0.5;
    const points = 100;
    this.score += points;
    this.showMessage(`Gotcha Obi! (${this.obiTagsCount}/${this.obiTagsNeeded})`, 2.0);
    this.sound.giggle();

    // Hearts from saved chickens
    this.chickens.forEach(c => {
      if (!c.caught) this.heartParticles.emit(c.pos.x, 0.5, c.pos.z);
    });

    if (this.obiTagsCount >= this.obiTagsNeeded) {
      this.win();
    }
  }

  // ─── Win ──────────────────────────────────────────────────────────────
  win() {
    this.state = 'won';
    this.sound.win();
    // Victory dance: confetti burst + chicken hop + Obi roll
    this.confetti.burst(this.player.pos.x, 0, this.player.pos.z, 80);
    this.victoryDanceTimer = 3.0;

    // Bonus for remaining safe chickens
    const safe = this.chickens.filter(c => !c.caught).length;
    this.score += safe * 50;

    // Show win screen after victory dance
    setTimeout(() => {
      winScoreEl.textContent = `Score: ${this.score}`;
      winChickensEl.textContent = `${safe} chicken${safe !== 1 ? 's' : ''} safe!`;
      const mins = Math.floor(this.gameTime / 60);
      const secs = Math.floor(this.gameTime % 60);
      winTimeEl.textContent = `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
      hudEl.classList.add('hidden');
      touchControls.classList.add('hidden');
      this.miniMap.hide();
      winScreen.classList.remove('hidden');
    }, 2500);
  }

  // ─── Lose ─────────────────────────────────────────────────────────────
  lose(reason) {
    this.state = 'lost';
    this.sound.sad();
    loseReasonEl.textContent = reason;
    loseScoreEl.textContent = `Score: ${this.score}`;
    hudEl.classList.add('hidden');
    touchControls.classList.add('hidden');
    this.miniMap.hide();
    loseScreen.classList.remove('hidden');
  }

  // ─── Show message popup ───────────────────────────────────────────────
  showMessage(text, duration = 2.0) {
    messageEl.textContent = text;
    messageEl.classList.add('show');
    this.messageTimer = duration;
  }

  // ─── Day/evening cycle ────────────────────────────────────────────────
  updateDayCycle(dt) {
    this.gameTime += dt;

    // Phase transitions based on time
    if (this.gameTime > 45 && this.dayPhase === 'afternoon') {
      this.dayPhase = 'evening';
      timeLabelEl.textContent = 'Evening 🌅';

      // Dramatic evening transition
      this.scene.background = new THREE.Color(0xff6b35);
      this.scene.fog.color.set(0xff6b35);
      this.sunLight.color.set(0xff8844);
      this.sunLight.intensity = 0.7;
      this.ambientLight.intensity = 0.25;
      this.ambientLight.color.set(0xff7744);
      this.hemiLight.intensity = 0.15;
      this.hemiLight.color.set(0xff8844);

      // Spawn fireflies
      this.fireflies = new Fireflies(this.scene, 40);

      // Show evening banner
      this.showEveningBanner();
      this.sound.evening();
      this.skunk.appear();
    } else if (this.gameTime > 20 && this.dayPhase === 'morning') {
      this.dayPhase = 'afternoon';
      timeLabelEl.textContent = 'Afternoon ☀️';
    }

    // Animate clouds
    this.clouds.forEach(c => {
      c.position.x += dt * 0.5;
      if (c.position.x > 80) c.position.x = -80;
    });

    // Animate sun position
    const sunAngle = (this.gameTime / 120) * Math.PI;
    this.sunLight.position.set(
      Math.cos(sunAngle) * 40,
      Math.sin(sunAngle) * 40 + 10,
      20
    );

    // Update fireflies if active
    if (this.fireflies) this.fireflies.update(dt);
  }

  // ─── Evening banner ───────────────────────────────────────────────────
  showEveningBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(255,107,53,0.9), rgba(200,60,30,0.9));
      color: #fff; font-size: 36px; font-weight: 800;
      padding: 20px 50px; border-radius: 50px;
      z-index: 40; pointer-events: none;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      animation: bannerPulse 0.5s ease;
    `;
    banner.innerHTML = '🦨 Skunk Alert! Evening on the Farm!';
    banner.id = 'evening-banner';
    document.body.appendChild(banner);

    // Add CSS animation
    if (!document.getElementById('banner-anim')) {
      const style = document.createElement('style');
      style.id = 'banner-anim';
      style.textContent = `
        @keyframes bannerPulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes bannerFade {
          from { opacity: 1; }
          to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }

    // Fade out after 3 seconds
    setTimeout(() => {
      banner.style.animation = 'bannerFade 0.8s ease forwards';
      setTimeout(() => banner.remove(), 800);
    }, 3000);
  }

  // ─── Collision with obstacles (simple circle check) ──────────────────
  handleObstacleCollisions(entity) {
    // Hay bales
    for (const bale of this.hayBales) {
      const dx = entity.pos.x - bale.x;
      const dz = entity.pos.z - bale.z;
      const dist = Math.hypot(dx, dz);
      const minDist = bale.radius + 0.8;
      if (dist < minDist) {
        const push = (minDist - dist) / dist;
        entity.pos.x += dx * push;
        entity.pos.z += dz * push;
      }
    }
    // Coop (treat as box)
    const coopDx = entity.pos.x - this.coopInfo.x;
    const coopDz = entity.pos.z - this.coopInfo.z;
    if (Math.abs(coopDx) < 5 && Math.abs(coopDz) < 4 && Math.abs(coopDz) > 3) {
      // Block from entering coop interior (simplified)
      if (coopDz > 0 && coopDz < 4) {
        entity.pos.z = this.coopInfo.z + 4;
      }
    }
  }

  // ─── Main update ──────────────────────────────────────────────────────
  update(dt) {
    if (this.state === 'won' && this.victoryDanceTimer > 0) {
      // Victory dance: chickens hop, Obi rolls, confetti continues
      this.victoryDanceTimer -= dt;
      this.chickens.forEach(c => {
        if (!c.caught) c.mesh.position.y = 0.3 + Math.abs(Math.sin(performance.now() * 0.008 + c.index)) * 0.4;
      });
      this.obi.mesh.rotation.z = performance.now() * 0.01;
      this.confetti.update(dt);
      this.heartParticles.update(dt);
      return;
    }

    if (this.state !== 'playing') return;

    this.updateDayCycle(dt);

    // Update entities
    this.player.update(dt, this.obi);
    this.obi.update(dt, this.player, this.chickens);
    this.chickens.forEach(c => c.update(dt, this.obi, this.player));
    this.skunk.update(dt, this.player, this.obi);

    // ─── Camera auto-rotate towards Obi when he's chasing ────────────
    if (this.obi.state === 'chase' && this.player.distanceTo(this.obi.pos) > 15) {
      // Subtly rotate camera to point towards Obi
      const angleToObi = Math.atan2(
        this.obi.pos.x - this.player.pos.x,
        this.obi.pos.z - this.player.pos.z
      );
      this.player.camAngle += (angleToObi - this.player.camAngle) * 0.02;
    }

    // ─── Feather trail when Obi is chasing ───────────────────────────
    this.featherTimer -= dt;
    if (this.obi.state === 'chase' && this.featherTimer <= 0) {
      // Emit feathers near the targeted chicken
      if (this.obi.target && !this.obi.target.caught) {
        this.featherTrail.emit(this.obi.target.pos.x, 0, this.obi.target.pos.z);
      }
      this.featherTimer = 0.3;
    }

    // ─── Bark sound when Obi chases ──────────────────────────────────
    this.barkTimer -= dt;
    if (this.obi.state === 'chase' && this.barkTimer <= 0) {
      this.sound.bark();
      this.barkTimer = 2 + Math.random() * 2;
    }

    // ─── Cluck sound when chickens are scared ────────────────────────
    this.cluckTimer -= dt;
    const anyScared = this.chickens.some(c => c.scared);
    if (anyScared && this.cluckTimer <= 0) {
      this.sound.cluck();
      this.cluckTimer = 1.5 + Math.random();
    }

    // ─── Dust trail when player sprints ──────────────────────────────
    this.dustTimer -= dt;
    if (this.player.isSprinting && this.dustTimer <= 0) {
      this.dustTrail.emit(this.player.pos.x, 0, this.player.pos.z);
      this.dustTimer = 0.08;
    }

    // ─── Stink cloud follows skunk ───────────────────────────────────
    this.stinkTimer -= dt;
    if (this.skunk.active) {
      // Emit stink particles, more intense when ready to spray
      const intensity = this.skunk._readyToSpray ? 2 : 0.8;
      if (this.stinkTimer <= 0) {
        this.stinkCloud.emit(this.skunk.pos.x, 0.3, this.skunk.pos.z, intensity);
        this.stinkTimer = 0.2 / intensity;
      }
    }

    // ─── Heart particles for safe chickens (occasional) ──────────────
    this.heartTimer -= dt;
    if (this.heartTimer <= 0) {
      const safeChickens = this.chickens.filter(c => !c.caught && !c.scared);
      if (safeChickens.length > 0 && Math.random() < 0.3) {
        const c = safeChickens[Math.floor(Math.random() * safeChickens.length)];
        this.heartParticles.emit(c.pos.x, 0.5, c.pos.z);
      }
      this.heartTimer = 3 + Math.random() * 2;
    }

    // ─── Update all particle effects ─────────────────────────────────
    this.featherTrail.update(dt);
    this.heartParticles.update(dt);
    this.sadFace.update(dt, this.camera);
    this.stinkCloud.update(dt);
    this.dustTrail.update(dt);
    this.confetti.update(dt);

    // ─── Obstacle collisions ─────────────────────────────────────────
    this.handleObstacleCollisions(this.player);
    this.handleObstacleCollisions(this.obi);
    this.chickens.forEach(c => this.handleObstacleCollisions(c));

    // ─── Check if Obi caught a chicken ───────────────────────────────
    const caughtChicken = this.obi.checkChickenCatch(this.chickens);
    if (caughtChicken) {
      this.showMessage(`Oh no! Obi caught ${caughtChicken.name}!`, 2.5);
      this.sound.sad();
      this.sadFace.emit(caughtChicken.pos.x, 0, caughtChicken.pos.z);
      const caughtCount = this.obi.chickensCaught;
      if (caughtCount >= this.maxChickensCaught) {
        this.lose(`Obi caught ${caughtCount} chickens!`);
        return;
      }
    }

    // ─── Check tag input ─────────────────────────────────────────────
    if (this.player.keys['Space']) {
      if (this.player.tryTag(this.obi)) {
        this.tagObi();
      }
    }

    // ─── Check skunk spray ───────────────────────────────────────────
    if (this.skunk.shouldSpray(this.player)) {
      this.skunk.spray();
      this.player.spray();
      this.sound.spray();
      this.score = Math.max(0, this.score - 30);
      this.showMessage('🦨💨 Pee-ew! You got sprayed!', 3.0);
      sprayEffect.classList.add('show');
      setTimeout(() => sprayEffect.classList.remove('show'), 2000);
    }

    // ─── Update HUD ──────────────────────────────────────────────────
    const safeCount = this.chickens.filter(c => !c.caught).length;
    chickensSafeEl.textContent = safeCount;
    scoreEl.textContent = this.score;

    // ─── Update mini-map ─────────────────────────────────────────────
    this.miniMap.update(this.player, this.obi, this.chickens, this.skunk);

    // Score from surviving (slow trickle)
    this.score += Math.floor(dt * 2);

    // Message timer
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        messageEl.classList.remove('show');
      }
    }
  }

  // ─── Animation loop ───────────────────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    try {
      this.update(dt);
    } catch (e) {
      if (!this._updateErrorLogged) {
        this._updateErrorLogged = true;
        console.error('Update loop error:', e.message, e.stack);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  // ─── Resize ───────────────────────────────────────────────────────────
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// ─── Start / restart / button handlers ─────────────────────────────────
function startGame() {
  titleScreen.classList.add('hidden');
  hudEl.classList.remove('hidden');
  // Show touch controls only on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchControls.classList.remove('hidden');
  }
  if (game) {
    // Clean up old game
    game.miniMap.hide();
    game.renderer.dispose();
    game.canvas.innerHTML = '';
  }
  game = new Game();
  // Unlock audio on first user gesture
  game.sound.unlock();
  game.miniMap.show();
}

function restartGame() {
  winScreen.classList.add('hidden');
  loseScreen.classList.remove('hidden');
  loseScreen.classList.add('hidden');
  hudEl.classList.remove('hidden');
  if (game) {
    game.miniMap.hide();
    game.renderer.dispose();
    game.canvas.innerHTML = '';
  }
  game = new Game();
  game.sound.unlock();
  game.miniMap.show();
}

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', restartGame);
tryAgainBtn.addEventListener('click', restartGame);