const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle0'});
  const html = await page.content();
  console.log("HTML length:", html.length);
  if (html.length < 500) {
      console.log(html);
  } else {
      console.log(html.substring(0, 500) + "...");
  }
  await browser.close();
})();
