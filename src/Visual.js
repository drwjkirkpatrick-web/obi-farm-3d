// Visual.js — Visual polish systems for Obi's Farm Adventure
// Toon gradient map, sky dome, blob shadows, outlines, pollen motes, wind refs
// All upgrades are surface-level — no game logic changes.

import * as THREE from 'three';

// ─── 1. Toon gradient map (cel-shading) ────────────────────────────────
// A 3-step gradient texture that quantizes lighting into flat bands.
// Applied by swapping MeshLambertMaterial → MeshToonMaterial across entities.
export function createToonGradientMap() {
  const colors = new Uint8Array([80, 80, 80, 160, 160, 160, 220, 220, 220, 255, 255, 255]);
  const tex = new THREE.DataTexture(colors, 4, 1, THREE.RGBFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Convert a Lambert material to Toon material with same color
export function toToonMaterial(mat) {
  return new THREE.MeshToonMaterial({
    color: mat.color ? mat.color.clone() : 0xffffff,
    gradientMap: toToonMaterial._gradientMap,
  });
}

// ─── 2. Gradient sky dome ──────────────────────────────────────────────
// Large inverted sphere with vertex-color gradient: top=deep blue, horizon=warm
export function createSkyDome(dayColors = null) {
  const geo = new THREE.SphereGeometry(150, 32, 16);
  const positions = geo.attributes.position;

  // Default morning colors
  const topColor = new THREE.Color(dayColors?.top || 0x2a6cd4);
  const horizonColor = new THREE.Color(dayColors?.horizon || 0xc8e0ff);
  const bottomColor = new THREE.Color(dayColors?.bottom || 0xa0c8e0);

  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const t = (y / 150 + 1) / 2; // 0 at bottom, 1 at top
    let c;
    if (t > 0.5) {
      c = new THREE.Color().lerpColors(horizonColor, topColor, (t - 0.5) * 2);
    } else {
      c = new THREE.Color().lerpColors(bottomColor, horizonColor, t * 2);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
  });
  const dome = new THREE.Mesh(geo, mat);
  return dome;
}

// Evening color set for sky dome swap
export const EVENING_SKY = {
  top: 0x1a1844,
  horizon: 0xff6b35,
  bottom: 0x883311,
};

// Update sky dome colors for evening
export function setSkyEvening(dome) {
  const geo = dome.geometry;
  const positions = geo.attributes.position;
  const topColor = new THREE.Color(EVENING_SKY.top);
  const horizonColor = new THREE.Color(EVENING_SKY.horizon);
  const bottomColor = new THREE.Color(EVENING_SKY.bottom);

  const colors = geo.attributes.color;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const t = (y / 150 + 1) / 2;
    let c;
    if (t > 0.5) {
      c = new THREE.Color().lerpColors(horizonColor, topColor, (t - 0.5) * 2);
    } else {
      c = new THREE.Color().lerpColors(bottomColor, horizonColor, t * 2);
    }
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}

// Restore morning sky
export function setSkyMorning(dome) {
  const geo = dome.geometry;
  const positions = geo.attributes.position;
  const topColor = new THREE.Color(0x2a6cd4);
  const horizonColor = new THREE.Color(0xc8e0ff);
  const bottomColor = new THREE.Color(0xa0c8e0);

  const colors = geo.attributes.color;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const t = (y / 150 + 1) / 2;
    let c;
    if (t > 0.5) {
      c = new THREE.Color().lerpColors(horizonColor, topColor, (t - 0.5) * 2);
    } else {
      c = new THREE.Color().lerpColors(bottomColor, horizonColor, t * 2);
    }
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}

// ─── 3. Blob shadow under entity ───────────────────────────────────────
// Flat dark circle on the ground — always visible, unlike shadow maps
export function createBlobShadow(scale = 1.0) {
  const geo = new THREE.CircleGeometry(0.5 * scale, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geo, mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.renderOrder = 1;
  return shadow;
}

// ─── 4. Black outline edges ────────────────────────────────────────────
// Adds EdgesGeometry + LineSegments to any mesh, creating a comic-book outline
export function addOutline(mesh, color = 0x000000, opacity = 0.6) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
  const lineMat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(edges, lineMat);
  // Slightly larger scale so outline sits outside the mesh
  lines.scale.setScalar(1.03);
  mesh.add(lines);
  return lines;
}

// Recursively add outlines to all meshes in a group
export function addOutlinesToGroup(group, color = 0x222222, opacity = 0.4) {
  const outlines = [];
  group.traverse(child => {
    if (child.isMesh && child.geometry && !child.userData.noOutline) {
      const o = addOutline(child, color, opacity);
      outlines.push(o);
    }
  });
  return outlines;
}

// ─── 5. Pollen motes (floating golden particles) ───────────────────────
export class PollenMotes {
  constructor(scene, count = 60) {
    this.scene = scene;
    this.motes = [];
    const geo = new THREE.SphereGeometry(0.03, 4, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < count; i++) {
      const mote = new THREE.Mesh(geo, mat.clone());
      mote.position.set(
        (Math.random() - 0.5) * 90,
        1 + Math.random() * 5,
        (Math.random() - 0.5) * 90
      );
      mote.scale.setScalar(0.3 + Math.random() * 0.7);
      this.scene.add(mote);
      this.motes.push({
        mesh: mote,
        baseX: mote.position.x,
        baseY: mote.position.y,
        baseZ: mote.position.z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3,
        blinkPhase: Math.random() * Math.PI * 2,
      });
    }
    this.visible = true;
  }

  update(dt) {
    if (!this.visible) return;
    const t = performance.now() * 0.001;
    this.motes.forEach(m => {
      m.mesh.position.x = m.baseX + Math.sin(t * m.speed + m.phase) * 2;
      m.mesh.position.z = m.baseZ + Math.cos(t * m.speed * 0.7 + m.phase) * 2;
      m.mesh.position.y = m.baseY + Math.sin(t * m.speed * 1.3 + m.phase) * 0.3;
      m.mesh.material.opacity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + m.blinkPhase));
    });
  }

  fadeOut() {
    this.visible = false;
    this.motes.forEach(m => m.mesh.visible = false);
  }

  fadeIn() {
    this.visible = true;
    this.motes.forEach(m => m.mesh.visible = true);
  }

  clear() {
    this.motes.forEach(m => this.scene.remove(m.mesh));
    this.motes = [];
  }
}

// ─── 6. Wind sway registry ─────────────────────────────────────────────
// Collects objects that should sway in the wind. Each entry: { mesh, phase, amplitude }
export class WindRegistry {
  constructor() {
    this.objects = [];
  }

  register(mesh, amplitude = 0.03, phaseOffset = null) {
    this.objects.push({
      mesh,
      phase: phaseOffset !== null ? phaseOffset : Math.random() * Math.PI * 2,
      amplitude,
    });
  }

  update() {
    const t = performance.now() * 0.001;
    this.objects.forEach(obj => {
      obj.mesh.rotation.z = Math.sin(t + obj.phase) * obj.amplitude;
    });
  }
}