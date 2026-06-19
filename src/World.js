// World.js — Procedural 3D farm environment built from Three.js primitives
// No external assets — everything is generated from geometry + materials.

import * as THREE from 'three';

export const WORLD_SIZE = 120;     // total play area
export const FENCE_LIMIT = 55;     // player can't go past this
export const GROUND_Y = 0;

// ─── Helper: per-vertex terrain coloring ───────────────────────────────
function paintTerrain(geo, colors) {
  const positions = geo.attributes.position;
  const colorArr = new Float32Array(positions.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    // Simple noise from coordinates
    const n = Math.sin(x * 0.15) * Math.cos(z * 0.12) + Math.sin(x * 0.07 + z * 0.09) * 0.5;
    const t = (n + 1.5) / 3; // 0..1
    // Blend between 4 green shades
    if (t < 0.33) {
      c.setHex(colors[0]);
    } else if (t < 0.66) {
      c.lerpColors(new THREE.Color(colors[0]), new THREE.Color(colors[1]), (t - 0.33) * 3);
    } else {
      c.lerpColors(new THREE.Color(colors[1]), new THREE.Color(colors[2]), (t - 0.66) * 3);
    }
    colorArr[i * 3] = c.r;
    colorArr[i * 3 + 1] = c.g;
    colorArr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  return new THREE.MeshLambertMaterial({ vertexColors: true });
}

// ─── Ground ────────────────────────────────────────────────────────────
export function createGround(scene) {
  // Main grass field — vertex-colored for variation
  const grassGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 48, 48);
  const grassMat = paintTerrain(grassGeo, [0x4a7a2a, 0x5a8a3a, 0x6faa4e]);
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // Meadow area — slightly lighter green patch to the east
  const meadowGeo = new THREE.CircleGeometry(22, 32);
  const meadowMat = new THREE.MeshLambertMaterial({ color: 0x7fc060 });
  const meadow = new THREE.Mesh(meadowGeo, meadowMat);
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.set(30, 0.01, -15);
  meadow.receiveShadow = true;
  scene.add(meadow);

  // Wildflowers in meadow (small colored dots)
  const flowerColors = [0xffe066, 0xff6b9d, 0xffffff, 0xcc66ff, 0xffaa44];
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 20;
    const fgeo = new THREE.SphereGeometry(0.15, 6, 6);
    const fmat = new THREE.MeshLambertMaterial({
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
    });
    const flower = new THREE.Mesh(fgeo, fmat);
    flower.position.set(30 + Math.cos(a) * r, 0.15, -15 + Math.sin(a) * r);
    flower.castShadow = false;
    scene.add(flower);
  }

  // Dirt road running along the north edge
  const roadGeo = new THREE.PlaneGeometry(WORLD_SIZE, 6);
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x9b7a4a });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -45);
  road.receiveShadow = true;
  scene.add(road);

  // Dirt path from road to coop area
  const pathGeo = new THREE.PlaneGeometry(4, 40);
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x9b7a4a });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(-15, 0.02, -25);
  path.receiveShadow = true;
  scene.add(path);
}

// ─── Maple trees lining the road ───────────────────────────────────────
export function createMapleTrees(scene, windRegistry) {
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
  const leafGeo = new THREE.SphereGeometry(2.5, 12, 10);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0xc0392b }); // red-orange maples

  const canopies = [];

  // Trees on both sides of the road, spaced along it
  for (let i = -50; i <= 50; i += 10) {
    const c1 = makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, i, -48, windRegistry);
    if (c1) canopies.push(c1);
    const c2 = makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, i, -42, windRegistry);
    if (c2) canopies.push(c2);
  }
  // A few scattered maples near the meadow edge
  makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, 12, 8, windRegistry);
  makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, -20, 12, windRegistry);
  makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, 45, 5, windRegistry);

  return canopies;
}

