# 🐶 Obi's Farm Adventure — 3D

**A charming 3D farm game where you catch Obi the dachshund before he catches the chickens!**

Built with Three.js — pure procedural 3D geometry, no external assets needed.
Runs in any modern browser, desktop or mobile. Designed for ages 5+.

---

## 🎮 How to Play

| Objective | Detail |
|-----------|--------|
| 🏆 **Win** | Tag Obi 3 times to catch him |
| 💀 **Lose** | Don't let Obi catch 3 chickens |
| 🦨 **Evening hazard** | The skunk comes out at dusk — get too close and you'll be sprayed! |
| ⭐ **Score** | Points for surviving, tagging Obi, and keeping chickens safe |

### Controls

| Platform | Move | Sprint | Tag Obi |
|----------|------|--------|---------|
| 🖥️ Desktop | WASD / Arrow Keys | Shift | Space (when near Obi) |
| 📱 Mobile | Joystick (bottom-left) | 💨 button (bottom-right) | Tap near Obi |

---

## 🌾 The Farm

A fully procedural 3D farm built entirely from Three.js primitives — no image textures, no model files.

### Environment

| Feature | Description |
|---------|-------------|
| 🏞️ **Terrain** | Vertex-colored grass field (120×120) with 4 blended green shades for natural variation |
| 🌸 **Meadow** | Lighter green patch to the east with 80 wildflowers in 5 colors (yellow, pink, purple, white, orange) |
| 🍁 **Maple trees** | Red-orange autumn maples lining both sides of the dirt road — canopies sway in the wind |
| 🛤️ **Dirt road** | Runs along the north edge with a connecting path to the coop |
| 🐔 **Chicken coop** | Wood walls, sloped double roof, nesting boxes, ramp, weather vane — detailed multi-part build |
| 🫐 **Blackberry rows** | 3 trellis rows with posts, wire, bush clusters, and ripe purple berries — bushes sway in wind |
| 🌻 **Sunflowers** | 8 sunflowers near the coop with stems, petals, and centers |
| 🎃 **Pumpkins** | 5 pumpkins near the blackberry rows |
| 🌾 **Hay bales** | 5 cylindrical bales as obstacles you can't walk through |
| 🪨 **Rocks** | 6 scattered dodecahedron rocks |
| 🚧 **Wooden fence** | Post-and-rail fence enclosing the entire property |
| ☁️ **Clouds** | 6 drifting cloud clusters made of overlapping spheres |
| 🏛️ **Farm entrance arch** | Wooden arch with "Obi's Farm" sign, vine decorations, positioned over the path from the road |

### Atmosphere

| Feature | Description |
|---------|-------------|
| 🌅 **Gradient sky dome** | Large inverted sphere with vertex-color gradient: deep blue at top → warm white at horizon (not a flat blue background) |
| 🌫️ **Gradient-matched fog** | Fog color matches the sky horizon so distant objects fade naturally |
| 💡 **Three-point cinematic lighting** | Warm key light (sun), cool fill light (sky bounce), warm rim light (backlight) — Pixar-style lighting |
| ✨ **Pollen motes** | 60 golden particles drifting through the air at 1-5 height, gently pulsing — daytime ambience |
| 🌬️ **Wind sway** | All tree canopies and blackberry bushes sway with unique phase offsets — the world feels alive |
| 🐝 **Blob shadows** | Flat dark circles under every character — always grounded, even when shadow maps blur at distance |
| ✏️ **Black outlines** | Comic-book edge outlines on all characters — universal kid-language for "this is a character" |

---

## 🐾 Characters

### Obi the Dachshund 🐶
- Long brown body, floppy ears, red collar — **bigger for visibility**
- **Floating red exclamation marker** bobs above his head, visible from far away
- **AI state machine:** wander → chase (nearest chicken) → flee (from player) → tagged (stunned)
- Legs animate, tail wags, ears flap when running
- Gets stunned for 4 seconds when tagged (tail still wags!)
- **Red ring** on mini-map when chasing, **yellow** when fleeing, **green check** when tagged

### The Chickens (6) 🐔

| Name | Color | Behavior |
|------|-------|----------|
| Henrietta | White | Wander → flee when Obi approaches |
| Buttercup | Golden | Wing flap animation when scared |
| Daisy | Brown | Bobbing walk with leg animation |
| Penny | Cream | Comb, beak, and tail feathers |
| Goldie | Dark brown | Random wander directions |
| Pecky | Light buff | Speed varies per individual |

- ❤️ **Heart particles** float above safe chickens (occasional + on tag)
- 😢 **Sad face icons** appear above caught chickens
- Caught chickens sit low with head down

### The Skunk 🦨
- Black body with white stripe and bushy tail
- Appears at evening from a random edge of the farm
- **Green stink cloud** follows it — gets bigger and denser when ready to spray
- Raises tail straight up before spraying (warning!)
- 3-second stun + score penalty if sprayed
- 8-second cooldown between sprays
- Wanders peacefully when player is far away

### The Player 🧒
- Farm kid with straw hat, red shirt, blue overalls, brown boots
- Third-person camera that smoothly follows with orbit-style positioning
- Camera **auto-rotates toward Obi** when he's chasing and far away
- Walking and running animations with arm/leg swing
- **Sprint dust trail** particles when running
- Yellow ring appears when close enough to tag Obi

---

## ✨ Visual Effects

