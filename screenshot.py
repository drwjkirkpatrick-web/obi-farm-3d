#!/usr/bin/env python3
"""
Screenshot generator v2 for Obi's Farm Adventure 3D.
Clicks Play first, then captures gameplay screenshots with WebGL.
"""
import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/home/walker/projects/obi-farm-3d/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--use-gl=angle',
                '--use-angle=swiftshader',
                '--enable-unsafe-swiftshader',
                '--ignore-gpu-blocklist',
                '--no-sandbox',
                '--enable-webgl',
            ]
        )
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        # Collect errors
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.on('console', lambda msg: errors.append(f'{msg.type}: {msg.text}') if msg.type == 'error' else None)

        print("Loading game...")
        await page.goto('http://localhost:4099', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)

        # Screenshot 1: Title screen
        print("📸 01: Title screen")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/01-title-screen.png')

        # Click Play
        print("Clicking Play...")
        await page.click('#start-btn')
        await page.wait_for_timeout(3000)

        # Check WebGL status
        gl_status = await page.evaluate('''() => {
            const c = document.querySelector('canvas');
            if (!c) return 'no canvas found';
            const gl = c.getContext('webgl2') || c.getContext('webgl');
            if (!gl) return 'canvas exists but no WebGL context';
            return 'WebGL: ' + gl.getParameter(gl.VERSION) + ' size: ' + c.width + 'x' + c.height;
        }''')
        print(f"WebGL: {gl_status}")

        # Screenshot 2: Morning farm
        print("📸 02: Morning farm")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/02-morning-farm.png')

        # Move forward (W) to explore
        print("Moving W for 3s...")
        await page.keyboard.down('KeyW')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyW')
        await page.wait_for_timeout(500)

        print("📸 03: Exploring farm")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/03-exploring-farm.png')

        # Turn right and move (D + W)
        print("Moving W+D for 3s...")
        await page.keyboard.down('KeyW')
        await page.keyboard.down('KeyD')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyW')
        await page.keyboard.up('KeyD')
        await page.wait_for_timeout(500)

        print("📸 04: Chasing Obi")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/04-chasing-obi.png')

        # Sprint towards Obi
        print("Sprinting Shift+W for 3s...")
        await page.keyboard.down('ShiftLeft')
        await page.keyboard.down('KeyW')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyW')
        await page.keyboard.up('ShiftLeft')
        await page.wait_for_timeout(500)

        print("📸 05: Close encounter")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/05-close-encounter.png')

        # Tag attempt
        print("Pressing Space to tag...")
        await page.keyboard.press('Space')
        await page.wait_for_timeout(1500)

        print("📸 06: After tag")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/06-tagged-obi.png')

        # Wander and wait for evening (~60s game time)
        print("Wandering to pass time...")
        for _ in range(6):
            await page.keyboard.down('KeyW')
            await page.wait_for_timeout(3000)
            await page.keyboard.up('KeyW')
            await page.keyboard.down('KeyS')
            await page.wait_for_timeout(2000)
            await page.keyboard.up('KeyS')

        print("📸 07: Evening with skunk")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/07-evening-skunk.png')

        # Move left to look for skunk
        await page.keyboard.down('KeyA')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyA')
        await page.wait_for_timeout(500)

        print("📸 08: Evening farm")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/08-evening-farm.png')

        # Move around more
        await page.keyboard.down('ShiftLeft')
        await page.keyboard.down('KeyD')
        await page.wait_for_timeout(4000)
        await page.keyboard.up('KeyD')
        await page.keyboard.up('ShiftLeft')
        await page.wait_for_timeout(500)

        print("📸 09: Panorama view")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/09-farm-panorama.png')

        # Final
        await page.wait_for_timeout(2000)
        print("📸 10: Final state")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/10-final-state.png')

        if errors:
            print("\n⚠️ Errors detected:")
            for e in errors[:10]:
                print(f"  {e}")
        else:
            print("\n✅ No errors detected")

        await browser.close()
        print("\n✅ All screenshots captured!")

asyncio.run(main())