function makeTree(scene, trunkGeo, trunkMat, leafGeo, leafMat, x, z, windRegistry) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // 3 overlapping leaf spheres for a fuller canopy
  const canopy = new THREE.Group();
  const leafMatVariant = leafMat.clone();
  const hueShift = (Math.random() - 0.5) * 0.06;
  leafMatVariant.color.offsetHSL(hueShift, 0, (Math.random() - 0.5) * 0.1);

  for (let j = 0; j < 3; j++) {
    const leaves = new THREE.Mesh(leafGeo, leafMatVariant);
    leaves.position.set(
      (Math.random() - 0.5) * 1.5,
      4.5 + Math.random() * 0.8,
      (Math.random() - 0.5) * 1.5
    );
    leaves.scale.setScalar(0.9 + Math.random() * 0.3);
    leaves.castShadow = true;
    canopy.add(leaves);
  }
  tree.add(canopy);

  // Register canopy for wind sway
  if (windRegistry) {
    windRegistry.register(canopy, 0.02 + Math.random() * 0.02);
  }

  tree.position.set(x, 0, z);
  scene.add(tree);
  return canopy;
}

// ─── Chicken Coop ──────────────────────────────────────────────────────
export function createChickenCoop(scene) {
  const coopGroup = new THREE.Group();
  const coopX = -15, coopZ = 20;

  // Base/floor
  const floorGeo = new THREE.BoxGeometry(8, 0.3, 6);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0xb8864a });
  const floor = new THREE.Mesh(floorGeo, woodMat);
  floor.position.y = 0.15;
  floor.castShadow = true;
  floor.receiveShadow = true;
  coopGroup.add(floor);

  // Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xd4a66a });
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.2), wallMat);
  backWall.position.set(0, 1.5, -3);
  backWall.castShadow = true;
  coopGroup.add(backWall);
  // Side walls
  const sideGeo = new THREE.BoxGeometry(0.2, 3, 6);
  const leftWall = new THREE.Mesh(sideGeo, wallMat);
  leftWall.position.set(-4, 1.5, 0);
  leftWall.castShadow = true;
  coopGroup.add(leftWall);
  const rightWall = new THREE.Mesh(sideGeo, wallMat);
  rightWall.position.set(4, 1.5, 0);
  rightWall.castShadow = true;
  coopGroup.add(rightWall);
  // Front wall with opening (use two boxes)
  const frontL = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.2), wallMat);
  frontL.position.set(-2.5, 1.5, 3);
  frontL.castShadow = true;
  coopGroup.add(frontL);
  const frontR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.2), wallMat);
  frontR.position.set(2.5, 1.5, 3);
  frontR.castShadow = true;
  coopGroup.add(frontR);
  // Top of front opening
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.2), wallMat);
  frontTop.position.set(0, 2.5, 3);
  frontTop.castShadow = true;
  coopGroup.add(frontTop);

  // Roof — sloped
  const roofGeo = new THREE.BoxGeometry(9, 0.2, 7);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 3.5, 0);
  roof.rotation.z = -0.12;
  roof.castShadow = true;
  coopGroup.add(roof);

  // Roof overhang (second slope)
  const roof2 = new THREE.Mesh(roofGeo, roofMat);
  roof2.position.set(0, 3.3, 0.5);
  roof2.rotation.z = 0.12;
  roof2.castShadow = true;
  coopGroup.add(roof2);

  // Ramp from coop to ground
  const rampGeo = new THREE.BoxGeometry(2, 0.15, 3);
  const ramp = new THREE.Mesh(rampGeo, woodMat);
  ramp.position.set(0, 0.5, 4.5);
  ramp.rotation.x = -0.3;
  coopGroup.add(ramp);

  // Nesting boxes on the side (little cubbies)
  for (let i = 0; i < 3; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.2),
      woodMat
    );
    box.position.set(-5, 1 + i * 1.1, -1);
    box.castShadow = true;
    coopGroup.add(box);
  }

  // A little weather vane on top
  const vanePole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  vanePole.position.set(0, 4.2, 0);
  coopGroup.add(vanePole);
  const vaneArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.6, 4),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  vaneArrow.position.set(0, 4.8, 0);
  vaneArrow.rotation.x = Math.PI / 2;
  coopGroup.add(vaneArrow);

  coopGroup.position.set(coopX, 0, coopZ);
  scene.add(coopGroup);
  return { x: coopX, z: coopZ, group: coopGroup };
}

