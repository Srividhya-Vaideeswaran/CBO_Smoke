import { test, expect } from '@playwright/test';
import { TestDataManager } from '../testdata/test-data-manager';
import type { ParsedTestData } from '../testdata/test-data.interface';
import { DatabaseUtility } from '../utils/database-utility';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

test.setTimeout(600000)
const testCaseID = 'TC01_CBO_2under30Flag';
const testDataPath = process.env.TEST_DATA_PATH || path.join(process.cwd(), 'testdata', 'CBO-Smoke-TestData.xlsx');
console.log(`[CBO Smoke] Start: ${testCaseID}`);
console.log(`[CBO Smoke] Using test data path: ${testDataPath}`);
TestDataManager.initialize(testDataPath, testCaseID);
const testData: ParsedTestData = TestDataManager.loadDataRow(1); // Load first row
console.log(`[CBO Smoke] Test Data Loaded: ${JSON.stringify(testData)}`);
console.log(`[CBO Smoke] Loaded test data row 1`);

test('insert staging (ESM)', async () => {
  // Clear repos (access statics)
  (DatabaseUtility as any).contractRepo = [];
  (DatabaseUtility as any).transactionRepo = [];
  (DatabaseUtility as any).registrationNumberRepo = [];

  await DatabaseUtility.insertStagingData(testData);

  const contractRepo = (DatabaseUtility as any).contractRepo as string[];
  expect(contractRepo.length).toBeGreaterThan(0);
});