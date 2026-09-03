const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('https://vitalia.up.railway.app', { waitUntil: 'networkidle0', timeout: 30000 });
  } catch(e) {
    console.error("Navigation error:", e.message);
  }
  
  await browser.close();
})();