| Effect | When | What It Looks Like |
|--------|------|-------------------|
| 🪶 **Feather trail** | Obi chases a chicken | White feather planes float up and spin near the scared chicken |
| ❤️ **Heart particles** | Tag Obi or randomly for safe chickens | Red hearts float up from chickens and fade |
| 😢 **Sad face icons** | Chicken caught | Yellow sad-face billboards float above caught chickens, always face camera |
| 💨 **Dust trail** | Player sprints | Brown dust puffs behind the player |
| 💚 **Stink cloud** | Skunk is active | Green particles around skunk, intensify before spraying |
| 🎉 **Confetti burst** | Win! | 80 multicolored confetti pieces explode from player position |
| 🌟 **Fireflies** | Evening | 40 glowing yellow dots blink and drift through the dark farm |
| ✨ **Pollen motes** | Daytime | 60 golden particles drift in the air, fade out at evening |

---

## 🔊 Sound Effects

All sounds are **procedurally generated** with Web Audio oscillators — no audio files needed.

| Sound | When | What |
|-------|------|------|
| 🐕 **Bark** | Obi chases a chicken | Sawtooth wave bark every 2-4 seconds |
| 🐔 **Cluck** | Chickens are scared | 3-note square wave cluck |
| 😄 **Giggle** | Tag Obi | Rising sine wave giggle (4 notes) |
| 🦨💨 **Spray** | Skunk sprays player | Filtered noise burst (pssst!) |
| 🎵 **Win fanfare** | Victory | C-E-G-C triangle wave ascending |
| 😢 **Sad** | Chicken caught or lose | Descending sine wave |
| 🌅 **Evening tone** | Evening begins | Soft descending sunset tone |

---

## 🗺️ Mini-Map

A 2D radar canvas in the bottom-right corner showing:

| Icon | Entity |
|------|--------|
| 🔵 Blue triangle | Player |
| 🟤 Brown dot | Obi (with state ring: red=chase, yellow=flee, green=tagged) |
| 🟡 Yellow dot | Safe chicken |
| 🟠 Orange dot | Scared chicken |
| 🔴 Red dot | Caught chicken |
| ⬛ Black dot + white stripe | Skunk (when active) |
| 🟫 Brown square | Chicken coop |

---

## 🌅 Day/Evening Cycle

| Phase | Game Time | What Happens |
|-------|-----------|-------------|
| ☀️ **Morning** | 0–20s | Bright sky, pollen motes drifting, Obi chases chickens |
| 🌤️ **Afternoon** | 20–45s | Same gameplay, sun moves across sky |
| 🌅 **Evening** | 45s+ | **Sky turns orange-purple**, fireflies appear, pollen fades, **animated "🦨 Skunk Alert!" banner** slides in, skunk enters from random edge |

---

## 🎉 Victory Dance

When you win (tag Obi 3 times), the game doesn't just show a screen — it celebrates:

1. 🎵 **Win fanfare** plays (C-E-G-C)
2. 🎉 **80 confetti particles** burst from the player position
3. 🐔 **All safe chickens hop** up and down
4. 🐶 **Obi rolls over** (spinning animation)
5. ❤️ **Heart particles** float from chickens
6. 🏆 **Win screen** appears after 2.5 seconds with score, chickens saved, and time

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| 3D engine | Three.js r169 |
| Build tool | Vite 5 |
| Language | JavaScript (ES modules) |
| Audio | Web Audio API (procedural oscillators) |
| Particles | Three.js primitives (no external particle system) |
| Assets | **Zero external assets** — everything is code-generated geometry |
| Bundle size | ~548 KB (140 KB gzipped) |

---

## 📦 Build & Run

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

---

## 📁 Project Structure

```
obi-farm-3d/
├── src/
│   ├── main.js       # Game loop, states, HUD, day/evening cycle, all integrations
│   ├── World.js      # Farm environment (terrain, trees, coop, fence, arch, decor)
│   ├── Player.js     # Farm kid character + third-person camera + controls
│   ├── Obi.js        # Dachshund AI (wander/chase/flee/tagged) + exclamation marker
│   ├── Chicken.js    # 6 chickens with wandering/fleeing behavior + names
│   ├── Skunk.js      # Skunk with evening appearance + spray mechanic
│   ├── Sound.js      # Procedural Web Audio sound effects (7 sounds)
│   ├── Effects.js    # 7 particle systems (feathers, hearts, sad faces, stink, dust, confetti, fireflies)
│   ├── MiniMap.js    # 2D radar canvas with entity tracking
│   └── Visual.js     # Visual polish: toon gradient, sky dome, blob shadows, outlines, pollen, wind
├── index.html        # Game UI, HUD, touch controls, overlays
├── package.json
└── vite.config.js
```

---

## 🎯 Game Design Notes

- **Target audience:** Ages 5+ — simple controls, bright colors, friendly characters
- **Session length:** ~2 minutes per round (20s morning + 25s afternoon + evening)
- **Win condition:** Tag Obi 3 times
- **Lose condition:** Obi catches 3 chickens
- **Skunk adds evening tension** — player must balance chasing Obi with avoiding the skunk
- **No violence, no scary content** — Obi gets stunned, chickens sit down sadly, skunk sprays with comedic effect
- **Mobile-first touch controls** — joystick, sprint button, tap-to-tag
- **Everything is procedural** — no downloads, no asset loading, instant play

---

## 📸 Screenshots

Screenshots are in the `screenshots/` directory, captured via Playwright headless Chromium with SwiftShader WebGL2.

---

*Built 2026-06-19 — A 3D farm adventure for young players.*
*v1.0.0: Core game · v2.0.0: 10 GUI improvements · v3.0.0: 10 visual polish upgrades*