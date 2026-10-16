const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForFunction(() => !!window.__threeGalaxy && window.__threeGalaxy.nodeObjects.length > 0);
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    const edges = window.__threeGalaxy.edgeObjects;
    const nodes = window.__threeGalaxy.nodeObjects;
    const edgeTypes = {};
    const catEdgeStats = {};

    edges.forEach(e => {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      const key = `${src?.type || 'unknown'} -> ${tgt?.type || 'unknown'}`;
      edgeTypes[key] = (edgeTypes[key] || 0) + 1;
    });

    const cats = nodes.filter(n => n.type === 'category');
    cats.forEach(c => {
      const subs = nodes.filter(n => n.type === 'subCategory' && n.catId === c.id);
      const subIds = new Set(subs.map(s => s.id));
      const repos = nodes.filter(n => n.type === 'repository' && subIds.has(n.subCatId));
      catEdgeStats[c.name] = {
        subCount: subs.length,
        repoCount: repos.length
      };
    });

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      edgeTypes,
      catEdgeStats
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();

