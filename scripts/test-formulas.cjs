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

async function testFormula(fnName, formula) {
  const catRadius = 1950;
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

      const subRepos = catRepos.filter(r => r.assignedSubId === sub.id);
      const rCount = subRepos.length;

      subRepos.forEach((repo, rIdx) => {
        const { rx, rz, ry } = formula({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount });

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

  const nodeMap = new Map(nodeObjects.map(n => [n.id, n]));

  let edgeCrossings = 0;
  for (let i = 0; i < edgeObjects.length; i++) {
    for (let j = i + 1; j < edgeObjects.length; j++) {
      const e1 = edgeObjects[i];
      const e2 = edgeObjects[j];
      const s1 = nodeMap.get(e1.source);
      const t1 = nodeMap.get(e1.target);
      const s2 = nodeMap.get(e2.source);
      const t2 = nodeMap.get(e2.target);

      if (lineIntersects(s1, t1, s2, t2)) edgeCrossings++;
    }
  }

  let nodeOverlaps = 0;
  let minSubRepoDist = Infinity;
  let minRepoRepoDist = Infinity;
  const overlapSamples = [];

  for (let i = 0; i < nodeObjects.length; i++) {
    for (let j = i + 1; j < nodeObjects.length; j++) {
      const a = nodeObjects[i];
      const b = nodeObjects[j];
      const distXZ = Math.hypot(b.x - a.x, b.z - a.z);
      const required = a.collisionRadius + b.collisionRadius;

      if ((a.type === 'subCategory' && b.type === 'repository') || (a.type === 'repository' && b.type === 'subCategory')) {
        if (distXZ < minSubRepoDist) minSubRepoDist = distXZ;
      }
      if (a.type === 'repository' && b.type === 'repository') {
        if (distXZ < minRepoRepoDist) minRepoRepoDist = distXZ;
      }

      if (distXZ < required) {
        nodeOverlaps++;
        if (overlapSamples.length < 5) {
          overlapSamples.push({ a: a.name, b: b.name, dist: distXZ.toFixed(1), required });
        }
      }
    }
  }

  console.log(`[${fnName}] crossings: ${edgeCrossings}, overlaps: ${nodeOverlaps}, minSubRepo: ${minSubRepoDist.toFixed(1)}, minRepoRepo: ${minRepoRepoDist.toFixed(1)}`);
  if (overlapSamples.length > 0) {
    console.log('Sample overlaps:', overlapSamples);
  }
}

async function main() {
  // Formula A: Radial Stagger + Progressive Angular Fan (Alternating left/right fan)
  await testFormula('Formula A (Radial Stagger + Alternating Fan)', ({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount }) => {
    if (rCount === 1) {
      const repoDist = 80;
      return {
        rx: sx + Math.cos(subAngle) * repoDist,
        rz: sz + Math.sin(subAngle) * repoDist,
        ry: sy + 15
      };
    }
    // Fan width scales with available sector
    const maxFan = Math.min(0.65, Math.max(0.25, angleStep * 0.65));
    // Alternate left and right:
    // rIdx = 0 -> -offset1
    // rIdx = 1 -> +offset1
    // rIdx = 2 -> -offset2
    // rIdx = 3 -> +offset2
    const side = (rIdx % 2 === 0) ? -1 : 1;
    const pairIndex = Math.floor(rIdx / 2);
    const numPairs = Math.ceil(rCount / 2);
    const angleOffset = (numPairs > 1 ? (0.35 + (pairIndex / (numPairs - 1)) * 0.65) : 0.7) * (maxFan / 2) * side;

    const repoAngle = subAngle + angleOffset;
    // Stagger radial distance so left and right or adjacent pairs never collide
    const repoDist = 78 + pairIndex * 62 + (rIdx % 2) * 28;

    return {
      rx: sx + Math.cos(repoAngle) * repoDist,
      rz: sz + Math.sin(repoAngle) * repoDist,
      ry: sy + (rIdx % 2 === 0 ? -22 : 22)
    };
  });

  // Formula B: Multi-tier Petal Arc
  await testFormula('Formula B (Multi-tier Petal Arc)', ({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount }) => {
    if (rCount === 1) {
      const repoDist = 80;
      return {
        rx: sx + Math.cos(subAngle) * repoDist,
        rz: sz + Math.sin(subAngle) * repoDist,
        ry: sy + 15
      };
    }

    const maxFan = Math.min(0.55, Math.max(0.22, angleStep * 0.60));
    // Evenly spread across [-maxFan/2, +maxFan/2]
    const t = (rIdx / (rCount - 1)) - 0.5;
    const repoAngle = subAngle + t * maxFan;

    // Stagger distances: 78 + (rIdx % 2) * 58 + floor(rIdx / 2) * 45
    const tier = rIdx % 2;
    const subLayer = Math.floor(rIdx / 2);
    const repoDist = 78 + tier * 58 + subLayer * 46;

    return {
      rx: sx + Math.cos(repoAngle) * repoDist,
      rz: sz + Math.sin(repoAngle) * repoDist,
      ry: sy + (rIdx % 2 === 0 ? -22 : 22)
    };
  });

  // Formula C: Progressive Radial Arc (Monotonic arc)
  await testFormula('Formula C (Progressive Radial Arc)', ({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount }) => {
    if (rCount === 1) {
      const repoDist = 80;
      return {
        rx: sx + Math.cos(subAngle) * repoDist,
        rz: sz + Math.sin(subAngle) * repoDist,
        ry: sy + 15
      };
    }

    const maxFan = Math.min(0.60, Math.max(0.24, angleStep * 0.62));
    const t = (rIdx / (rCount - 1)) - 0.5;
    const repoAngle = subAngle + t * maxFan;
    const repoDist = 78 + rIdx * 56;

    return {
      rx: sx + Math.cos(repoAngle) * repoDist,
      rz: sz + Math.sin(repoAngle) * repoDist,
      ry: sy + (rIdx % 2 === 0 ? -22 : 22)
    };
  });

  // Formula D: Alternating Radial Fan (V-blossom)
  await testFormula('Formula D (Alternating Radial Fan - V-blossom)', ({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount }) => {
    if (rCount === 1) {
      const repoDist = 80;
      return {
        rx: sx + Math.cos(subAngle) * repoDist,
        rz: sz + Math.sin(subAngle) * repoDist,
        ry: sy + 15
      };
    }

    const maxFan = Math.min(0.55, Math.max(0.22, angleStep * 0.58));
    // Alternate side: -1, +1, -1, +1
    const side = (rIdx % 2 === 0) ? -1 : 1;
    // Fractional spread across pairs
    const pairProgress = Math.floor(rIdx / 2) / Math.max(1, Math.floor((rCount - 1) / 2));
    const angleOffset = (0.35 + 0.65 * pairProgress) * (maxFan / 2) * side;

    const repoAngle = subAngle + angleOffset;
    const repoDist = 78 + rIdx * 56;

    return {
      rx: sx + Math.cos(repoAngle) * repoDist,
      rz: sz + Math.sin(repoAngle) * repoDist,
      ry: sy + (rIdx % 2 === 0 ? -22 : 22)
    };
  });

  // Formula E: Symmetric Flower Petal Fan (Centered arc with middle at furthest point)
  await testFormula('Formula E (Symmetric Blossom Arc)', ({ sx, sy, sz, subAngle, angleStep, rIdx, rCount, subCount }) => {
    if (rCount === 1) {
      const repoDist = 80;
      return {
        rx: sx + Math.cos(subAngle) * repoDist,
        rz: sz + Math.sin(subAngle) * repoDist,
        ry: sy + 15
      };
    }

    const maxFan = Math.min(0.58, Math.max(0.24, angleStep * 0.60));
    // Symmetrically spread angles around subAngle:
    const t = (rIdx / (rCount - 1)) - 0.5; // from -0.5 to +0.5
    const repoAngle = subAngle + t * maxFan;

    // Symmetric distances: dome / blossom shape (center repos further out, sides closer)
    // or staggered distances so no two adjacent repos collide
    const repoDist = 78 + rIdx * 56;

    return {
      rx: sx + Math.cos(repoAngle) * repoDist,
      rz: sz + Math.sin(repoAngle) * repoDist,
      ry: sy + (rIdx % 2 === 0 ? -22 : 22)
    };
  });
}

main();
