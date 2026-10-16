const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

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

async function run() {
  const categories = await fetchJson('http://localhost:4000/api/categories');
  const repositories = await fetchJson('http://localhost:4000/api/repositories');

  console.log(`Loaded ${categories.length} categories, ${repositories.length} repositories`);

  // Try Omni-directional (360-degree) Layout
  const catCount = categories.length;
  // Make catRadius generous enough so 360-degree islands have lots of space between each other
  const catRadius = Math.max(2400, 1500 + catCount * 110); // ~3040px
  const yElevations = [-60, 60, -50, 70];

  const nodeObjects = [];
  const edgeObjects = [];

  // 1. Categories
  categories.forEach((cat, idx) => {
    const angle = (idx / catCount) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * catRadius;
    const z = Math.sin(angle) * catRadius;
    const y = yElevations[idx % yElevations.length];

    nodeObjects.push({
      id: cat.id,
      name: cat.name,
      type: 'category',
      baseSize: 32,
      collisionRadius: 55,
      x, y, z,
      angle
    });
  });

  // 2. SubCategories & Repositories - Full 360-degree bloom around Category Sun
  categories.forEach((cat, catIdx) => {
    const parent = nodeObjects.find(n => n.id === cat.id);
    if (!parent) return;

    const subs = cat.subCategories || [{ id: `sub-${cat.id}`, name: `${cat.name} General`, slug: 'general' }];
    const subCount = subs.length;

    // Filter and normalize repos belonging to this category
    const catRepos = repositories.filter(r => {
      if (r.subCategoryId && subs.some(s => s.id === r.subCategoryId)) return true;
      if (r.categoryId === cat.id) return true;
      return false;
    });

    let unattachedIndex = 0;
    catRepos.forEach(r => {
      if (!r.subCategoryId || !subs.some(s => s.id === r.subCategoryId)) {
        r.assignedSubId = subs[unattachedIndex % subs.length].id;
        unattachedIndex++;
      } else {
        r.assignedSubId = r.subCategoryId;
      }
    });

    // 360-degree bloom: subcategories distributed evenly around the full 2*PI circle!
    // Offset each category slightly so they don't look completely identical
    const catPhaseOffset = (catIdx * 0.43) % (Math.PI * 2);
    const angleStep = (Math.PI * 2) / subCount;

    subs.forEach((sub, subIdx) => {
      const subAngle = catPhaseOffset + subIdx * angleStep;

      // Tiering distance from Category Sun
      // For large clusters (>8 subs, e.g. AI Agent Frameworks with 18 subs): 3 tiers
      // For medium clusters (>4 subs): 2 tiers
      // For small clusters (<=4 subs): 1 tier
      const subLane = subCount > 8 ? (subIdx % 3) : (subCount > 4 ? (subIdx % 2) : 0);
      const subDist = subCount <= 4 
        ? 200 
        : (subCount <= 8 ? (220 + subLane * 110) : (220 + subLane * 125)); // 220px, 345px, 470px

      const sx = parent.x + Math.cos(subAngle) * subDist;
      const sz = parent.z + Math.sin(subAngle) * subDist;
      const sy = parent.y + (subLane === 0 ? 35 : (subLane === 1 ? -35 : 15));

      const subNode = {
        id: sub.id,
        name: sub.name,
        type: 'subCategory',
        catId: cat.id,
        collisionRadius: 36,
        x: sx,
        y: sy,
        z: sz,
        subAngle
      };
      nodeObjects.push(subNode);
      edgeObjects.push({ source: parent.id, target: sub.id, type: 'cat-sub' });

      // Repositories for this SubCategory
      const subRepos = catRepos.filter(r => r.assignedSubId === sub.id);
      const rCount = subRepos.length;

      // Allow small angular offset within the sub's exclusive sector
      // Half-sector width is angleStep / 2. We keep repo deviation well within 25% of that.
      const maxWiggle = Math.min(0.08, (angleStep / 2) * 0.4);

      subRepos.forEach((repo, rIdx) => {
        // Staggered outward spine: each repo extends further outward along the ray corridor
        const repoDist = 72 + rIdx * 56;
        const repoAngle = subAngle + (rCount > 1 ? (rIdx % 2 === 0 ? maxWiggle : -maxWiggle) : 0);

        const rx = sx + Math.cos(repoAngle) * repoDist;
        const rz = sz + Math.sin(repoAngle) * repoDist;
        const ry = sy + (rIdx % 2 === 0 ? -22 : 22);

        const repoNode = {
          id: repo.id,
          name: repo.name || repo.fullName,
          type: 'repository',
          subCatId: sub.id,
          catId: cat.id,
          collisionRadius: 26,
          x: rx,
          y: ry,
          z: rz
        };
        nodeObjects.push(repoNode);
        edgeObjects.push({ source: sub.id, target: repo.id, type: 'sub-repo' });
      });
    });
  });

  // Calculate Metrics
  const nodeMap = new Map(nodeObjects.map(n => [n.id, n]));

  // 1. Edge Crossings
  let edgeCrossings = 0;
  const crossingSamples = [];
  for (let i = 0; i < edgeObjects.length; i++) {
    for (let j = i + 1; j < edgeObjects.length; j++) {
      const e1 = edgeObjects[i];
      const e2 = edgeObjects[j];
      const s1 = nodeMap.get(e1.source);
      const t1 = nodeMap.get(e1.target);
      const s2 = nodeMap.get(e2.source);
      const t2 = nodeMap.get(e2.target);

      if (lineIntersects(s1, t1, s2, t2)) {
        edgeCrossings++;
        if (crossingSamples.length < 10) {
          crossingSamples.push({
            e1: `${s1.name} (${s1.type}) -> ${t1.name} (${t1.type})`,
            e2: `${s2.name} (${s2.type}) -> ${t2.name} (${t2.type})`
          });
        }
      }
    }
  }

  // 2. Node Overlaps
  let nodeOverlaps = 0;
  let minSubRepoDist = Infinity;
  let minRepoRepoDist = Infinity;
  let minSubSubDist = Infinity;
  let minCatSubDist = Infinity;
  let minCatCatDist = Infinity;
  const overlapSamples = [];

  for (let i = 0; i < nodeObjects.length; i++) {
    for (let j = i + 1; j < nodeObjects.length; j++) {
      const a = nodeObjects[i];
      const b = nodeObjects[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      const required = a.collisionRadius + b.collisionRadius;

      if ((a.type === 'subCategory' && b.type === 'repository') || (a.type === 'repository' && b.type === 'subCategory')) {
        if (distXZ < minSubRepoDist) minSubRepoDist = distXZ;
      }
      if (a.type === 'repository' && b.type === 'repository') {
        if (distXZ < minRepoRepoDist) minRepoRepoDist = distXZ;
      }
      if (a.type === 'subCategory' && b.type === 'subCategory') {
        if (distXZ < minSubSubDist) minSubSubDist = distXZ;
      }
      if ((a.type === 'category' && b.type === 'subCategory') || (a.type === 'subCategory' && b.type === 'category')) {
        if (distXZ < minCatSubDist) minCatSubDist = distXZ;
      }
      if (a.type === 'category' && b.type === 'category') {
        if (distXZ < minCatCatDist) minCatCatDist = distXZ;
      }

      if (distXZ < required) {
        nodeOverlaps++;
        if (overlapSamples.length < 10) {
          overlapSamples.push({
            a: `${a.name} (${a.type})`,
            b: `${b.name} (${b.type})`,
            distXZ: parseFloat(distXZ.toFixed(1)),
            required
          });
        }
      }
    }
  }

  console.log('Results for Omni-Directional 360 Layout:');
  console.log({
    totalNodes: nodeObjects.length,
    totalEdges: edgeObjects.length,
    edgeCrossings,
    nodeOverlaps,
    minSubRepoDist: parseFloat(minSubRepoDist.toFixed(1)),
    minRepoRepoDist: parseFloat(minRepoRepoDist.toFixed(1)),
    minSubSubDist: parseFloat(minSubSubDist.toFixed(1)),
    minCatSubDist: parseFloat(minCatSubDist.toFixed(1)),
    minCatCatDist: parseFloat(minCatCatDist.toFixed(1)),
    crossingSamples,
    overlapSamples
  });
}

run();