// ─── Farm entrance arch with sign ──────────────────────────────────────
export function createFarmArch(scene) {
  const arch = new THREE.Group();
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b6b3a });
  const signMat = new THREE.MeshLambertMaterial({ color: 0xd4a66a });

  // Two posts
  const postGeo = new THREE.CylinderGeometry(0.25, 0.3, 5, 8);
  const leftPost = new THREE.Mesh(postGeo, woodMat);
  leftPost.position.set(-3, 2.5, 0);
  leftPost.castShadow = true;
  arch.add(leftPost);
  const rightPost = new THREE.Mesh(postGeo, woodMat);
  rightPost.position.set(3, 2.5, 0);
  rightPost.castShadow = true;
  arch.add(rightPost);

  // Crossbeam
  const beamGeo = new THREE.BoxGeometry(7, 0.4, 0.3);
  const beam = new THREE.Mesh(beamGeo, woodMat);
  beam.position.set(0, 5.2, 0);
  beam.castShadow = true;
  arch.add(beam);

  // Sign board
  const signGeo = new THREE.BoxGeometry(5, 1.2, 0.15);
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 4.2, 0);
  sign.castShadow = true;
  arch.add(sign);

  // Sign text — "Obi's Farm" using simple geometry letters
  // Use a CanvasTexture for the text
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d4a66a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#3a2a1a';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("Obi's Farm", 256, 64);
  // Little heart
  ctx.fillStyle = '#cc4444';
  ctx.font = '36px serif';
  ctx.fillText('🐶', 256, 110);

  const tex = new THREE.CanvasTexture(canvas);
  const signFaceMat = new THREE.MeshBasicMaterial({ map: tex });
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.1), signFaceMat);
  signFace.position.set(0, 4.2, 0.08);
  arch.add(signFace);

  // Vine decoration on posts (green spirals)
  const vineMat = new THREE.MeshLambertMaterial({ color: 0x3a6b1a });
  for (let side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 4),
        vineMat
      );
      leaf.position.set(side * 3 + (Math.random() - 0.5) * 0.3, 1 + i * 1.2, (Math.random() - 0.5) * 0.3);
      arch.add(leaf);
    }
  }

  // Position the arch over the path entrance from the road
  arch.position.set(-15, 0, -42);
  scene.add(arch);
  return arch;
}

// ─── Blackberry rows ───────────────────────────────────────────────────
export function createBlackberryRows(scene, windRegistry) {
  // Rows of blackberry bushes — trellis style
  const bushMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1f });
  const berryMat = new THREE.MeshLambertMaterial({ color: 0x2a0a4a });
  const postMat = new THREE.MeshLambertMaterial({ color: 0x8b6b3a });

  const rows = [
    { x: 20, zStart: -35, zEnd: 5 },
    { x: 26, zStart: -35, zEnd: 5 },
    { x: 32, zStart: -35, zEnd: 5 },
  ];

  const bushPositions = [];

  rows.forEach(row => {
    // Trellis posts at each end
    [row.zStart, row.zEnd].forEach(z => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6),
        postMat
      );
      post.position.set(row.x, 1.1, z);
      post.castShadow = true;
      scene.add(post);
    });

    // Wire between posts (thin cylinder)
    const wireLen = Math.abs(row.zEnd - row.zStart);
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, wireLen, 4),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    );
    wire.position.set(row.x, 1.6, (row.zStart + row.zEnd) / 2);
    wire.rotation.x = Math.PI / 2;
    scene.add(wire);

    // Bushes along the row
    for (let z = row.zStart; z <= row.zEnd; z += 2.5) {
      // Bush body — cluster of small spheres
      const bushGroup = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.5 + Math.random() * 0.2, 8, 6),
          bushMat
        );
        leaf.position.set(
          (Math.random() - 0.5) * 0.8,
          0.4 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.8
        );
        leaf.castShadow = true;
        bushGroup.add(leaf);
      }
      // Berries — small dark purple dots
      for (let b = 0; b < 4; b++) {
        const berry = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          berryMat
        );
        berry.position.set(
          (Math.random() - 0.5) * 0.7,
          0.5 + Math.random() * 0.6,
          (Math.random() - 0.5) * 0.7
        );
        bushGroup.add(berry);
      }
      bushGroup.position.set(row.x, 0, z);
      scene.add(bushGroup);
      bushPositions.push([row.x, z]);

      // Register for wind sway
      if (windRegistry) {
        windRegistry.register(bushGroup, 0.04 + Math.random() * 0.02);
      }
    }
  });
  return bushPositions;
}

