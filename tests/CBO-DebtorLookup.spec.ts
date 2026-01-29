import { test, expect } from '@playwright/test';  
import { fetchAccessToken } from '../pages/CBO_Auth';
import { TestDataManager } from '../testdata/test-data-manager';
import type { ParsedTestData } from '../testdata/test-data.interface';
import { DatabaseUtility } from '../utils/database-utility';
import path from 'path';

test.describe('CBO Debtor Lookup API Tests', () => {
 
 
    test('Verify Debtor Lookup API with CSV Data', async ({ request }) => {
    test.setTimeout(600000)
 const testCaseID = 'TC01_CBO_2under30Flag';
 const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'testdata', 'CBO-Smoke-TestData.xlsx');
 console.log(`[CBO Smoke] Start: ${testCaseID}`);
 console.log(`[CBO Smoke] Using test data path: ${testDataPath}`);
 TestDataManager.initialize(testDataPath, testCaseID);
 const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
  await DatabaseUtility.insertStagingData(testData);
     const generatedAPIID = DatabaseUtility.APIIDRepo.at(-1);
    const generatedFN = DatabaseUtility.DebtorFNRepo.at(-1);
    const generatedLN = DatabaseUtility.DebtorLNRepo.at(-1);

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
    const response = await request.post(apiUrl, {
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

});

