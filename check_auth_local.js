const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  
  await page.goto('http://localhost:5173');
  
  await page.evaluate(() => {
    localStorage.setItem('med_token', 'fake-token-123');
    localStorage.setItem('med_role', 'patient');
  });
  
  await page.reload({ waitUntil: 'networkidle0' });
  
  await browser.close();
})();
