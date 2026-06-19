// Player.js — Farm kid character with third-person camera + controls

import * as THREE from 'three';
import { FENCE_LIMIT } from './World.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = this.build();
    scene.add(this.mesh);

    // State
    this.pos = new THREE.Vector3(0, 0, 10);
    this.vel = new THREE.Vector3();
    this.speed = 7;
    this.sprintSpeed = 12;
    this.isSprinting = false;
    this.facing = 0; // radians
    this.tagCooldown = 0;
    this.stunned = 0; // skunk spray stun timer

    // Camera control
    this.camAngle = 0;
    this.camDistance = 12;
    this.camHeight = 8;

    // Input
    this.keys = {};
    this.touchVector = { x: 0, y: 0 };
    this.touchSprinting = false;

    this.setupInput();
  }

  build() {
    const g = new THREE.Group();

    // Body — overalls (blue)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a6fa8 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 4, 8), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    g.add(body);

    // Shirt (red) — top portion
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xcc4444 });
    const shirt = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), shirtMat);
    shirt.position.y = 1.5;
    shirt.scale.y = 0.6;
    shirt.castShadow = true;
    g.add(shirt);

    // Head
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd6b0 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), skinMat);
    head.position.y = 2.1;
    head.castShadow = true;
    g.add(head);

    // Hair (brown)
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x6b3e1a });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), hairMat);
    hair.position.y = 2.25;
    hair.scale.y = 0.5;
    g.add(hair);

    // Hat (straw farm hat)
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xe8c75a });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), hatMat);
    hatBrim.position.y = 2.5;
    hatBrim.castShadow = true;
    g.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 12), hatMat);
    hatTop.position.y = 2.62;
    hatTop.castShadow = true;
    g.add(hatTop);

    // Arms
    const armMat = new THREE.MeshLambertMaterial({ color: 0xcc4444 });
    const armGeo = new THREE.CapsuleGeometry(0.12, 0.5, 4, 6);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.5, 1.1, 0);
    leftArm.castShadow = true;
    g.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.5, 1.1, 0);
    rightArm.castShadow = true;
    g.add(rightArm);
    this.rightArm = rightArm;

    // Legs (boots)
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    const legGeo = new THREE.CapsuleGeometry(0.15, 0.4, 4, 6);
    const leftLeg = new THREE.Mesh(legGeo, bootMat);
    leftLeg.position.set(-0.2, 0.3, 0);
    leftLeg.castShadow = true;
    g.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, bootMat);
    rightLeg.position.set(0.2, 0.3, 0);
    rightLeg.castShadow = true;
    g.add(rightLeg);
    this.rightLeg = rightLeg;

    // A little tag reach indicator (hidden by default)
    const reachMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44, transparent: true, opacity: 0.0, side: THREE.DoubleSide
    });
    const reach = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 20), reachMat);
    reach.rotation.x = -Math.PI / 2;
    reach.position.y = 0.05;
    g.add(reach);
    this.reachIndicator = reach;

    g.position.copy(this.pos);
    return g;
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  update(dt, obi) {
    // Decrement timers
    if (this.tagCooldown > 0) this.tagCooldown -= dt;
    if (this.stunned > 0) this.stunned -= dt;

    // Determine movement input
    let mx = 0, mz = 0;
    const k = this.keys;
    if (this.stunned <= 0) {
      if (k['KeyW'] || k['ArrowUp']) mz -= 1;
      if (k['KeyS'] || k['ArrowDown']) mz += 1;
      if (k['KeyA'] || k['ArrowLeft']) mx -= 1;
      if (k['KeyD'] || k['ArrowRight']) mx += 1;
      // Touch input
      mx += this.touchVector.x;
      mz += this.touchVector.y;
    }

    // Sprint
    this.isSprinting = (k['ShiftLeft'] || k['ShiftRight'] || this.touchSprinting) && (Math.abs(mx) + Math.abs(mz) > 0.1);
    const spd = this.isSprinting ? this.sprintSpeed : this.speed;

    // Normalize
    const mag = Math.hypot(mx, mz);
    if (mag > 0.01) {
      mx /= mag;
      mz /= mag;
      this.vel.x = mx * spd;
      this.vel.z = mz * spd;
      this.facing = Math.atan2(mx, -mz); // face movement direction
    } else {
      this.vel.x *= 0.8;
      this.vel.z *= 0.8;
    }

    // Apply
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // Clamp to fence
    const lim = FENCE_LIMIT - 2;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -lim, lim);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -lim, lim);

    // Update mesh
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.facing;

    // Bob animation when moving
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.5;
    if (moving) {
      const t = performance.now() * 0.01 * (this.isSprinting ? 1.6 : 1.0);
      this.leftLeg.rotation.x = Math.sin(t) * 0.5;
      this.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      this.leftArm.rotation.x = -Math.sin(t) * 0.4;
      this.rightArm.rotation.x = Math.sin(t) * 0.4;
      this.mesh.position.y = Math.abs(Math.sin(t * 2)) * 0.08;
    } else {
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
      this.mesh.position.y *= 0.8;
    }

    // Reach indicator pulse when near Obi
    if (obi) {
      const dist = this.pos.distanceTo(obi.pos);
      if (dist < 3.5 && this.tagCooldown <= 0) {
        this.reachIndicator.material.opacity = 0.3 + Math.sin(performance.now() * 0.01) * 0.2;
        this.reachIndicator.scale.setScalar(1 + Math.sin(performance.now() * 0.008) * 0.1);
      } else {
        this.reachIndicator.material.opacity *= 0.9;
      }
    }

    // Camera follow (orbit style)
    const targetCamX = this.pos.x - Math.sin(this.camAngle) * this.camDistance;
    const targetCamZ = this.pos.z - Math.cos(this.camAngle) * this.camDistance;
    const targetCamY = this.pos.y + this.camHeight;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.06;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.06;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;
    this.camera.lookAt(this.pos.x, this.pos.y + 1.5, this.pos.z);
  }

  // Try to tag Obi — returns true if close enough and not on cooldown
  tryTag(obi) {
    if (this.tagCooldown > 0 || this.stunned > 0) return false;
    const dist = this.pos.distanceTo(obi.pos);
    if (dist < 3.5) {
      this.tagCooldown = 0.5;
      return true;
    }
    return false;
  }

  // Called when skunk sprays the player
  spray() {
    this.stunned = 3.0;
  }

  distanceTo(pos) {
    return this.pos.distanceTo(pos);
  }
}