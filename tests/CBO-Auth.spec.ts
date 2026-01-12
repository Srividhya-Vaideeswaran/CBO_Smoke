import { test, expect } from '@playwright/test';  
import { fetchAccessToken } from '../pages/CBO_Auth';

test.describe('CBO Authentication', () => {
  test('should fetch access token successfully', async () => {
    const tokenResponse = await fetchAccessToken();

  console.log('Access Token:', tokenResponse.access_token);

  })
});