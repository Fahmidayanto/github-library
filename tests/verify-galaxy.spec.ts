import { test, expect } from '@playwright/test';

test('Verify 3D Galaxy Graph in frontend', async ({ page }) => {
  // Navigate to frontend
  await page.goto('http://localhost:3055', { waitUntil: 'networkidle' });

  // Verify page title and header
  await expect(page).toHaveTitle(/GitLibrary|Catalog|Hub/i);

  // Take screenshot of initial Grid View
  await page.screenshot({ path: 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12/fe_grid_view.png' });

  // Click 3D Galaxy Graph button
  const graphBtn = page.getByRole('button', { name: /3D Galaxy Graph/i });
  await expect(graphBtn).toBeVisible();
  await graphBtn.click();

  // Wait for 3D Galaxy canvas and container to load
  await page.waitForTimeout(3000);

  // Check canvas exists
  const canvas = page.locator('canvas');
  await expect(canvas.first()).toBeVisible();

  // Check top stats bar in Galaxy Graph
  const topStats = page.getByText(/3D Galaxy Catalog/i);
  await expect(topStats).toBeVisible();

  // Take screenshot of 3D Galaxy Graph View
  await page.screenshot({ path: 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12/fe_galaxy_graph_initial.png' });

  // Hover over center of canvas to test tooltip and interaction
  const box = await canvas.first().boundingBox();
  if (box) {
    // Move to center area where nodes are
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12/fe_galaxy_graph_hover.png' });
  }

  // Toggle filter in left panel
  const repoFilterBtn = page.getByRole('button', { name: /Repository/i });
  if (await repoFilterBtn.isVisible()) {
    await repoFilterBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'C:/Users/fahmi/.gemini/antigravity/brain/0acf92f7-a477-43ed-b16c-22bf17070a12/fe_galaxy_graph_filtered.png' });
  }
});

