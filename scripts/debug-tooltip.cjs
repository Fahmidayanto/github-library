const { chromium } = require('C:/Users/fahmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3055');
  await page.click('button:has-text("3D Galaxy Graph")');
  await page.waitForTimeout(2000);

  const res = await page.evaluate(() => {
    const tooltip = document.getElementById('nodeHoverTooltip');
    const op = tooltip.offsetParent;
    const computed = getComputedStyle(tooltip);
    const siblings = Array.from(tooltip.parentElement.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      className: c.className,
      position: getComputedStyle(c).position,
      height: c.getBoundingClientRect().height
    }));
    return {
      tooltipPosition: computed.position,
      tooltipTop: computed.top,
      tooltipLeft: computed.left,
      tooltipTransform: computed.transform,
      tooltipOffsetTop: tooltip.offsetTop,
      tooltipOffsetLeft: tooltip.offsetLeft,
      siblings
    };
  });
  console.log(JSON.stringify(res, null, 2));
  await browser.close();
}

test().catch(console.error);

