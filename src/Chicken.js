// Chicken.js — Farm chickens with wandering + fleeing behavior

import * as THREE from 'three';
import { FENCE_LIMIT } from './World.js';

const CHICKEN_NAMES = ['Henrietta', 'Buttercup', 'Daisy', 'Penny', 'Goldie', 'Pecky'];
const CHICKEN_COLORS = [
  0xffffff,  // white
  0xf0d060,  // golden
  0xd4a060,  // brown
  0xe8d0a0,  // cream
  0xc08040,  // dark brown
  0xf5e0c0,  // light buff
];

export class Chicken {
  constructor(scene, index) {
    this.scene = scene;
    this.index = index;
    this.name = CHICKEN_NAMES[index % CHICKEN_NAMES.length];
    this.color = CHICKEN_COLORS[index % CHICKEN_COLORS.length];
    this.mesh = this.build();
    scene.add(this.mesh);

    // Spawn near the coop
    const a = (index / 6) * Math.PI * 2;
    this.pos = new THREE.Vector3(-15 + Math.cos(a) * 5, 0, 20 + Math.sin(a) * 5);
    this.vel = new THREE.Vector3();
    this.baseSpeed = 2 + Math.random();
    this.fleeSpeed = 5 + Math.random() * 2;
    this.facing = 0;
    this.caught = false;
    this.scared = false;
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.flapTimer = 0;
  }

  build() {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: this.color });

    // Body — egg shaped
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat);
    body.scale.set(1, 0.8, 1.3);
    body.position.y = 0.35;
    body.castShadow = true;
    g.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat);
    head.position.set(0, 0.55, 0.3);
    head.castShadow = true;
    g.add(head);
    this.head = head;

    // Comb (red crest)
    const combMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.15),
      combMat
    );
    comb.position.set(0, 0.7, 0.28);
    g.add(comb);

    // Beak
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xe8a020 });
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), beakMat);
    beak.position.set(0, 0.52, 0.48);
    beak.rotation.x = Math.PI / 2;
    g.add(beak);

    // Eyes
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.SphereGeometry(0.03, 5, 5);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(0.1, 0.58, 0.38);
    g.add(lEye);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(-0.1, 0.58, 0.38);
    g.add(rEye);

    // Legs (thin orange)
    const legMat = new THREE.MeshLambertMaterial({ color: 0xe8a020 });
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4);
    const lLeg = new THREE.Mesh(legGeo, legMat);
    lLeg.position.set(0.08, 0.12, 0);
    g.add(lLeg);
    this.lLeg = lLeg;
    const rLeg = new THREE.Mesh(legGeo, legMat);
    rLeg.position.set(-0.08, 0.12, 0);
    g.add(rLeg);
    this.rLeg = rLeg;

    // Tail feathers
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.3, 6),
      mat
    );
    tail.position.set(0, 0.4, -0.35);
    tail.rotation.x = -Math.PI / 2 + 0.5;
    g.add(tail);
    this.tail = tail;

    // Wings (flat planes on sides)
    const wingMat = new THREE.MeshLambertMaterial({
      color: this.color, side: THREE.DoubleSide
    });
    const wingGeo = new THREE.PlaneGeometry(0.15, 0.35);
    const lWing = new THREE.Mesh(wingGeo, wingMat);
    lWing.position.set(0.3, 0.35, 0);
    lWing.rotation.y = Math.PI / 2;
    g.add(lWing);
    this.lWing = lWing;
    const rWing = new THREE.Mesh(wingGeo, wingMat);
    rWing.position.set(-0.3, 0.35, 0);
    rWing.rotation.y = Math.PI / 2;
    g.add(rWing);
    this.rWing = rWing;

    g.position.copy(this.pos);
    return g;
  }

  update(dt, obi, player) {
    if (this.caught) {
      // Caught chickens huddle in place with sad look
      this.mesh.position.y = 0.15; // sitting low
      this.head.rotation.x = 0.3;  // head down
      return;
    }

    const distToObi = this.pos.distanceTo(obi.pos);
    const distToPlayer = this.pos.distanceTo(player.pos);
    const obiChasing = obi.state === 'chase' && obi.target === this;

    let targetVel = new THREE.Vector3();

    if (obiChasing && distToObi < 8) {
      // Flee from Obi!
      this.scared = true;
      const away = new THREE.Vector3()
        .subVectors(this.pos, obi.pos)
        .normalize();
      targetVel.copy(away).multiplyScalar(this.fleeSpeed);
      this.flapTimer = 0.5;
    } else if (distToObi < 4) {
      // Obi is near — mildly worried
      this.scared = true;
      const away = new THREE.Vector3()
        .subVectors(this.pos, obi.pos)
        .normalize();
      targetVel.copy(away).multiplyScalar(this.fleeSpeed * 0.7);
    } else {
      this.scared = false;
      // Wander
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        const a = Math.random() * Math.PI * 2;
        this.wanderDir.set(Math.cos(a), 0, Math.sin(a));
        this.wanderTimer = 1.5 + Math.random() * 2.5;
      }
      targetVel.copy(this.wanderDir).multiplyScalar(this.baseSpeed * 0.4);
    }

    // Smooth velocity
    this.vel.x += (targetVel.x - this.vel.x) * 0.12;
    this.vel.z += (targetVel.z - this.vel.z) * 0.12;

    // Apply
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // Clamp to fence
    const lim = FENCE_LIMIT - 1;
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -lim, lim);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -lim, lim);

    // Update mesh
    this.mesh.position.copy(this.pos);
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (speed > 0.3) {
      this.facing = Math.atan2(this.vel.x, this.vel.z);
      this.mesh.rotation.y = this.facing - Math.PI / 2;
      // Bobbing walk
      const t = performance.now() * 0.02;
      this.lLeg.rotation.x = Math.sin(t) * 0.3;
      this.rLeg.rotation.x = -Math.sin(t) * 0.3;
      this.mesh.position.y = Math.abs(Math.sin(t * 2)) * 0.05;
    }

    // Wing flap when scared
    if (this.flapTimer > 0) {
      this.flapTimer -= dt;
      const flap = Math.sin(performance.now() * 0.04) * 0.5;
      this.lWing.rotation.z = flap;
      this.rWing.rotation.z = -flap;
    } else {
      this.lWing.rotation.z *= 0.8;
      this.rWing.rotation.z *= 0.8;
    }
  }
}

export function createChickens(scene, count = 6) {
  const chickens = [];
  for (let i = 0; i < count; i++) {
    chickens.push(new Chicken(scene, i));
  }
  return chickens;
}