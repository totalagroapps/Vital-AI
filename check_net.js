const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log('FAILED:', response.url(), response.status());
    }
  });
  
  await page.goto('https://vitalia.up.railway.app', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
