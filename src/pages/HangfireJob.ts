import { Page } from '@playwright/test';

export async function TriggerHangfireJob(page: Page): Promise<string> {
    await page.getByRole('link', { name: 'HangFire Dashboard' }).click();
  await page.getByRole('link', { name: 'Hangfire Jobs' }).click();
  await page.locator('iframe').contentFrame().getByRole('link', { name: 'Hangfire Dashboard' }).click();
  console.log("Hangfire dhasboard loaded");
 
  await page.locator('iframe').contentFrame().getByRole('link', { name: 'Recurring Jobs' }).click();
   console.log("Recurring Jobs page loaded");
  await page.locator('iframe').contentFrame().getByRole('row', { name: 'CBOInboundProcess 0 0 20 2 *' }).getByRole('checkbox').check();
  console.log("Checked the checkbox for the CBO inbound process job");
  await page.locator('iframe').contentFrame().getByRole('button', { name: ' Trigger now' }).click();
  console.log("Clicked on Trigger now button");

  // Use partial href match with CSS selector and explicit wait
  await page.waitForTimeout(5000);
  await page.frameLocator('iframe')
    .locator('a[href*="/jobs/enqueued"]')
    .waitFor({ state: 'visible', timeout: 10000 });

  await page.waitForTimeout(5000);
  await page.frameLocator('iframe')
    .locator('a[href*="/jobs/enqueued"]')
    .click();
  console.log("Clicked on Enqueued jobs link");
 // Click the Processing link inside the iframe
  
  await page.waitForTimeout(50000);
  // Wait for the processing jobs table or count to be visible (adjust selector as needed)
  const frame = page.frameLocator('iframe');
  // Wait for the job count element to appear (update selector as needed)
  const processingCountElement = await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/processing"]/span/span');
  const processingCount = await processingCountElement.textContent().catch(() => '0');
  return processingCount || '0';
}
