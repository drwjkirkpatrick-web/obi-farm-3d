// Skunk.js — The rascal skunk that appears in the evening and can spray the player

import * as THREE from 'three';
import { FENCE_LIMIT } from './World.js';

export class Skunk {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.build();
    scene.add(this.mesh);

    this.pos = new THREE.Vector3(0, 0, -50); // off-screen initially
    this.vel = new THREE.Vector3();
    this.speed = 3.5;
    this.facing = 0;
    this.active = false;        // appears in evening
    this.sprayCooldown = 0;
    this.sprayRange = 3.5;
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.mesh.visible = false;
  }

  build() {
    const g = new THREE.Group();

    // Body — black with white stripe
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.7, 6, 10), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    g.add(body);

    // White stripe (thin box on top)
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.08, 0.15),
      stripeMat
    );
    stripe.position.set(0, 0.55, 0);
    g.add(stripe);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), bodyMat);
    head.position.set(0.55, 0.45, 0);
    head.castShadow = true;
    g.add(head);

    // White face stripe
    const faceStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.06, 0.08),
      stripeMat
    );
    faceStripe.position.set(0.6, 0.5, 0);
    g.add(faceStripe);

    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 6), bodyMat);
    snout.position.set(0.75, 0.4, 0);
    snout.rotation.z = -Math.PI / 2;
    g.add(snout);

    // Nose
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), noseMat);
    nose.position.set(0.83, 0.4, 0);
    g.add(nose);

    // Eyes
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const eyeGeo = new THREE.SphereGeometry(0.035, 5, 5);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(0.62, 0.52, 0.1);
    g.add(lEye);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.62, 0.52, -0.1);
    g.add(rEye);

    // Bushy tail (big fluffy cone — signature skunk tail)
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.6, 8),
      tailMat
    );
    tail.position.set(-0.55, 0.6, 0);
    tail.rotation.z = Math.PI / 2 - 0.4;
    tail.castShadow = true;
    g.add(tail);
    this.tail = tail;

    // Legs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 5);
    const legPositions = [
      [0.35, 0.15, 0.13], [0.35, 0.15, -0.13],
      [-0.35, 0.15, 0.13], [-0.35, 0.15, -0.13],
    ];
    this.legs = [];
    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...p);
      leg.castShadow = true;
      g.add(leg);
      this.legs.push(leg);
    });

    g.position.copy(this.pos);
    return g;
  }

  // Called when evening starts
  appear() {
    this.active = true;
    this.mesh.visible = true;
    // Enter from a random edge
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: this.pos.set(0, 0, -45); break;
      case 1: this.pos.set(45, 0, 0); break;
      case 2: this.pos.set(0, 0, 45); break;
      case 3: this.pos.set(-45, 0, 0); break;
    }
    this.mesh.position.copy(this.pos);
  }

  // Called when day returns
  disappear() {
    this.active = false;
    this.mesh.visible = false;
    this.pos.set(0, 0, -60);
    this.mesh.position.copy(this.pos);
  }

  update(dt, player, obi) {
    if (!this.active) return;

    if (this.sprayCooldown > 0) this.sprayCooldown -= dt;

    const distToPlayer = this.pos.distanceTo(player.pos);

    // Skunk behavior: wanders around, but if player gets too close, it raises tail
    // and after a brief warning, sprays!

    let targetVel = new THREE.Vector3();

    if (distToPlayer < this.sprayRange && this.sprayCooldown <= 0) {
      // STOP and raise tail — about to spray!
      targetVel.set(0, 0, 0);
      this.tail.rotation.z = Math.PI / 2 - 1.2; // tail straight up!
      // Spray after 0.5s of stillness (handled by caller checking distance)
      this._readyToSpray = true;
    } else if (distToPlayer < 8) {
      // Move away from player but not frantically
      this._readyToSpray = false;
      const away = new THREE.Vector3()
        .subVectors(this.pos, player.pos)
        .normalize();
      targetVel.copy(away).multiplyScalar(this.speed);
      this.tail.rotation.z = Math.PI / 2 - 0.6; // tail raised slightly
    } else {
      // Wander peacefully
      this._readyToSpray = false;
      this.tail.rotation.z = Math.PI / 2 - 0.4; // relaxed tail
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        const a = Math.random() * Math.PI * 2;
        this.wanderDir.set(Math.cos(a), 0, Math.sin(a));
        this.wanderTimer = 2 + Math.random() * 3;
      }
      targetVel.copy(this.wanderDir).multiplyScalar(this.speed * 0.4);
    }

    // Smooth velocity
    this.vel.x += (targetVel.x - this.vel.x) * 0.1;
    this.vel.z += (targetVel.z - this.vel.z) * 0.1;

    // Apply
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // Clamp
    const lim = FENCE_LIMIT - 1;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -lim, lim);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -lim, lim);

    // Update mesh
    this.mesh.position.copy(this.pos);
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (speed > 0.3) {
      this.facing = Math.atan2(this.vel.x, this.vel.z);
      this.mesh.rotation.y = this.facing - Math.PI / 2;
      const t = performance.now() * 0.015;
      this.legs[0].rotation.x = Math.sin(t) * 0.4;
      this.legs[1].rotation.x = -Math.sin(t) * 0.4;
      this.legs[2].rotation.x = -Math.sin(t) * 0.4;
      this.legs[3].rotation.x = Math.sin(t) * 0.4;
    }
  }

  // Check if skunk should spray the player
  shouldSpray(player) {
    return this.active && this._readyToSpray && this.sprayCooldown <= 0 &&
           this.pos.distanceTo(player.pos) < this.sprayRange;
  }

  spray() {
    this.sprayCooldown = 8.0; // can't spray again for 8 seconds
    this._readyToSpray = false;
    // Tail flicks down after spraying
    this.tail.rotation.z = Math.PI / 2 - 0.4;
  }
}