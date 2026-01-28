import { Page } from '@playwright/test';

export async function TriggerHangfireJob(page: Page): Promise<string> {
    await page.getByRole('link', { name: 'HangFire Dashboard' }).click();
  await page.getByRole('link', { name: 'Hangfire Jobs' }).click();
  await page.locator('iframe').contentFrame().getByRole('link', { name: 'Hangfire Dashboard' }).click();
  await page.locator('iframe').contentFrame().getByRole('link', { name: 'Recurring Jobs' }).click();
  await page.locator('iframe').contentFrame().getByRole('row', { name: 'CBOInboundProcess 0 0 20 2 *' }).getByRole('checkbox').check();
  await page.locator('iframe').contentFrame().getByRole('button', { name: ' Trigger now' }).click();
 
    await page.frameLocator('iframe').locator("//a[@href='/hangfiredashboard/hangfire/jobs/enqueued']").click();


  // Click the Processing link inside the iframe
  await page.locator('iframe').contentFrame().getByRole('link', { name: 'Processing' }).click();
  await page.waitForTimeout(50000);
  // Wait for the processing jobs table or count to be visible (adjust selector as needed)
  const frame = await page.frameLocator('iframe');
  // Wait for the job count element to appear (update selector as needed)
  const processingCountElement = await frame.locator('//a[@href="/hangfiredashboard/hangfire/jobs/processing"]/span/span');
  const processingCount = await processingCountElement.textContent().catch(() => '0');
  console.log(`Processing jobs count: ${processingCount}`);
  return processingCount || '0';
}
