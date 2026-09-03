const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  
  await page.goto('https://vitalia.up.railway.app', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
