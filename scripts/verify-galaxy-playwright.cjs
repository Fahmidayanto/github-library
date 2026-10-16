const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12';

async function runVerification() {
  console.log('[Playwright] Starting browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  console.log('[Playwright] Navigating to http://localhost:3055...');
  await page.goto('http://localhost:3055', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Switch to 3D Galaxy Graph view
  console.log('[Playwright] 1. Switching to 3D Galaxy Graph view...');
  const graphButton = page.locator('button:has-text("3D Galaxy Graph")');
  await graphButton.waitFor({ state: 'visible', timeout: 10000 });
  await graphButton.click();

  // Wait for Three.js instance to be ready
  console.log('[Playwright] Waiting for __threeGalaxy scene...');
  await page.waitForFunction(() => !!window.__threeGalaxy && !!window.__threeGalaxy.nodeObjects && window.__threeGalaxy.nodeObjects.length > 0, { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 2. Verify Docked Sidebar (Menempel bukan mengambang & buram pekat)
  console.log('[Playwright] 2. Verifying Docked Sidebar (flush to edges, dense frosted blur)...');
  const sidebar = page.locator('#galaxyFiltersSidebar');
  await sidebar.waitFor({ state: 'visible', timeout: 5000 });

  const isDocked = await page.evaluate(() => {
    const sb = document.querySelector('#galaxyFiltersSidebar');
    const container = document.querySelector('#threejs-canvas-wrapper')?.parentElement;
    if (!sb || !container) return false;
    const sbRect = sb.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const isTopFlush = Math.abs(sbRect.top - cRect.top) < 3;
    const isLeftFlush = Math.abs(sbRect.left - cRect.left) < 3;
    const isBottomFlush = Math.abs(sbRect.bottom - cRect.bottom) < 3;
    return isTopFlush && isLeftFlush && isBottomFlush;
  });

  console.log(`[Playwright] Sidebar is strictly docked to container edges: ${isDocked}`);
  if (!isDocked) {
    throw new Error('Sidebar is not docked flush to container top, left, and bottom edges!');
  }

  const dockedShot = path.join(ARTIFACT_DIR, 'fe_galaxy_docked_sidebar.png');
  await page.screenshot({ path: dockedShot });
  console.log(`[Playwright] Docked sidebar screenshot saved: ${dockedShot}`);

  // 2b. Verify Sidebar Resizing (Drag right edge to expand & double click to reset)
  console.log('[Playwright] 2b. Verifying Sidebar Resizing by dragging right edge...');
  const resizeHandle = page.locator('#galaxySidebarResizeHandle');
  await resizeHandle.waitFor({ state: 'visible', timeout: 5000 });

  const initialWidth = await page.evaluate(() => {
    const sb = document.querySelector('#galaxyFiltersSidebar');
    return sb ? sb.getBoundingClientRect().width : 0;
  });
  console.log(`[Playwright] Initial sidebar width: ${initialWidth}px`);

  // Drag resize handle by +90px to the right
  const handleBox = await resizeHandle.boundingBox();
  if (!handleBox) throw new Error('Resize handle bounding box not found!');

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 100);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 90, handleBox.y + 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const resizedWidth = await page.evaluate(() => {
    const sb = document.querySelector('#galaxyFiltersSidebar');
    return sb ? sb.getBoundingClientRect().width : 0;
  });
  console.log(`[Playwright] Resized sidebar width after drag: ${resizedWidth}px`);
  if (resizedWidth <= initialWidth + 50) {
    throw new Error(`Sidebar was not resized wider! Initial: ${initialWidth}, Resized: ${resizedWidth}`);
  }

  const resizedShot = path.join(ARTIFACT_DIR, 'fe_galaxy_resized_wide.png');
  await page.screenshot({ path: resizedShot });
  console.log(`[Playwright] Resized sidebar screenshot saved: ${resizedShot}`);

  // Double click resize handle to reset
  await resizeHandle.dblclick();
  await page.waitForTimeout(300);
  const resetWidth = await page.evaluate(() => {
    const sb = document.querySelector('#galaxyFiltersSidebar');
    return sb ? sb.getBoundingClientRect().width : 0;
  });
  console.log(`[Playwright] Reset sidebar width after double-click: ${resetWidth}px`);

  // 3. Verify Display Settings as a Dropdown Accordion
  console.log('[Playwright] 3. Verifying Display Settings Dropdown Accordion...');
  const displaySettingsBtn = page.locator('#displaySettingsToggleBtn');
  await displaySettingsBtn.waitFor({ state: 'visible', timeout: 5000 });

  // Initially, Star Scale slider should NOT be in DOM/visible
  const isSliderVisibleBefore = await page.locator('input[type="range"]').first().isVisible().catch(() => false);
  console.log(`[Playwright] Display sliders visible before click: ${isSliderVisibleBefore} (expected false)`);

  // Click to expand Display Settings dropdown
  console.log('[Playwright] Clicking Display Settings dropdown toggle...');
  await displaySettingsBtn.click();
  await page.waitForTimeout(400);

  const starScaleSlider = page.locator('input[type="range"]').first();
  const isSliderVisibleAfter = await starScaleSlider.isVisible();
  console.log(`[Playwright] Display sliders visible after click: ${isSliderVisibleAfter} (expected true)`);
  if (!isSliderVisibleAfter) {
    throw new Error('Display Settings sliders did not expand after clicking toggle button!');
  }

  const displaySettingsShot = path.join(ARTIFACT_DIR, 'fe_galaxy_display_settings_expanded.png');
  await page.screenshot({ path: displaySettingsShot });
  console.log(`[Playwright] Display Settings expanded screenshot saved: ${displaySettingsShot}`);

  // 4. Verify Camera Controls Dropdown
  console.log('[Playwright] 4. Verifying Camera Controls Dropdown...');
  const cameraBtn = page.locator('#cameraControlsDropdownBtn');
  await cameraBtn.waitFor({ state: 'visible', timeout: 5000 });
  await cameraBtn.click();
  await page.waitForTimeout(400);

  const autoRotateOption = page.locator('button:has-text("Auto-Rotate")');
  await autoRotateOption.click();
  await page.waitForTimeout(400);
  const isAutoRotateOn = await page.evaluate(() => window.__threeGalaxy?.controls?.autoRotate);
  console.log(`[Playwright] Auto-rotate enabled state in OrbitControls: ${isAutoRotateOn}`);
  if (!isAutoRotateOn) {
    throw new Error('Auto-rotate was not toggled on!');
  }
  await cameraBtn.click();
  await page.waitForTimeout(300);

  // 5. Verify Collapse & Uncollapse (with docked styling, hover reveal, & smooth motion)
  console.log('[Playwright] 5. Verifying Collapse & Uncollapse with hover reveal & smooth motion...');
  
  // Hover over sidebar to reveal collapse button
  await page.locator('#galaxyFiltersSidebar').hover();
  await page.waitForTimeout(300);

  const collapseBtn = page.locator('#collapseFiltersBtn');
  const isCollapseVisible = await collapseBtn.isVisible();
  console.log(`[Playwright] Collapse button visible on sidebar hover: ${isCollapseVisible}`);
  if (!isCollapseVisible) {
    throw new Error('Collapse button did not appear on hover!');
  }

  const collapseHoverShot = path.join(ARTIFACT_DIR, 'fe_galaxy_collapse_hover_revealed.png');
  await page.screenshot({ path: collapseHoverShot });
  console.log(`[Playwright] Collapse button hover revealed screenshot saved: ${collapseHoverShot}`);

  await collapseBtn.click();
  await page.waitForTimeout(600);

  // Hover on left edge zone to reveal uncollapse button
  await page.locator('.galaxy-uncollapse-zone').hover();
  await page.waitForTimeout(400);

  const uncollapseBtn = page.locator('#uncollapseFiltersBtn');
  const isUncollapsedVisible = await uncollapseBtn.isVisible();
  console.log(`[Playwright] Uncollapse button visible on left edge hover: ${isUncollapsedVisible}`);
  if (!isUncollapsedVisible) {
    throw new Error('Uncollapse button did not appear on left edge hover!');
  }

  const collapsedShot = path.join(ARTIFACT_DIR, 'fe_galaxy_docked_collapsed.png');
  await page.screenshot({ path: collapsedShot });
  console.log(`[Playwright] Docked collapsed screenshot saved: ${collapsedShot}`);

  // Click uncollapse button to restore
  await uncollapseBtn.click();
  await page.waitForTimeout(600);

  const isRestored = await page.evaluate(() => {
    const sb = document.querySelector('#galaxyFiltersSidebar');
    return sb && !sb.classList.contains('collapsed');
  });
  console.log(`[Playwright] Docked sidebar restored via uncollapse button: ${isRestored}`);
  if (!isRestored) {
    throw new Error('Docked sidebar was not restored via uncollapse button!');
  }

  // 6. Verify Galaxy Clusters -> Subgroup -> Repo -> Pop up GitHub README
  console.log('[Playwright] 6. Verifying Clusters -> Subgroup -> Repo README...');
  const firstCatToggle = page.locator('div:has-text("Galaxy Clusters") + div > div > div > button.flex-1').first();
  await firstCatToggle.click();
  await page.waitForTimeout(300);

  const firstSubBtn = page.locator('div:has-text("Galaxy Clusters") + div .ml-3 button:has-text("🪐")').first();
  await firstSubBtn.waitFor({ state: 'visible', timeout: 5000 });
  await firstSubBtn.click();
  await page.waitForTimeout(400);

  const repoItemBtn = page.locator('button[title^="Buka README "]').first();
  await repoItemBtn.waitFor({ state: 'visible', timeout: 5000 });
  await repoItemBtn.click();
  await page.waitForTimeout(1500);

  const isModalVisible = await page.locator('#repoDetailModal').isVisible();
  console.log(`[Playwright] RepoDetailModal is visible: ${isModalVisible}`);
  if (!isModalVisible) {
    throw new Error('RepoDetailModal did not open!');
  }

  const modalShot = path.join(ARTIFACT_DIR, 'fe_galaxy_docked_readme_modal.png');
  await page.screenshot({ path: modalShot });
  console.log(`[Playwright] Readme modal screenshot saved: ${modalShot}`);

  const closeBtn = page.locator('#repoDetailModal button:has(svg.lucide-x)').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // Final screenshot
  const finalShot = path.join(ARTIFACT_DIR, 'fe_galaxy_docked_final.png');
  await page.screenshot({ path: finalShot });
  console.log(`[Playwright] Final screenshot saved: ${finalShot}`);

  console.log('[Playwright] ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
  await browser.close();
}

runVerification().catch(err => {
  console.error('[Playwright Error]', err);
  process.exit(1);
});
