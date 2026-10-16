async function run() {
  const cats = await fetch('http://localhost:4000/api/categories').then(r => r.json());
  const repos = await fetch('http://localhost:4000/api/repositories').then(r => r.json());

  const nodes = [];
  const catCount = cats.length;
  // Cat radius
  const catRadius = Math.max(780, 520 + catCount * 50);
  const yElevations = [-60, 60, -50, 70];

  cats.forEach((cat, idx) => {
    const angle = (idx / catCount) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * catRadius;
    const z = Math.sin(angle) * catRadius;
    const y = yElevations[idx % yElevations.length];

    nodes.push({
      id: cat.id,
      name: cat.name,
      type: 'category',
      x, y, z,
      angle,
      collisionRadius: 60
    });
  });

  // SubCategories
  cats.forEach(cat => {
    const parent = nodes.find(n => n.id === cat.id);
    if (!parent) return;

    const subs = cat.subCategories || [{ id: `sub-${cat.id}`, name: `${cat.name} General` }];
    const subCount = subs.length;
    const sectorSpan = (2 * Math.PI / catCount) * 0.72; // bounded within 72% of category sector
    const angleStep = subCount > 1 ? sectorSpan / (subCount - 1) : 0;

    subs.forEach((sub, subIndex) => {
      const offsetAngle = subCount > 1 ? (subIndex - (subCount - 1) / 2) * angleStep : 0;
      const branchAngle = (parent.angle || 0) + offsetAngle;
      const tier = subIndex % 2;
      const dist = 190 + tier * 105;

      const x = parent.x + Math.cos(branchAngle) * dist;
      const z = parent.z + Math.sin(branchAngle) * dist;
      const y = parent.y + (tier === 0 ? 35 : -35);

      nodes.push({
        id: sub.id,
        name: sub.name,
        type: 'subCategory',
        catId: cat.id,
        x, y, z,
        branchAngle,
        collisionRadius: 40
      });
    });
  });

  // Repositories
  repos.forEach(repo => {
    let parentSub = nodes.find(n => n.type === 'subCategory' && (n.id === repo.subCategoryId || (repo.categoryId && n.id === repo.categoryId)));
    if (!parentSub) parentSub = nodes.find(n => n.type === 'subCategory');
    if (!parentSub) return;

    const siblings = repos.filter(r => r.subCategoryId === parentSub.id);
    const repoIndex = siblings.indexOf(repo);
    const repoCount = Math.max(siblings.length, 1);

    // Multi-tier orbital shells: 4 repos per shell
    const tier = Math.floor(repoIndex / 4);
    const indexInTier = repoIndex % 4;
    const countInTier = Math.min(4, repoCount - tier * 4);

    const shellRadius = 78 + tier * 58;
    const fanSpan = Math.PI * 0.72; // fan facing outward away from center
    const offset = countInTier > 1 ? (indexInTier - (countInTier - 1) / 2) * (fanSpan / (countInTier - 1)) : 0;
    const stagger = (tier % 2 === 1) ? (fanSpan / 8) : 0;
    const repoAngle = (parentSub.branchAngle || 0) + offset + stagger;

    const x = parentSub.x + Math.cos(repoAngle) * shellRadius;
    const z = parentSub.z + Math.sin(repoAngle) * shellRadius;
    const y = parentSub.y + (repoIndex % 2 === 0 ? -24 : 24);

    nodes.push({
      id: repo.id,
      name: repo.name || repo.fullName,
      type: 'repository',
      subCatId: parentSub.id,
      x, y, z,
      collisionRadius: 28
    });
  });

  // Languages & Topics
  const uniqueLangs = Array.from(new Set(repos.map(r => r.primaryLanguage).filter(Boolean)));
  uniqueLangs.slice(0, 6).forEach((lang, idx) => {
    const angle = (idx / uniqueLangs.length) * Math.PI * 2 + 0.32;
    const dist = catRadius + 380;
    nodes.push({
      id: `lang-${lang.toLowerCase()}`,
      name: lang,
      type: 'language',
      x: Math.cos(angle) * dist,
      y: idx % 2 === 0 ? 140 : -140,
      z: Math.sin(angle) * dist,
      collisionRadius: 28
    });
  });

  const allTopics = repos.flatMap(r => r.topics || []).filter(Boolean);
  const topTopics = Array.from(new Set(allTopics)).slice(0, 8);
  topTopics.forEach((top, idx) => {
    const angle = (idx / topTopics.length) * Math.PI * 2 + 0.18;
    const dist = catRadius + 520 + (idx % 2) * 55;
    nodes.push({
      id: `top-${top.toLowerCase()}`,
      name: '#' + top,
      type: 'topic',
      x: Math.cos(angle) * dist,
      y: Math.sin(idx * 1.5) * 85,
      z: Math.sin(angle) * dist,
      collisionRadius: 24
    });
  });

  console.log('Total nodes before solver:', nodes.length);

  // Run 2D Planar Relaxation Solver
  const paddingXZ = 20;
  const iterations = 120;
  for (let iter = 0; iter < iterations; iter++) {
    let maxOverlapXZ = 0;
    const step = Math.min(1.0, 0.4 + 0.6 * (1 - iter / iterations));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        let dx = b.x - a.x;
        let dz = b.z - a.z;
        let distXZ = Math.sqrt(dx * dx + dz * dz);

        const extraCatBuffer = (a.type === 'category' || b.type === 'category') ? 35 : 0;
        const rA = a.collisionRadius || 30;
        const rB = b.collisionRadius || 30;
        const minDistXZ = rA + rB + paddingXZ + extraCatBuffer;

        if (distXZ < minDistXZ) {
          if (distXZ < 0.001) {
            dx = (Math.random() - 0.5) * 4 || 1;
            dz = (Math.random() - 0.5) * 4 || 1;
            distXZ = Math.sqrt(dx * dx + dz * dz);
          }

          const overlap = minDistXZ - distXZ;
          if (overlap > maxOverlapXZ) maxOverlapXZ = overlap;

          const nx = dx / distXZ;
          const nz = dz / distXZ;

          const weightA = a.type === 'category' ? 0.01 : (a.type === 'subCategory' ? 0.22 : 0.77);
          const weightB = b.type === 'category' ? 0.01 : (b.type === 'subCategory' ? 0.22 : 0.77);
          const totalWeight = weightA + weightB;

          const shiftA = overlap * (weightB / totalWeight) * step;
          const shiftB = overlap * (weightA / totalWeight) * step;

          a.x -= nx * shiftA;
          a.z -= nz * shiftA;
          b.x += nx * shiftB;
          b.z += nz * shiftB;
        }
      }
    }
    if (maxOverlapXZ < 0.05) {
      console.log('Solver converged early at iter:', iter);
      break;
    }
  }

  // Count X-Z overlaps
  let overlaps = 0;
  let minSubRepoDist = Infinity;
  let minRepoRepoDist = Infinity;
  let minSubSubDist = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      const rA = a.collisionRadius || 30;
      const rB = b.collisionRadius || 30;
      const req = rA + rB;

      if ((a.type === 'subCategory' && b.type === 'repository') || (a.type === 'repository' && b.type === 'subCategory')) {
        if (distXZ < minSubRepoDist) minSubRepoDist = distXZ;
      }
      if (a.type === 'repository' && b.type === 'repository') {
        if (distXZ < minRepoRepoDist) minRepoRepoDist = distXZ;
      }
      if (a.type === 'subCategory' && b.type === 'subCategory') {
        if (distXZ < minSubSubDist) minSubSubDist = distXZ;
      }

      if (distXZ < req) {
        overlaps++;
      }
    }
  }

  console.log('Simulation Results with Real Data:');
  console.log({
    totalNodes: nodes.length,
    overlaps,
    minSubRepoDist: minSubRepoDist.toFixed(1),
    minRepoRepoDist: minRepoRepoDist.toFixed(1),
    minSubSubDist: minSubSubDist.toFixed(1)
  });
}

run().catch(console.error);
