import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const baseUrl = 'http://localhost:5173';
  const apiBaseUrl = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', exception => {
        console.log(`Uncaught exception: "${exception}"`);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`Console error: "${msg.text()}"`);
    });
  });

  test('should register a new clinic successfully', async ({ page }) => {

    // Navigate to register page
    await page.goto(`${baseUrl}/register`);
    
    // Check if we are on the register page
    await expect(page.locator('text="Create a new clinic account"')).toBeVisible({ timeout: 10000 }).catch(async () => {
        // Log the page content if the element isn't found
        console.log(await page.content());
        throw new Error("Register page not loaded correctly");
    });

    const uniqueEmail = `test_${Date.now()}@clinic.com`;
    
    // Fill in the registration form
    await page.fill('input[placeholder="Clinic Name"]', 'Test Clinic');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Password123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check if redirected to the inbox or dashboard indicating successful login
    await expect(page).toHaveURL(/.*\/dashboard\?checkout=needed/, { timeout: 10000 });
    
    // Optionally check for something on the dashboard
    await expect(page.locator('text="Dashboard de Atendimento"')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Register first via API to ensure the user exists
    const uniqueEmail = `login_${Date.now()}@clinic.com`;
    const password = 'Password123!';
    
    const response = await page.request.post(`${apiBaseUrl}/api/auth/register`, {
      data: { email: uniqueEmail, password, clinicName: 'Login Test Clinic' }
    });
    expect(response.status()).toBe(201);
    
    // Clear cookies to simulate fresh session
    await page.context().clearCookies();
    
    // Navigate to login
    await page.goto(`${baseUrl}/login`);
    
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(`${baseUrl}/`, { timeout: 10000 });
    await expect(page.locator('text="ClinicOS Inbox"')).toBeVisible({ timeout: 10000 });
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    
    await page.fill('input[type="email"]', 'nonexistent@clinic.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // We expect an error message
    // Note: Depends on the exact UI implementation, let's look for "Invalid credentials" or similar
    await expect(page.locator('text="Invalid credentials"')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(`${baseUrl}/login`);
  });
});
