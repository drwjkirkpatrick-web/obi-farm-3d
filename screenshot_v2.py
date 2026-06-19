#!/usr/bin/env python3
"""
Screenshot generator v3 for Obi's Farm Adventure 3D with all 10 improvements.
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
            args=['--use-gl=angle','--use-angle=swiftshader',
                  '--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
        )
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))

        print("Loading game...")
        await page.goto('http://localhost:4099', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)

        # Screenshot 1: Title screen
        print("📸 01: Title screen")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-01-title.png')

        # Click Play
        print("Clicking Play...")
        await page.click('#start-btn')
        await page.wait_for_timeout(3000)

        # Screenshot 2: Morning farm with minimap
        print("📸 02: Morning farm + minimap")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-02-morning-minimap.png')

        # Move forward and look around
        print("Moving W for 3s...")
        await page.keyboard.down('KeyW')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyW')
        await page.wait_for_timeout(500)

        print("📸 03: Exploring farm")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-03-exploring.png')

        # Sprint to find Obi
        print("Sprinting Shift+W for 4s...")
        await page.keyboard.down('ShiftLeft')
        await page.keyboard.down('KeyW')
        await page.wait_for_timeout(4000)
        await page.keyboard.up('KeyW')
        await page.keyboard.up('ShiftLeft')
        await page.wait_for_timeout(500)

        print("📸 04: Sprinting with dust trail")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-04-dust-trail.png')

        # Move towards Obi and tag
        print("Moving towards Obi (W+D) for 3s...")
        await page.keyboard.down('KeyW')
        await page.keyboard.down('KeyD')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyW')
        await page.keyboard.up('KeyD')
        await page.wait_for_timeout(500)

        print("📸 05: Near Obi with exclamation marker")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-05-obi-marker.png')

        # Tag Obi
        print("Pressing Space to tag...")
        await page.keyboard.press('Space')
        await page.wait_for_timeout(1500)

        print("📸 06: After tag - hearts!")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-06-hearts.png')

        # Wait for evening (need ~45s game time, we've used ~15s)
        print("Wandering to pass time for evening...")
        for _ in range(8):
            await page.keyboard.down('KeyW')
            await page.wait_for_timeout(3000)
            await page.keyboard.up('KeyW')
            await page.keyboard.down('KeyS')
            await page.wait_for_timeout(2000)
            await page.keyboard.up('KeyS')

        print("📸 07: Evening with skunk + fireflies + banner")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-07-evening.png')

        # Move around in evening
        await page.keyboard.down('KeyA')
        await page.wait_for_timeout(3000)
        await page.keyboard.up('KeyA')
        await page.wait_for_timeout(500)

        print("📸 08: Evening farm exploration")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-08-evening-explore.png')

        # Try to find and sprint near skunk
        print("Sprinting in evening...")
        await page.keyboard.down('ShiftLeft')
        await page.keyboard.down('KeyD')
        await page.wait_for_timeout(4000)
        await page.keyboard.up('KeyD')
        await page.keyboard.up('ShiftLeft')
        await page.wait_for_timeout(500)

        print("📸 09: Evening sprint")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-09-evening-sprint.png')

        # Final
        await page.wait_for_timeout(2000)
        print("📸 10: Final state")
        await page.screenshot(path=f'{SCREENSHOT_DIR}/v2-10-final.png')

        if errors:
            print(f"\n⚠️ {len(errors)} errors:")
            for e in errors[:5]:
                print(f"  {e}")
        else:
            print("\n✅ No errors!")

        await browser.close()
        print("\n✅ All screenshots captured!")

asyncio.run(main())