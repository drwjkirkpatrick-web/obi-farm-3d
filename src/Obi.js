// Obi.js — Obi the dachshund AI: chases chickens, flees player when close

import * as THREE from 'three';
import { FENCE_LIMIT } from './World.js';

export class Obi {
  constructor(scene) {
    this.scene = scene;
    this.pos = new THREE.Vector3(15, 0, -5);
    this.vel = new THREE.Vector3();
    this.mesh = this.build();
    scene.add(this.mesh);
    this.baseSpeed = 6;
    this.chaseSpeed = 8;
    this.fleeSpeed = 11;
    this.facing = 0;
    this.state = 'wander';   // 'wander' | 'chase' | 'flee' | 'tagged'
    this.target = null;       // current chicken target
    this.taggedTimer = 0;     // stun after being tagged
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.barkTimer = 0;
    this.chickensCaught = 0;
  }

  build() {
    const g = new THREE.Group();

    // Dachshund body — long and low (signature silhouette)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // brown
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 6, 10), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.5;
    body.castShadow = true;
    g.add(body);

    // Belly (slightly lighter)
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xa87542 });
    const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.8, 4, 8), bellyMat);
    belly.rotation.z = Math.PI / 2;
    belly.position.y = 0.4;
    g.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bodyMat);
    head.position.set(0.75, 0.65, 0);
    head.castShadow = true;
    g.add(head);
    this.head = head;

    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 8), bodyMat);
    snout.position.set(1.0, 0.58, 0);
    snout.rotation.z = -Math.PI / 2;
    g.add(snout);

    // Nose (black)
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), noseMat);
    nose.position.set(1.12, 0.58, 0);
    g.add(nose);

    // Eyes
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.8, 0.78, 0.15);
    g.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.8, 0.78, -0.15);
    g.add(rightEye);

    // Floppy ears
    const earMat = new THREE.MeshLambertMaterial({ color: 0x6b4020 });
    const earGeo = new THREE.CapsuleGeometry(0.08, 0.2, 4, 6);
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(0.65, 0.5, 0.22);
    leftEar.rotation.z = 0.3;
    g.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.65, 0.5, -0.22);
    rightEar.rotation.z = 0.3;
    g.add(rightEar);
    this.leftEar = leftEar;
    this.rightEar = rightEar;

    // Legs (short stubby dachshund legs)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x6b4020 });
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 6);
    const legPositions = [
      [0.5, 0.2, 0.18], [0.5, 0.2, -0.18],
      [-0.5, 0.2, 0.18], [-0.5, 0.2, -0.18],
    ];
    this.legs = [];
    legPositions.forEach((p) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...p);
      leg.castShadow = true;
      g.add(leg);
      this.legs.push(leg);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), bodyMat);
    tail.position.set(-0.7, 0.6, 0);
    tail.rotation.z = Math.PI / 2 + 0.3;
    g.add(tail);
    this.tail = tail;

    // Collar (red)
    const collarMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), collarMat);
    collar.position.set(0.55, 0.6, 0);
    collar.rotation.y = Math.PI / 2;
    g.add(collar);

    g.position.copy(this.pos);
    return g;
  }

  update(dt, player, chickens) {
    // Tagged stun
    if (this.taggedTimer > 0) {
      this.taggedTimer -= dt;
      this.state = 'tagged';
      // Sit and pant
      this.vel.x *= 0.8;
      this.vel.z *= 0.8;
      this.mesh.position.copy(this.pos);
      this.tail.rotation.z = Math.PI / 2 + 0.3 + Math.sin(performance.now() * 0.015) * 0.3;
      return;
    }

    const distToPlayer = this.pos.distanceTo(player.pos);

    // State machine
    if (distToPlayer < 5) {
      // Player is close — flee!
      this.state = 'flee';
      this.target = null;
    } else if (this.taggedTimer <= 0) {
      // Find nearest uncaught chicken
      let nearest = null;
      let nearestDist = Infinity;
      chickens.forEach(c => {
        if (c.caught) return;
        const d = this.pos.distanceTo(c.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = c;
        }
      });
      if (nearest && nearestDist < 25) {
        this.state = 'chase';
        this.target = nearest;
      } else {
        this.state = 'wander';
        this.target = null;
      }
    }

    // Movement based on state
    let targetVel = new THREE.Vector3();

    switch (this.state) {
      case 'flee': {
        // Run away from player
        const away = new THREE.Vector3()
          .subVectors(this.pos, player.pos)
          .normalize();
        targetVel.copy(away).multiplyScalar(this.fleeSpeed);
        this.barkTimer -= dt;
        break;
      }
      case 'chase': {
        if (this.target && !this.target.caught) {
          const toChicken = new THREE.Vector3()
            .subVectors(this.target.pos, this.pos)
            .normalize();
          targetVel.copy(toChicken).multiplyScalar(this.chaseSpeed);
          // Bark timer
          this.barkTimer -= dt;
        }
        break;
      }
      case 'wander': {
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          // Pick new wander direction
          const a = Math.random() * Math.PI * 2;
          this.wanderDir.set(Math.cos(a), 0, Math.sin(a));
          this.wanderTimer = 2 + Math.random() * 3;
        }
        targetVel.copy(this.wanderDir).multiplyScalar(this.baseSpeed * 0.5);
        break;
      }
    }

    // Smooth velocity
    this.vel.x += (targetVel.x - this.vel.x) * 0.1;
    this.vel.z += (targetVel.z - this.vel.z) * 0.1;

    // Apply
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // Clamp to fence
    const lim = FENCE_LIMIT - 2;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -lim, lim);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -lim, lim);

    // Update mesh
    this.mesh.position.copy(this.pos);
    if (Math.hypot(this.vel.x, this.vel.z) > 0.5) {
      this.facing = Math.atan2(this.vel.x, this.vel.z);
      this.mesh.rotation.y = this.facing - Math.PI / 2;
    }

    // Leg animation
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (speed > 0.5) {
      const t = performance.now() * 0.015 * (speed / this.chaseSpeed);
      this.legs[0].rotation.x = Math.sin(t) * 0.6;
      this.legs[1].rotation.x = -Math.sin(t) * 0.6;
      this.legs[2].rotation.x = -Math.sin(t) * 0.6;
      this.legs[3].rotation.x = Math.sin(t) * 0.6;
      // Tail wag
      this.tail.rotation.z = Math.PI / 2 + 0.3 + Math.sin(performance.now() * 0.02) * 0.4;
      // Ear flap
      this.leftEar.rotation.z = 0.3 + Math.sin(t * 2) * 0.15;
      this.rightEar.rotation.z = 0.3 - Math.sin(t * 2) * 0.15;
    } else {
      // Idle tail wag
      this.tail.rotation.z = Math.PI / 2 + 0.3 + Math.sin(performance.now() * 0.008) * 0.2;
    }
  }

  // Player tagged Obi
  tag() {
    this.taggedTimer = 4.0; // 4 seconds stunned
    this.vel.set(0, 0, 0);
  }

  // Check if Obi caught a chicken
  checkChickenCatch(chickens) {
    for (const c of chickens) {
      if (c.caught) continue;
      if (this.pos.distanceTo(c.pos) < 1.2) {
        c.caught = true;
        this.chickensCaught++;
        return c;
      }
    }
    return null;
  }
}