// ─── Fence around the farm ─────────────────────────────────────────────
export function createFence(scene) {
  const postGeo = new THREE.BoxGeometry(0.25, 1.4, 0.25);
  const railMat = new THREE.MeshLambertMaterial({ color: 0xd0c0a0 });
  const postMat = new THREE.MeshLambertMaterial({ color: 0xc4a86a });

  const r = FENCE_LIMIT;
  const spacing = 4;

  // Build fence on all 4 sides
  const sides = [
    { from: [-r, -r], to: [r, -r] },   // north
    { from: [-r, r], to: [r, r] },     // south
    { from: [-r, -r], to: [-r, r] },   // west
    { from: [r, -r], to: [r, r] },     // east
  ];

  sides.forEach(side => {
    const [x1, z1] = side.from;
    const [x2, z2] = side.to;
    const len = Math.hypot(x2 - x1, z2 - z1);
    const steps = Math.floor(len / spacing);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.7, z);
      post.castShadow = true;
      scene.add(post);

      // Horizontal rails between posts (skip last post of each side)
      if (i < steps) {
        const midX = x + (x2 - x1) / steps / 2;
        const midZ = z + (z2 - z1) / steps / 2;
        const railGeo = new THREE.BoxGeometry(
          side.from[0] === side.to[0] ? 0.12 : spacing,
          0.1,
          side.from[1] === side.to[1] ? 0.12 : spacing
        );
        const rail1 = new THREE.Mesh(railGeo, railMat);
        rail1.position.set(midX, 1.0, midZ);
        scene.add(rail1);
        const rail2 = new THREE.Mesh(railGeo, railMat);
        rail2.position.set(midX, 0.5, midZ);
        scene.add(rail2);
      }
    }
  });
}

// ─── Hay bales (decorative + obstacles) ────────────────────────────────
export function createHayBales(scene) {
  const hayMat = new THREE.MeshLambertMaterial({ color: 0xe8c75a });
  const positions = [
    [5, 5], [-8, -10], [38, 12], [-30, 25], [10, 35],
  ];
  const balePositions = [];
  positions.forEach(([x, z]) => {
    const bale = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.6, 16),
      hayMat
    );
    bale.rotation.x = Math.PI / 2;
    bale.position.set(x, 1.2, z);
    bale.castShadow = true;
    bale.receiveShadow = true;
    scene.add(bale);
    balePositions.push({ x, z, radius: 1.2 });
  });
  return balePositions;
}

// ─── Scattered details (rocks, pumpkins, sunflowers) ───────────────────
export function createDecorations(scene) {
  // Sunflowers near the coop
  const sunflowerStem = new THREE.MeshLambertMaterial({ color: 0x3a6b1a });
  const sunflowerHead = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
  const sunflowerCenter = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
  for (let i = 0; i < 8; i++) {
    const x = -18 + (Math.random() - 0.5) * 8;
    const z = 24 + (Math.random() - 0.5) * 6;
    const sf = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2, 6), sunflowerStem);
    stem.position.y = 1;
    sf.add(stem);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), sunflowerHead);
    head.position.y = 2;
    head.rotation.x = -Math.PI / 4;
    sf.add(head);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), sunflowerCenter);
    center.position.set(0, 2.05, 0.05);
    sf.add(center);
    sf.position.set(x, 0, z);
    scene.add(sf);
  }

  // Pumpkins near blackberry rows
  const pumpkinMat = new THREE.MeshLambertMaterial({ color: 0xe8610a });
  for (let i = 0; i < 5; i++) {
    const pumpkin = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 8),
      pumpkinMat
    );
    pumpkin.scale.y = 0.7;
    pumpkin.position.set(
      17 + Math.random() * 3,
      0.35,
      8 + Math.random() * 4
    );
    pumpkin.castShadow = true;
    scene.add(pumpkin);
  }

  // A few rocks
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  for (let i = 0; i < 6; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0),
      rockMat
    );
    rock.position.set(
      (Math.random() - 0.5) * 80,
      0.2,
      (Math.random() - 0.5) * 80
    );
    rock.castShadow = true;
    scene.add(rock);
  }
}

// ─── Clouds (simple white puffs) ───────────────────────────────────────
export function createClouds(scene) {
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random(), 8, 6),
        cloudMat
      );
      puff.position.set(j * 2.5 - 4, Math.random() * 0.8, Math.random() * 2 - 1);
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() - 0.5) * 140,
      25 + Math.random() * 8,
      (Math.random() - 0.5) * 140
    );
    scene.add(cloud);
    clouds.push(cloud);
  }
  return clouds; // return for animation
}