const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForFunction(() => !!window.__threeGalaxy && window.__threeGalaxy.nodeObjects.length > 0);
  await page.waitForTimeout(1000);

  // Click sun button for AI Agent Frameworks to highlight its connections
  const sunBtns = page.locator('button[title*="Highlight Grup AI Agent Frameworks"]');
  if (await sunBtns.count() > 0) {
    await sunBtns.first().click();
    await page.waitForTimeout(600);
  }

  // Collapse sidebar to see full canvas
  await page.keyboard.press('Control+b');
  await page.waitForTimeout(500);

  // Focus camera directly on AI Agent Frameworks cluster from top
  await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cat = nodes.find(n => n.type === 'category' && n.name.includes('AI Agent Frameworks'));
    if (!cat) return;

    // Move controls target to this cluster center
    const controls = window.__threeGalaxy.controls;
    const camera = window.__threeGalaxy.camera;
    controls.target.set(cat.x, 0, cat.z);
    camera.position.set(cat.x, 1600, cat.z + 5);
    controls.update();
  });
  await page.waitForTimeout(1200);

  const clusterZoomPath = path.join(ARTIFACT_DIR, 'fe_galaxy_cluster_closeup_topdown.png');
  await page.screenshot({ path: clusterZoomPath });
  console.log('Closeup topdown saved to:', clusterZoomPath);

  // Also take angled 3D view of the cluster
  await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cat = nodes.find(n => n.type === 'category' && n.name.includes('AI Agent Frameworks'));
    if (!cat) return;
    const controls = window.__threeGalaxy.controls;
    const camera = window.__threeGalaxy.camera;
    controls.target.set(cat.x, 0, cat.z);
    camera.position.set(cat.x, 850, cat.z + 1100);
    controls.update();
  });
  await page.waitForTimeout(1200);

  const cluster3DPath = path.join(ARTIFACT_DIR, 'fe_galaxy_cluster_closeup_3d.png');
  await page.screenshot({ path: cluster3DPath });
  console.log('Closeup 3D saved to:', cluster3DPath);

  await browser.close();
  console.log('Done!');
})();
