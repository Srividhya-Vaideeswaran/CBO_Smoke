import { Page } from '@playwright/test';
import 'dotenv/config';

export class RCLogin {

static async login(page: Page, url: string, username: string, password: string): Promise<void> {
    try {
        const URL =  process.env.RC_QA_URL;
        const USERNAME = process.env.RC_QA_Username;
        const PASSWORD = process.env.RC_QA_Password;
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