const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://vitalia.up.railway.app', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log("HTML:", html.substring(0, 1500));
  
  await browser.close();
})();
