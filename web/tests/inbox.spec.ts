import { test, expect } from '@playwright/test';

test.describe('Inbox Webhook Flow', () => {
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

  test('should receive a whatsapp message and display in inbox', async ({ page, request }) => {
    const timestamp = Date.now();
    const email = `clinic_${timestamp}@test.com`;
    const password = 'password123';
    const clinicName = `Clinic ${timestamp}`;
    const phoneNumberId = `phone-${timestamp}`;
    const patientPhone = `551199999${timestamp.toString().slice(-4)}`;

    // 1. Register new user
    await page.goto(`${baseUrl}/register`);
    await page.fill('input[name="clinicName"]', clinicName);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard\?checkout=needed/, { timeout: 10000 });

    // 2. Go to Settings and configure phone number ID
    await page.goto(`${baseUrl}/settings`);
    await page.fill('input[placeholder="Ex: 123456789012345"]', phoneNumberId);
    await page.click('button:has-text("Salvar")');

    // Wait for saved confirmation
    await expect(page.locator('text=Configurações salvas com sucesso')).toBeVisible({ timeout: 5000 });

    // 3. Go to Inbox
    await page.goto(`${baseUrl}/`);
    await expect(page.locator('text="ClinicOS Inbox"')).toBeVisible({ timeout: 10000 });

    // 4. Simulate incoming WhatsApp webhook message
    const webhookPayload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "123",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "123", phone_number_id: phoneNumberId },
            messages: [{
              from: patientPhone,
              id: `msg-${timestamp}`,
              timestamp: `${Math.floor(timestamp / 1000)}`,
              text: { body: "Hello from E2E test!" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const res = await request.post(`${apiBaseUrl}/webhook`, {
      data: webhookPayload,
    });
    expect(res.status()).toBe(200);

    // 5. Verify the message appears in the UI
    // The conversation list should eventually show the patient phone
    const formattedPhone = `(${patientPhone.slice(2, 4)}) ${patientPhone.slice(4, 9)}-${patientPhone.slice(9, 13)}`;
    await expect(page.locator(`text="${formattedPhone}"`)).toBeVisible({ timeout: 15000 });
    
    // Click on the conversation
    await page.click(`text="${formattedPhone}"`);

    // The chat window should show the message text
    await expect(page.locator('text="Hello from E2E test!"')).toBeVisible({ timeout: 5000 });

    // 6. Test Outbound Message (Human Handoff/Reply)
    await page.fill('#message-input', 'This is a reply from the doctor');
    await page.click('#send-button');

    // Verify it appears in the chat
    await expect(page.locator('text="This is a reply from the doctor"')).toBeVisible({ timeout: 5000 });
  });
});
