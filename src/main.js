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

    if (this.obiTagsCount >= this.obiTagsNeeded) {
      this.win();
    }
  }

  // ─── Win ──────────────────────────────────────────────────────────────
  win() {
    this.state = 'won';
    // Bonus for remaining safe chickens
    const safe = this.chickens.filter(c => !c.caught).length;
    this.score += safe * 50;
    winScoreEl.textContent = `Score: ${this.score}`;
    winChickensEl.textContent = `${safe} chicken${safe !== 1 ? 's' : ''} safe!`;
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    winTimeEl.textContent = `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
    hudEl.classList.add('hidden');
    touchControls.classList.add('hidden');
    winScreen.classList.remove('hidden');
  }

  // ─── Lose ─────────────────────────────────────────────────────────────
  lose(reason) {
    this.state = 'lost';
    loseReasonEl.textContent = reason;
    loseScoreEl.textContent = `Score: ${this.score}`;
    hudEl.classList.add('hidden');
    touchControls.classList.add('hidden');
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
    if (this.gameTime > 60 && this.dayPhase === 'afternoon') {
      this.dayPhase = 'evening';
      timeLabelEl.textContent = 'Evening 🌅';
      this.scene.background = new THREE.Color(0xff8c42);
      this.scene.fog.color.set(0xff8c42);
      this.sunLight.color.set(0xffaa66);
      this.sunLight.intensity = 0.8;
      this.ambientLight.intensity = 0.3;
      this.ambientLight.color.set(0xff9966);
      this.hemiLight.intensity = 0.2;
      this.showMessage('🦨 The skunk comes out at evening!', 3.0);
      this.skunk.appear();
    } else if (this.gameTime > 30 && this.dayPhase === 'morning') {
      this.dayPhase = 'afternoon';
      timeLabelEl.textContent = 'Afternoon ☀️';
    }

    // Animate clouds
    this.clouds.forEach(c => {
      c.position.x += dt * 0.5;
      if (c.position.x > 80) c.position.x = -80;
    });

    // Animate sun position
    const sunAngle = (this.gameTime / 120) * Math.PI; // full cycle in 2 min
    this.sunLight.position.set(
      Math.cos(sunAngle) * 40,
      Math.sin(sunAngle) * 40 + 10,
      20
    );
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
    if (this.state !== 'playing') return;

    this.updateDayCycle(dt);

    // Update entities
    this.player.update(dt, this.obi);
    this.obi.update(dt, this.player, this.chickens);
    this.chickens.forEach(c => c.update(dt, this.obi, this.player));
    this.skunk.update(dt, this.player, this.obi);

    // Obstacle collisions
    this.handleObstacleCollisions(this.player);
    this.handleObstacleCollisions(this.obi);
    this.chickens.forEach(c => this.handleObstacleCollisions(c));

    // Check if Obi caught a chicken
    const caughtChicken = this.obi.checkChickenCatch(this.chickens);
    if (caughtChicken) {
      this.showMessage(`Oh no! Obi caught ${caughtChicken.name}!`, 2.5);
      const caughtCount = this.obi.chickensCaught;
      if (caughtCount >= this.maxChickensCaught) {
        this.lose(`Obi caught ${caughtCount} chickens!`);
        return;
      }
    }

    // Check tag input
    if (this.player.keys['Space']) {
      if (this.player.tryTag(this.obi)) {
        this.tagObi();
      }
    }

    // Check skunk spray
    if (this.skunk.shouldSpray(this.player)) {
      this.skunk.spray();
      this.player.spray();
      this.score = Math.max(0, this.score - 30);
      this.showMessage('🦨💨 Pee-ew! You got sprayed!', 3.0);
      sprayEffect.classList.add('show');
      setTimeout(() => sprayEffect.classList.remove('show'), 2000);
    }

    // Update HUD
    const safeCount = this.chickens.filter(c => !c.caught).length;
    chickensSafeEl.textContent = safeCount;
    scoreEl.textContent = this.score;

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
    game.renderer.dispose();
    game.canvas.innerHTML = '';
  }
  game = new Game();
}

function restartGame() {
  winScreen.classList.add('hidden');
  loseScreen.classList.add('hidden');
  hudEl.classList.remove('hidden');
  if (game) {
    game.renderer.dispose();
    game.canvas.innerHTML = '';
  }
  game = new Game();
}

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', restartGame);
tryAgainBtn.addEventListener('click', restartGame);