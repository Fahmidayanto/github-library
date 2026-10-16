const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3055...');
  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForFunction(() => !!window.__threeGalaxy && window.__threeGalaxy.nodeObjects.length > 0);
  await page.waitForTimeout(1000);

  // 1. Take full overview screenshot
  const overviewPath = path.join(ARTIFACT_DIR, 'fe_galaxy_zero_crossing_overview.png');
  await page.screenshot({ path: overviewPath });
  console.log('1. Overview saved to:', overviewPath);

  // 2. Click the sun button for AI Agent Frameworks to highlight the cluster
  const sunBtns = page.locator('button[title*="Highlight Grup AI Agent Frameworks"]');
  if (await sunBtns.count() > 0) {
    await sunBtns.first().click();
    await page.waitForTimeout(1200);
  } else {
    // Fallback click first sun button
    await page.locator('button:has-text("☀️")').first().click();
    await page.waitForTimeout(1200);
  }

  const highlightPath = path.join(ARTIFACT_DIR, 'fe_galaxy_zero_crossing_cluster_highlight.png');
  await page.screenshot({ path: highlightPath });
  console.log('2. Highlight saved to:', highlightPath);

  // 3. Switch to top-down view via Kontrol Kamera dropdown
  await page.click('#cameraControlsDropdownBtn');
  await page.waitForTimeout(400);
  await page.click('#topDownCameraBtn');
  await page.waitForTimeout(1500);

  const topDownPath = path.join(ARTIFACT_DIR, 'fe_galaxy_zero_crossing_top_down.png');
  await page.screenshot({ path: topDownPath });
  console.log('3. Top-down saved to:', topDownPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
