import { test, expect, request } from '@playwright/test';
import { TestDataManager } from '../testdata/test-data-manager';
import type { ParsedTestData } from '../testdata/test-data.interface';
import { DatabaseUtility } from '../utils/database-utility';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
import { RCLogin } from '../pages/RCLogin';
import { TriggerHangfireJob } from '../pages/HangfireJob';
import { fetchAccessToken } from '../pages/CBO_Auth';


test.setTimeout(600000)
const testCaseID = 'TC01_CBO_2under30Flag';
const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'testdata', 'CBO-Smoke-TestData.xlsx');
console.log(`[CBO Smoke] Start: ${testCaseID}`);
console.log(`[CBO Smoke] Using test data path: ${testDataPath}`);
TestDataManager.initialize(testDataPath, testCaseID);
const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
console.log(`[CBO Smoke] Test Data Loaded: ${JSON.stringify(testData)}`);
console.log(`[CBO Smoke] Loaded test data row 1`);

test('CBO Debtor Lookup call', async ({ page }) => {
  // Clear repos (access statics)
  (DatabaseUtility as any).contractRepo = [];
  (DatabaseUtility as any).transactionRepo = [];
  (DatabaseUtility as any).registrationNumberRepo = [];
  const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
  
  await DatabaseUtility.insertStagingData(testData);
  const generatedAPIID = DatabaseUtility.APIIDRepo.at(-1);
  const generatedFN = DatabaseUtility.DebtorFNRepo.at(-1);
  const generatedLN = DatabaseUtility.DebtorLNRepo.at(-1);


  const contractRepo = (DatabaseUtility as any).contractRepo as string[];

  expect(contractRepo.length).toBeGreaterThan(0);

  await RCLogin.login(page, process.env.baseURL || '', process.env.username || '', process.env.password || '');
  // Get processing jobs count using the new function
  await TriggerHangfireJob(page);
  
      console.log('Reused Generated Values:', {
        generatedAPIID,
        generatedFN,
        generatedLN
      });
  
   
          // Fetch access token
      const accessToken = await fetchAccessToken();
      console.log('Access Token:', accessToken.access_token);
  
      // Define the API endpoint
      const apiUrl = 'http://qa.cbo.dhltd.corp/api/Lookup/Debtor';
  
      // Initialize TestDataManager and load data
     
         // Build the request payload
         testData.APIyear=String(testData.APIyear);
        testData.APIdateOfBirth = new Date(testData.APIdateOfBirth).toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
         
      const requestData = {
        applicationInformation: {
        id: generatedAPIID,
          providerCode: testData.APIproviderCode,
          providerName: testData.APIproviderName,
          reference1: testData.APIreference1,
          reference2: ''
        },
      
        dealerInformation: {
          id: '',
          name: '',
          vehicleInformations: [
            {
              serialNumberOrVIN: testData.APIserialNumberOrVIN,
              make: testData.APImake,
              model: testData.APImodel,
              trimOrStyle: null,
              type: testData.APItype,
              year: testData.APIyear
            }
          ]
        },
        debtorInformation: {
          id:generatedAPIID,
          firstName: generatedFN,
          middleName: '',
          lastName: generatedLN,
          dateOfBirth: testData.APIdateOfBirth,
          businessName: '',
          addressType: testData.APIaddressType,
          address: testData.APIaddress,
          city: testData.APIcity,
          jurisdiction: testData.APIjurisdiction,
          postalOrZipCode: testData.APIpostalOrZipCode,
          country: testData.APIcountry
        },
        lenderInformation: {
          cmsLenderCode: testData.APIcmsLenderCode,
          providerLenderName: testData.APIproviderLenderName
        },
        loanInformation: {
          applicationType: testData.APIapplicationType,
          loanType: testData.APIloanType
        }
      };
      const requestJson = JSON.stringify(requestData);
      console.log('Request Data:', requestJson);
      // Make the API request
      const apiContext = await request.newContext();
      const response = await apiContext.post(apiUrl, {
        headers: {
           Authorization: `Bearer ${accessToken.access_token}`,
          'Content-Type': 'application/json'
        },
        data: requestJson
      });
  
    // Validate the response
    //expect(response.ok()).toBeTruthy();
    const status = response.status();
  const rawText = await response.text();
  
  console.log('HTTP status:', status);
  console.log('Raw response:', rawText);
  
  expect(status).toBe(200);
  
  const responseBody = rawText ? JSON.parse(rawText) : {};
  console.log(responseBody);
  
  expect(responseBody).toHaveProperty('cboFound');
  expect(responseBody).toHaveProperty('cboTypes');
  
  
  });
  
 