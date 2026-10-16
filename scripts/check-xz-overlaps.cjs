const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForFunction(() => !!window.__threeGalaxy && window.__threeGalaxy.nodeObjects.length > 0);
  
  const info = await page.evaluate(() => {
    const nodes = window.__threeGalaxy.nodeObjects;
    const cats = nodes.filter(n => n.type === 'category');
    const subs = nodes.filter(n => n.type === 'subCategory');
    const repos = nodes.filter(n => n.type === 'repository');
    
    let minSubRepoDist = Infinity;
    let minRepoRepoDist = Infinity;
    let minSubSubDist = Infinity;
    let subRepoOverlaps = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);

        const rA = a.collisionRadius || 36;
        const rB = b.collisionRadius || 36;
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
          subRepoOverlaps.push({ 
            a: a.name, 
            typeA: a.type, 
            b: b.name, 
            typeB: b.type, 
            distXZ: parseFloat(distXZ.toFixed(1)), 
            required 
          });
        }
      }
    }

    return {
      total: nodes.length,
      cats: cats.length,
      subs: subs.length,
      repos: repos.length,
      minSubRepoDist: parseFloat(minSubRepoDist.toFixed(1)),
      minRepoRepoDist: parseFloat(minRepoRepoDist.toFixed(1)),
      minSubSubDist: parseFloat(minSubSubDist.toFixed(1)),
      overlapCount: subRepoOverlaps.length,
      sampleOverlaps: subRepoOverlaps.slice(0, 15)
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
