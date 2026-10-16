const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

function ccw(A, B, C) {
  return (C.z - A.z) * (B.x - A.x) > (B.z - A.z) * (C.x - A.x);
}

function lineIntersects(A, B, C, D) {
  // Check if they share endpoints
  if ((A.x === C.x && A.z === C.z) || (A.x === D.x && A.z === D.z) ||
      (B.x === C.x && B.z === C.z) || (B.x === D.x && B.z === D.z)) {
    return false;
  }
  return (ccw(A, C, D) !== ccw(B, C, D)) && (ccw(A, B, C) !== ccw(A, B, D));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForFunction(() => !!window.__threeGalaxy && window.__threeGalaxy.nodeObjects.length > 0);
  await page.waitForTimeout(1000);

  const results = await page.evaluate(() => {
    function ccw(A, B, C) {
      return (C.z - A.z) * (B.x - A.x) > (B.z - A.z) * (C.x - A.x);
    }
    function lineIntersects(A, B, C, D) {
      if ((A.x === C.x && A.z === C.z) || (A.x === D.x && A.z === D.z) ||
          (B.x === C.x && B.z === C.z) || (B.x === D.x && B.z === D.z)) {
        return false;
      }
      return (ccw(A, C, D) !== ccw(B, C, D)) && (ccw(A, B, C) !== ccw(A, B, D));
    }

    const nodes = window.__threeGalaxy.nodeObjects;
    const edges = window.__threeGalaxy.edgeObjects;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Focus on Category-Tree edges (category -> subCategory, subCategory -> repository, and repo -> repo dendritic root edges)
    const treeEdges = edges.filter(e => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      return (src?.type === 'category' && tgt?.type === 'subCategory') ||
             (src?.type === 'subCategory' && tgt?.type === 'repository') ||
             (src?.type === 'repository' && tgt?.type === 'repository');
    });

    let totalCrossings = 0;
    const crossingsList = [];

    for (let i = 0; i < treeEdges.length; i++) {
      for (let j = i + 1; j < treeEdges.length; j++) {
        const e1 = treeEdges[i];
        const e2 = treeEdges[j];
        const s1 = nodeMap.get(e1.source);
        const t1 = nodeMap.get(e1.target);
        const s2 = nodeMap.get(e2.source);
        const t2 = nodeMap.get(e2.target);
        if (!s1 || !t1 || !s2 || !t2) continue;

        if (lineIntersects(s1, t1, s2, t2)) {
          totalCrossings++;
          if (crossingsList.length < 20) {
            crossingsList.push({
              edge1: `${s1.name} (${s1.type}) -> ${t1.name} (${t1.type})`,
              edge2: `${s2.name} (${s2.type}) -> ${t2.name} (${t2.type})`,
            });
          }
        }
      }
    }

    return {
      treeEdgeCount: treeEdges.length,
      totalCrossings,
      samples: crossingsList
    };
  });

  console.log('Edge Crossings in Current Layout:');
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();

