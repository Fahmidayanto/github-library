function lineIntersects(p1, p2, p3, p4) {
  const eps = 0.01;
  const same = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) < eps;
  if (same(p1, p3) || same(p1, p4) || same(p2, p3) || same(p2, p4)) {
    return false;
  }
  const d = (p2.x - p1.x) * (p4.z - p3.z) - (p2.z - p1.z) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((p3.x - p1.x) * (p4.z - p3.z) - (p3.z - p1.z) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.z - p1.z) - (p3.z - p1.z) * (p2.x - p1.x)) / d;
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
}

async function run() {
  const cats = await fetch('http://localhost:4000/api/categories').then(r => r.json());
  const repos = await fetch('http://localhost:4000/api/repositories').then(r => r.json());

  const nodes = [];
  const edges = [];
  const catCount = cats.length;
  const catRadius = Math.max(1350, 800 + catCount * 75); // ~1850px

  // Uniform, clean category distribution
  cats.forEach((cat, idx) => {
    const angle = (idx / catCount) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * catRadius;
    const z = Math.sin(angle) * catRadius;
    const y = [-60, 60, -50, 70][idx % 4];

    nodes.push({
      id: cat.id,
      name: cat.name,
      type: 'category',
      x, y, z,
      angle,
      collisionRadius: 55
    });
  });

  // Layout each Solar System Island
  cats.forEach((cat) => {
    const parent = nodes.find(n => n.id === cat.id);
    if (!parent) return;

    const subs = cat.subCategories || [{ id: `sub-${cat.id}`, name: `${cat.name} General` }];
    const subCount = subs.length;
    const catAngle = parent.angle || 0;

    // Available outward fan angle for this category
    const fanSpan = subCount <= 2 ? 0.45 : (subCount <= 5 ? 0.95 : (subCount <= 9 ? 1.55 : 2.25));
    const startAngle = catAngle - fanSpan / 2;
    const angleStep = subCount > 1 ? fanSpan / (subCount - 1) : 0;

    // SubCategories base distance: 280px ensures chord distance >= 80px even for 18 subs
    const subDist = 280;

    // Normalize repos: if repo has no subCategoryId, assign to subs in round-robin
    const catRepos = repos.filter(r => {
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

    subs.forEach((sub, subIdx) => {
      const subAngle = subCount > 1 ? startAngle + subIdx * angleStep : catAngle;
      // 3 tiers for large categories (> 7 subs), 2 tiers for medium (> 3), 1 tier for small
      const subLane = subCount > 7 ? (subIdx % 3) : (subCount > 3 ? (subIdx % 2) : 0);
      const subDist = 250 + subLane * 160; // 250px, 410px, or 570px

      const sx = parent.x + Math.cos(subAngle) * subDist;
      const sz = parent.z + Math.sin(subAngle) * subDist;
      const sy = parent.y + (subLane === 0 ? 35 : (subLane === 1 ? -35 : 15));

      const subNode = {
        id: sub.id,
        name: sub.name,
        type: 'subCategory',
        catId: cat.id,
        x: sx,
        y: sy,
        z: sz,
        subAngle,
        collisionRadius: 36
      };
      nodes.push(subNode);

      // Edge from Category Sun to SubCategory Planet
      edges.push({ source: parent.id, target: sub.id, color: 0xa855f7 });

      // Repositories for this SubCategory
      const subRepos = catRepos.filter(r => r.assignedSubId === sub.id);
      const rCount = subRepos.length;

      subRepos.forEach((repo, rIdx) => {
        // Staggered outward spine: each repo extends further outward along the sub's ray corridor
        const repoDist = 72 + rIdx * 56;
        const repoAngle = subAngle + (rCount > 1 ? (rIdx % 2 === 0 ? 0.05 : -0.05) : 0);

        const rx = sx + Math.cos(repoAngle) * repoDist;
        const rz = sz + Math.sin(repoAngle) * repoDist;
        const ry = sy + (rIdx % 2 === 0 ? -22 : 22);

        nodes.push({
          id: repo.id,
          name: repo.name || repo.fullName,
          type: 'repository',
          subCatId: sub.id,
          x: rx,
          y: ry,
          z: rz,
          collisionRadius: 26
        });

        // Edge from SubCategory Planet to Repository Moon
        edges.push({ source: sub.id, target: repo.id, color: 0x38bdf8 });
      });
    });
  });

  // Evaluate Edge Crossings
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let crossings = 0;
  const crossingPairs = [];

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      const s1 = nodeMap.get(e1.source);
      const t1 = nodeMap.get(e1.target);
      const s2 = nodeMap.get(e2.source);
      const t2 = nodeMap.get(e2.target);
      if (!s1 || !t1 || !s2 || !t2) continue;

      if (lineIntersects(s1, t1, s2, t2)) {
        crossings++;
        if (crossingPairs.length < 5) {
          crossingPairs.push({
            e1: `${s1.name} -> ${t1.name}`,
            e2: `${s2.name} -> ${t2.name}`
          });
        }
      }
    }
  }

  // Evaluate Node Overlaps
  let overlaps = 0;
  const overlapPairs = [];
  let minSubRepoDist = Infinity;
  let minRepoRepoDist = Infinity;
  let minSubSubDist = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const req = (a.collisionRadius || 26) + (b.collisionRadius || 26);

      if ((a.type === 'subCategory' && b.type === 'repository') || (a.type === 'repository' && b.type === 'subCategory')) {
        if (dist < minSubRepoDist) minSubRepoDist = dist;
      }
      if (a.type === 'repository' && b.type === 'repository') {
        if (dist < minRepoRepoDist) minRepoRepoDist = dist;
      }
      if (a.type === 'subCategory' && b.type === 'subCategory') {
        if (dist < minSubSubDist) minSubSubDist = dist;
      }

      if (dist < req) {
        overlaps++;
        overlapPairs.push({
          type: `${a.type} & ${b.type}`,
          a: a.name,
          b: b.name,
          dist: parseFloat(dist.toFixed(1)),
          req
        });
      }
    }
  }

  console.log('Results:');
  console.log({
    totalNodes: nodes.length,
    treeEdges: edges.length,
    edgeCrossings: crossings,
    nodeOverlaps: overlaps,
    minSubRepoDist: minSubRepoDist.toFixed(1),
    minRepoRepoDist: minRepoRepoDist.toFixed(1),
    minSubSubDist: minSubSubDist.toFixed(1)
  });
  if (crossings > 0) {
    console.log('Crossings:', crossingPairs);
  }
  if (overlaps > 0) {
    console.log('Overlaps:', overlapPairs);
  }
}

run().catch(console.error);
