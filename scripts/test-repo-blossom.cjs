const http = require('http');

function fetchJson(url) {
  return new Promise((resolve) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
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

async function simulate(options) {
  const { catRadius = 1950, fanSpanMultiplier = 1.0 } = options;
  const categories = await fetchJson('http://localhost:4000/api/categories');
  const repositories = await fetchJson('http://localhost:4000/api/repositories');

  const catCount = categories.length;
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
      collisionRadius: 55,
      x, y, z,
      angle
    });
  });

  // 2. SubCategories & Repositories
  categories.forEach((cat, catIdx) => {
    const parent = nodeObjects.find(n => n.id === cat.id);
    if (!parent) return;

    const subs = cat.subCategories || [{ id: `sub-${cat.id}`, name: `${cat.name} General`, slug: 'general' }];
    const subCount = subs.length;

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

    const catPhaseOffset = (catIdx * 0.43) % (Math.PI * 2);
    const angleStep = (Math.PI * 2) / subCount;

    subs.forEach((sub, subIdx) => {
      const subAngle = catPhaseOffset + subIdx * angleStep;
      const subLane = subCount > 8 ? (subIdx % 3) : (subCount > 4 ? (subIdx % 2) : 0);
      const subDist = subCount <= 4 
        ? 200 
        : (subCount <= 8 ? (220 + subLane * 110) : (220 + subLane * 125));

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
      edgeObjects.push({ source: parent.id, target: sub.id });

      // Repositories for this SubCategory
      const subRepos = catRepos.filter(r => r.assignedSubId === sub.id);
      const rCount = subRepos.length;

      // BLOSSOM FAN FORMATION:
      // Instead of 1-line skewer, spread repos in an arc around the sub-group pointing outward!
      // The available sector for this sub-group is angleStep.
      // We bound the fan span to at most 70% of angleStep so it never intrudes on sibling sub-groups.
      const maxFanSpan = Math.min(1.2, Math.max(0.35, angleStep * 0.72)) * fanSpanMultiplier;

      subRepos.forEach((repo, rIdx) => {
        let repoAngle = subAngle;
        if (rCount > 1) {
          // Spread across [-maxFanSpan/2, +maxFanSpan/2]
          const t = (rIdx / (rCount - 1)) - 0.5; // from -0.5 to +0.5
          repoAngle = subAngle + t * maxFanSpan;
        }

        // Alternating / 2-tier orbital shell distances from sub-group
        // If rCount > 3, use 2 alternating distance shells (80px and 145px) so adjacent repos have huge clearance
        const rTier = rCount > 2 ? (rIdx % 2) : 0;
        const repoDist = rCount <= 2 ? 85 : (rTier === 0 ? 82 : 148);

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
        edgeObjects.push({ source: sub.id, target: repo.id });
      });
    });
  });

  // Calculate Metrics
  const nodeMap = new Map(nodeObjects.map(n => [n.id, n]));

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

  let nodeOverlaps = 0;
  let minSubRepoDist = Infinity;
  let minRepoRepoDist = Infinity;
  let minSubSubDist = Infinity;
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

  return {
    edgeCrossings,
    nodeOverlaps,
    minSubRepoDist: parseFloat(minSubRepoDist.toFixed(1)),
    minRepoRepoDist: parseFloat(minRepoRepoDist.toFixed(1)),
    minSubSubDist: parseFloat(minSubSubDist.toFixed(1)),
    crossingSamples,
    overlapSamples
  };
}

async function main() {
  console.log('Testing fanSpanMultiplier = 1.0:');
  const res1 = await simulate({ catRadius: 1950, fanSpanMultiplier: 1.0 });
  console.log(JSON.stringify(res1, null, 2));

  console.log('Testing fanSpanMultiplier = 0.85:');
  const res2 = await simulate({ catRadius: 1950, fanSpanMultiplier: 0.85 });
  console.log(JSON.stringify(res2, null, 2));

  console.log('Testing fanSpanMultiplier = 1.15:');
  const res3 = await simulate({ catRadius: 1950, fanSpanMultiplier: 1.15 });
  console.log(JSON.stringify(res3, null, 2));
}

main();
