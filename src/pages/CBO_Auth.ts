import 'dotenv/config';
import { expect } from '@playwright/test';

/**
 * Response structure from CBO OAuth token endpoint
 */
type TokenResponse = {
  /** JWT access token for API authentication */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** OAuth scope granted (optional) */
  scope?: string;
};

/**
 * Fetches an OAuth 2.0 access token from the CBO authentication server using client credentials flow.
 *
 * @returns {Promise<TokenResponse>} The authentication response containing access token and metadata
 * @throws {Error} If required environment variables are missing
 * @throws {Error} If authentication request fails
 *
 * @example
 * ```typescript
 * const token = await fetchAccessToken();
 * console.log('Access token:', token.access_token);
 * console.log('Expires in:', token.expires_in, 'seconds');
 * ```
 *
 * @remarks
 * Requires the following environment variables:
 * - CBO_AUTHURL_QA: Authentication endpoint URL
 * - CBO_CLIENT_ID: OAuth client identifier
 * - CBO_CLIENT_SECRET: OAuth client secret
 */
export async function fetchAccessToken(): Promise<TokenResponse> {
  const tokenUrl = process.env['CBO_AUTHURL_QA'];
  const clientId = process.env['CBO_CLIENT_ID'];
  const clientSecret = process.env['CBO_CLIENT_SECRET'];

  if (!tokenUrl) throw new Error("Missing env var CBO_AUTHURL_QA");
  if (!clientId) throw new Error("Missing env var CBO_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing env var CBO_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'cbo_web_api',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  
  if (!response.ok) {
    throw new Error(await response.text());
  }

  //console.log('STATUS:', response.status);

  const tokenResponse: TokenResponse = await response.json();
  
  expect(tokenResponse).toHaveProperty('access_token');
  expect(tokenResponse).toHaveProperty('expires_in');
  expect(tokenResponse).toHaveProperty('token_type');
  expect(tokenResponse.access_token).toBeTruthy();
  expect(tokenResponse.expires_in).toBeGreaterThan(0);
  expect(tokenResponse.token_type).toBe('Bearer');

  return tokenResponse;


  
}
