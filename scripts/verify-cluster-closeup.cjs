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

  // 1. Focus on AI Agent Skills & Tools (has subs with 4, 6, 8 repos)
  await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cat = nodes.find(n => n.type === 'category' && n.name.includes('AI Agent Skills'));
    if (!cat) return;

    const controls = window.__threeGalaxy.controls;
    const camera = window.__threeGalaxy.camera;
    controls.target.set(cat.x, 0, cat.z);
    camera.position.set(cat.x, 1400, cat.z + 5);
    controls.update();
  });
  await page.waitForTimeout(1000);

  const skillsTopDownPath = path.join(ARTIFACT_DIR, 'fe_galaxy_skills_blossom_topdown.png');
  await page.screenshot({ path: skillsTopDownPath });
  console.log('1. Skills topdown saved to:', skillsTopDownPath);

  // 2. Focus on AI Agent Frameworks (the one in user's image)
  await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cat = nodes.find(n => n.type === 'category' && n.name.includes('AI Agent Frameworks'));
    if (!cat) return;

    const controls = window.__threeGalaxy.controls;
    const camera = window.__threeGalaxy.camera;
    controls.target.set(cat.x, 0, cat.z);
    camera.position.set(cat.x, 1400, cat.z + 5);
    controls.update();
  });
  await page.waitForTimeout(1000);

  const frameworksTopDownPath = path.join(ARTIFACT_DIR, 'fe_galaxy_frameworks_blossom_topdown.png');
  await page.screenshot({ path: frameworksTopDownPath });
  console.log('2. Frameworks topdown saved to:', frameworksTopDownPath);

  // 3. 3D Angled view of AI Agent Skills
  await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cat = nodes.find(n => n.type === 'category' && n.name.includes('AI Agent Skills'));
    if (!cat) return;
    const controls = window.__threeGalaxy.controls;
    const camera = window.__threeGalaxy.camera;
    controls.target.set(cat.x, 0, cat.z);
    camera.position.set(cat.x, 700, cat.z + 800);
    controls.update();
  });
  await page.waitForTimeout(1000);

  const skills3DPath = path.join(ARTIFACT_DIR, 'fe_galaxy_skills_blossom_3d.png');
  await page.screenshot({ path: skills3DPath });
  console.log('3. Skills 3D saved to:', skills3DPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
