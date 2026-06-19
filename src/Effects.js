// Effects.js — Particle systems and visual effects for Obi's Farm Adventure
// All effects use Three.js primitives — no textures needed.

import * as THREE from 'three';

// ─── Particle pool base ────────────────────────────────────────────────
class ParticleSystem {
  constructor(scene, maxParticles, geometry, material) {
    this.scene = scene;
    this.max = maxParticles;
    this.particles = [];
    this.geometry = geometry;
    this.material = material;
  }

  spawn(x, y, z, vx, vy, vz, life, scale) {
    if (this.particles.length >= this.max) {
      // Recycle oldest
      const old = this.particles.shift();
      this.scene.remove(old.mesh);
    }
    const mesh = new THREE.Mesh(this.geometry, this.material.clone());
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);
    this.particles.push({
      mesh, vx, vy, vz, life, maxLife: life, scale,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 5 * dt; // gravity for most particles
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t;
      p.mesh.material.transparent = true;
      p.mesh.scale.setScalar(p.scale * (0.3 + t * 0.7));
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Feather trail (when Obi chases chickens) ──────────────────────────
export class FeatherTrail {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geometry = new THREE.PlaneGeometry(0.15, 0.25);
    this.material = new THREE.MeshLambertMaterial({
      color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
    });
    this.timer = 0;
  }

  emit(x, y, z) {
    const mat = this.material.clone();
    mat.color.setHSL(0.1, 0.2, 0.85 + Math.random() * 0.15);
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.5, z + (Math.random() - 0.5) * 0.5);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 1.5,
      rx: (Math.random() - 0.5) * 3,
      ry: (Math.random() - 0.5) * 3,
      rz: (Math.random() - 0.5) * 3,
      life: 2.5, maxLife: 2.5,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 1.5 * dt; // gentle float down
      p.mesh.rotation.x += p.rx * dt;
      p.mesh.rotation.y += p.ry * dt;
      p.mesh.rotation.z += p.rz * dt;
      p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Heart particles (chickens safe) ───────────────────────────────────
export class HeartParticles {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    // Heart shape using a custom geometry (two spheres + cone)
    this.geometry = new THREE.SphereGeometry(0.12, 6, 5);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff4466, transparent: true, opacity: 0.9,
    });
  }

