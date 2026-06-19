# 🐶 Obi's Farm Adventure — 3D

**A charming 3D farm game where you catch Obi the dachshund before he catches the chickens!**

Built with Three.js — pure procedural 3D geometry, no external assets needed.
Runs in any modern browser, desktop or mobile.

## 🎮 How to Play

- **Goal:** Tag Obi 3 times to catch him and save the chickens!
- **Don't let Obi catch 3 chickens** or the game is over.
- **Watch out for the skunk** — it comes out in the evening and will spray you if you get too close!
- **Score points** for surviving, tagging Obi, and keeping chickens safe.

### Controls

| Platform | Move | Sprint | Tag Obi |
|----------|------|--------|---------|
| 🖥️ Desktop | WASD / Arrow Keys | Shift | Space (when near Obi) |
| 📱 Mobile | Joystick (bottom-left) | 💨 button (bottom-right) | Tap near Obi |

## 🌾 The Farm

The world features:
- **Chicken coop** with nesting boxes, ramp, and weather vane
- **Blackberry rows** on trellises with ripe berries
- **Meadow** with wildflowers (yellow, pink, purple, white, orange)
- **Maple trees** lining the dirt road (red-orange autumn canopy)
- **Dirt road** running along the north edge
- **Hay bales** scattered as obstacles
- **Sunflowers, pumpkins, and rocks** for farm charm
- **Wooden fence** enclosing the entire property
- **Clouds** drifting across the sky
- **Day/evening cycle** — morning → afternoon → evening (skunk appears!)

## 🐾 Characters

### Obi the Dachshund
- Long body, floppy ears, red collar
- AI states: **wander** → **chase** (nearest chicken) → **flee** (from player)
- Gets stunned for 4 seconds when tagged
- Legs animate, tail wags, ears flap when running

### The Chickens (6)
- Henrietta, Buttercup, Daisy, Penny, Goldie, Pecky
- Each with unique color: white, golden, brown, cream, dark brown, buff
- Wander peacefully, flee when Obi approaches
- Wing flap animation when scared
- Comb, beak, and tail feathers

### The Skunk
- Black body with white stripe and bushy tail
- Appears in the evening
- Wanders the farm — if you get too close, it raises its tail and sprays!
- 3-second stun + score penalty if sprayed
- 8-second cooldown between sprays

### The Player
- Farm kid with straw hat, red shirt, blue overalls, brown boots
- Third-person camera that smoothly follows
- Walking and running animations with arm/leg swing
- Yellow ring appears when close enough to tag Obi

## 🛠️ Tech Stack

- **Three.js** r169 — 3D rendering, lighting, shadows
- **Vite** 5 — build tooling and dev server
- **Pure procedural geometry** — every tree, building, and character is built from Three.js primitives
- No image assets, no model files — everything is code-generated

## 📦 Build & Run

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## 📁 Project Structure

```
obi-farm-3d/
├── src/
│   ├── main.js       # Game loop, states, HUD, day/evening cycle
│   ├── World.js      # Farm environment (terrain, trees, coop, fence, etc.)
│   ├── Player.js     # Farm kid character + camera + controls
│   ├── Obi.js        # Dachshund AI (chase/flee/wander)
│   ├── Chicken.js    # Chicken entities with fleeing behavior
│   └── Skunk.js      # Skunk entity with spray mechanic
├── index.html        # Game UI, HUD, touch controls, overlays
├── package.json
└── vite.config.js
```

## 🎯 Game Design Notes

- **Target audience:** Ages 5+ — simple controls, bright colors, friendly characters
- **Session length:** ~2 minutes per round (day cycle: 30s morning + 30s afternoon + evening)
- **Win condition:** Tag Obi 3 times
- **Lose condition:** Obi catches 3 chickens
- **Skunk adds evening tension** — player must balance chasing Obi with avoiding the skunk
- **No violence, no scary content** — Obi just gets stunned, chickens just get "caught" (sit down sadly)

---
*Built 2026-06-19 — A 3D farm adventure for young players.*