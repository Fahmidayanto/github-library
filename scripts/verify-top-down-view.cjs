const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12';

(async () => {
  console.log('[Playwright] Starting browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  console.log('[Playwright] Navigating to http://localhost:3055...');
  await page.goto('http://localhost:3055', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('[Playwright] Switching to 3D Galaxy Graph view...');
  const graphButton = page.locator('button:has-text("3D Galaxy Graph")');
  await graphButton.waitFor({ state: 'visible', timeout: 10000 });
  await graphButton.click();

  console.log('[Playwright] Waiting for __threeGalaxy scene...');
  await page.waitForFunction(() => !!window.__threeGalaxy && !!window.__threeGalaxy.nodeObjects && window.__threeGalaxy.nodeObjects.length > 0, { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Open Camera Controls Dropdown
  console.log('[Playwright] Clicking Camera Controls Dropdown...');
  const cameraBtn = page.locator('#cameraControlsDropdownBtn');
  await cameraBtn.click();
  await page.waitForTimeout(400);

  // 2. Click Top-Down Camera View
  console.log('[Playwright] Clicking Top-Down Camera View button...');
  const topDownBtn = page.locator('#topDownCameraBtn');
  await topDownBtn.waitFor({ state: 'visible', timeout: 5000 });
  await topDownBtn.click();

  // Wait for camera fly animation to finish
  console.log('[Playwright] Waiting for camera fly animation (1.6s)...');
  await page.waitForTimeout(1800);

  // Take screenshot with sidebar open
  const shot1 = path.join(ARTIFACT_DIR, 'fe_galaxy_top_down_view.png');
  await page.screenshot({ path: shot1 });
  console.log(`[Playwright] Top-down screenshot with sidebar saved: ${shot1}`);

  // 3. Collapse sidebar for full unobstructed top-down view
  console.log('[Playwright] Collapsing sidebar for unobstructed top-down overview...');
  const collapseBtn = page.locator('#collapseFiltersBtn');
  if (await collapseBtn.isVisible()) {
    await collapseBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  const shot2 = path.join(ARTIFACT_DIR, 'fe_galaxy_top_down_fullscreen.png');
  await page.screenshot({ path: shot2 });
  console.log(`[Playwright] Fullscreen top-down screenshot saved: ${shot2}`);

  // 4. Verify overlap in top-down coordinates
  const overlapStats = await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    let overlaps = 0;
    let minSubRepoDist = Infinity;
    let minRepoRepoDist = Infinity;
    let minSubSubDist = Infinity;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const rA = a.collisionRadius || 30;
        const rB = b.collisionRadius || 30;
        const required = rA + rB;

        if ((a.type === 'subCategory' && b.type === 'repository') || (a.type === 'repository' && b.type === 'subCategory')) {
          if (distXZ < minSubRepoDist) minSubRepoDist = distXZ;
        }
        if (a.type === 'repository' && b.type === 'repository') {
          if (distXZ < minRepoRepoDist) minRepoRepoDist = distXZ;
        }
        if (a.type === 'subCategory' && b.type === 'subCategory') {
          if (distXZ < minSubSubDist) minSubSubDist = distXZ;
        }

        if (distXZ < required) {
          overlaps++;
        }
      }
    }

    return {
      totalNodes: nodes.length,
      overlaps,
      minSubRepoDist: parseFloat(minSubRepoDist.toFixed(1)),
      minRepoRepoDist: parseFloat(minRepoRepoDist.toFixed(1)),
      minSubSubDist: parseFloat(minSubSubDist.toFixed(1)),
      cameraY: Math.round(window.__threeGalaxy.camera.position.y),
      cameraTarget: {
        x: Math.round(window.__threeGalaxy.controls.target.x),
        y: Math.round(window.__threeGalaxy.controls.target.y),
        z: Math.round(window.__threeGalaxy.controls.target.z)
      }
    };
  });

  console.log('[Playwright] Overlap stats verification:', JSON.stringify(overlapStats, null, 2));

  await browser.close();
  console.log('[Playwright] Top-down verification completed successfully.');
})();
