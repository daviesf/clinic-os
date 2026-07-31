import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const consoleLogs = [];

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`[404 NOT FOUND]: ${response.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`[CONSOLE ERROR]: ${msg.text()}`);
    } else {
      consoleLogs.push(msg.text());
    }
  });

  try {
    console.log("Navigating to http://localhost:5173/login...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    
    // Login
    await page.fill('input[type="email"]', 'a@a.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    console.log("Current URL after login:", page.url());

    // Dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Patients
    console.log("Navigating to /patients...");
    await page.goto('http://localhost:5173/patients', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Agenda
    console.log("Navigating to /agenda...");
    await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Tasks
    console.log("Navigating to /tasks...");
    await page.goto('http://localhost:5173/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // CRM
    console.log("Navigating to /crm...");
    await page.goto('http://localhost:5173/crm', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log("Testing finished.");
    console.log("Captured errors:", errors.length);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