  emit(x, y, z) {
    // Create a small heart from two spheres
    const group = new THREE.Group();
    const mat = this.material.clone();
    const left = new THREE.Mesh(this.geometry, mat);
    left.position.set(-0.08, 0.05, 0);
    left.scale.set(1, 1.2, 0.5);
    const right = new THREE.Mesh(this.geometry, mat);
    right.position.set(0.08, 0.05, 0);
    right.scale.set(1, 1.2, 0.5);
    const bottom = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.2, 4),
      mat
    );
    bottom.position.set(0, -0.08, 0);
    bottom.rotation.x = Math.PI;
    bottom.scale.set(1, 1, 0.5);
    group.add(left, right, bottom);
    group.position.set(x, y + 0.5, z);
    group.scale.setScalar(0.5);
    this.scene.add(group);
    this.particles.push({
      mesh: group,
      vy: 1.5,
      life: 1.5, maxLife: 1.5,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.y += p.vy * dt;
      p.vy *= 0.98;
      const t = p.life / p.maxLife;
      p.mesh.scale.setScalar(0.5 * (0.5 + t));
      // Fade
      p.mesh.traverse(child => {
        if (child.material) child.material.opacity = t * 0.9;
      });
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Sad face icon (chicken caught) ────────────────────────────────────
export class SadFace {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  emit(x, y, z) {
    const group = new THREE.Group();
    // Yellow face circle
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 16),
      new THREE.MeshBasicMaterial({ color: 0xffdd44, side: THREE.DoubleSide })
    );
    group.add(face);
    // Two sad eyes (small dark circles)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const eyeGeo = new THREE.CircleGeometry(0.05, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.05, 0.01);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.05, 0.01);
    group.add(rightEye);
    // Sad mouth (arc — using a half torus)
    const mouth = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 8, 1, Math.PI, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })
    );
    mouth.position.set(0, -0.12, 0.01);
    group.add(mouth);

    group.position.set(x, y + 1.2, z);
    group.scale.setScalar(0.6);
    // Always face camera (will be updated)
    this.scene.add(group);
    this.particles.push({ mesh: group, life: 2.0, maxLife: 2.0 });
  }

  update(dt, camera) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      // Float up and bob
      p.mesh.position.y += 0.5 * dt;
      const t = p.life / p.maxLife;
      p.mesh.scale.setScalar(0.6 * (0.5 + t * 0.5));
      // Face the camera
      if (camera) p.mesh.lookAt(camera.position);
      p.mesh.traverse(child => {
        if (child.material) child.material.opacity = t;
      });
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Stink cloud (follows skunk, grows before spraying) ────────────────
export class StinkCloud {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geometry = new THREE.SphereGeometry(0.3, 8, 6);
    this.material = new THREE.MeshLambertMaterial({
      color: 0x88aa44, transparent: true, opacity: 0.4,
    });
  }

  emit(x, y, z, intensity = 1) {
    const mat = this.material.clone();
    mat.color.setHSL(0.25, 0.4, 0.4 + Math.random() * 0.1);
    mat.opacity = 0.3 + intensity * 0.2;
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.8,
      y + 0.3 + Math.random() * 0.4,
      z + (Math.random() - 0.5) * 0.8
    );
    mesh.scale.setScalar(0.5 + intensity * 0.5);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vy: 0.3 + Math.random() * 0.3,
      life: 1.5 + intensity * 0.5,
      maxLife: 1.5 + intensity * 0.5,
      baseScale: 0.5 + intensity * 0.5,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.x += (Math.random() - 0.5) * 0.5 * dt;
      p.mesh.position.z += (Math.random() - 0.5) * 0.5 * dt;
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t * 0.4;
      p.mesh.scale.setScalar(p.baseScale * (1 + (1 - t) * 0.8));
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Dust trail (player sprint) ────────────────────────────────────────
export class DustTrail {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geometry = new THREE.SphereGeometry(0.15, 6, 5);
    this.material = new THREE.MeshLambertMaterial({
      color: 0xd4a878, transparent: true, opacity: 0.5,
    });
  }

  emit(x, y, z) {
    const mat = this.material.clone();
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.4,
      y + 0.1,
      z + (Math.random() - 0.5) * 0.4
    );
    mesh.scale.setScalar(0.5 + Math.random() * 0.3);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.4,
      vz: (Math.random() - 0.5) * 0.5,
      life: 0.6, maxLife: 0.6,
      baseScale: mesh.scale.x,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t * 0.5;
      p.mesh.scale.setScalar(p.baseScale * (1 + (1 - t) * 0.5));
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Confetti (win celebration) ────────────────────────────────────────
export class Confetti {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geometry = new THREE.PlaneGeometry(0.15, 0.3);
    this.colors = [0xff4466, 0x44ff66, 0x4466ff, 0xffdd44, 0xff66ff, 0x66ffff];
  }

  burst(x, y, z, count = 50) {
    for (let i = 0; i < count; i++) {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 1,
      });
      const mesh = new THREE.Mesh(this.geometry, mat);
      mesh.position.set(x, y + 2, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 5 + Math.random() * 5,
        vz: Math.sin(angle) * speed,
        rx: (Math.random() - 0.5) * 8,
        ry: (Math.random() - 0.5) * 8,
        rz: (Math.random() - 0.5) * 8,
        life: 3, maxLife: 3,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 8 * dt; // gravity
      p.mesh.rotation.x += p.rx * dt;
      p.mesh.rotation.y += p.ry * dt;
      p.mesh.rotation.z += p.rz * dt;
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = Math.min(1, t * 2);
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}

// ─── Fireflies (evening ambience) ──────────────────────────────────────
export class Fireflies {
  constructor(scene, count = 30) {
    this.scene = scene;
    this.flies = [];
    const geo = new THREE.SphereGeometry(0.06, 6, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff88, transparent: true, opacity: 0.9,
    });

    for (let i = 0; i < count; i++) {
      const fly = new THREE.Mesh(geo, mat.clone());
      fly.position.set(
        (Math.random() - 0.5) * 80,
        1 + Math.random() * 4,
        (Math.random() - 0.5) * 80
      );
      this.scene.add(fly);
      this.flies.push({
        mesh: fly,
        baseX: fly.position.x,
        baseY: fly.position.y,
        baseZ: fly.position.z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        blinkPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt) {
    const t = performance.now() * 0.001;
    this.flies.forEach(f => {
      f.mesh.position.x = f.baseX + Math.sin(t * f.speed + f.phase) * 3;
      f.mesh.position.z = f.baseZ + Math.cos(t * f.speed * 0.7 + f.phase) * 3;
      f.mesh.position.y = f.baseY + Math.sin(t * f.speed * 1.3 + f.phase) * 0.5;
      // Blink
      f.mesh.material.opacity = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3 + f.blinkPhase));
    });
  }

  clear() {
    this.flies.forEach(f => this.scene.remove(f.mesh));
    this.flies = [];
  }
}