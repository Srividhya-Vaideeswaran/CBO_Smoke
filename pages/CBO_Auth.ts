import 'dotenv/config';
import { expect } from '@playwright/test';

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export async function fetchAccessToken(): Promise<TokenResponse> {
  const tokenUrl = process.env.CBO_AUTHURL_QA;
  const clientId = process.env.CBO_CLIENT_ID;
  const clientSecret = process.env.CBO_CLIENT_SECRET;

  if (!tokenUrl) throw new Error("Missing env var CBO_AUTHURL_QA");
  if (!clientId) throw new Error("Missing env var CBO_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing env var CBO_CLIENT_SECRET");

  const basicAuth = Buffer
    .from(`${clientId}:${clientSecret}`)
    .toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "cbo_web_api",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
    body:new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.CBO_CLIENT_ID || '',
    client_secret: process.env.CBO_CLIENT_SECRET || '',
    scope: "cbo_web_api" // optional
  })
});

  
  if (!response.ok) {
    throw new Error(await response.text());
  }

  console.log('STATUS:', response.status);

  const tokenResponse: TokenResponse = await response.json();
  
  expect(tokenResponse).toHaveProperty('access_token');
  expect(tokenResponse).toHaveProperty('expires_in');
  expect(tokenResponse).toHaveProperty('token_type');
  expect(tokenResponse.access_token).toBeTruthy();
  expect(tokenResponse.expires_in).toBeGreaterThan(0);
  expect(tokenResponse.token_type).toBe('Bearer');

  return tokenResponse;


  
}
