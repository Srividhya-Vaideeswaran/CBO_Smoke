import { Page } from '@playwright/test';
import 'dotenv/config';

export class RCLogin {
  /**
   * Logs into the RC application using credentials from environment variables.
   *
   * @param {Page} page - Playwright page object
   * @returns {Promise<void>} Resolves when login is successful
   * @throws {Error} If required environment variables are missing or login fails
   *
   * @remarks
   * Requires the following environment variables:
   * - RC_QA_URL: RC application URL
   * - RC_QA_Username: RC username
   * - RC_QA_Password: RC password
   */
  static async login(page: Page, p0: string, p1: string, p2: string): Promise<void> {
    try {
      const URL = process.env['RC_QA_URL'];
      const USERNAME = process.env['RC_QA_Username'];
      const PASSWORD = process.env['RC_QA_Password'];
      if (!URL || !USERNAME || !PASSWORD) {
        throw new Error('Missing RC login environment variables');
      }
      // Navigate to login page
      await page.goto(URL);
      
      // Fill login credentials
       await page.getByRole('textbox', { name: 'Enter Email' }).fill(USERNAME);
      
      await page.getByRole('textbox', { name: 'Enter Password' }).fill(PASSWORD);
      
      // Click Sign In button
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      
      // Wait for dashboard to load
        await page.getByRole('link', { name: 'HangFire Dashboard' }).waitFor();
      
      console.log('✓ Successfully logged in to CBO Dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }
}