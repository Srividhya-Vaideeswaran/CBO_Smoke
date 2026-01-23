/**
 * Test Data Manager
 * Migrated from C# TestData.cs
 * Handles loading and parsing test data from Excel files
 */

import XLSX from 'xlsx';
import type { TestDataRow, TestDataSummary, ParsedTestData } from './test-data.interface';

export class TestDataManager {
  private static testDataPath: string;
  private static testSheetName: string;
  private static currentTestData: ParsedTestData | null = null;

  /**
   * Initialize test data manager with Excel file path and test case ID
   * Equivalent to C# TestData constructor
   */
  static initialize(testDataPath: string, testCaseID: string): string {
    this.testDataPath = testDataPath;

    try {
      const summarySheet = this.loadSheet<TestDataSummary>('TestDataSummary');
      const testCase = summarySheet.find(row => row.TestCaseID === testCaseID);

      if (testCase) {
        // Trim to avoid hidden spaces in Excel
        this.testSheetName = String(testCase.SheetName).trim();
      } else {
        this.testSheetName = testCaseID.trim();
      }
    } catch {
      console.log('TestDataSummary sheet not found, using testCaseID as sheet name');
      this.testSheetName = testCaseID.trim();
    }

    return this.testSheetName;
  }

  /**
   * Get row count for the current test sheet
   * Equivalent to C# TestDataSheetRowCount
   */
  static getSheetRowCount(): number {
    if (!this.testSheetName) {
      throw new Error('TestDataManager not initialized. Call initialize() first.');
    }
    const data = this.loadSheet<any>(this.testSheetName);
    return data.length;
  }

  /**
   * Load CSV data row details by row number
   * Equivalent to C# LoadcsvDataRowDetails
   */
  static loadDataRow(rowNumber: number): ParsedTestData {
    if (!this.testSheetName) {
      throw new Error('TestDataManager not initialized. Call initialize() first.');
    }

    const data = this.loadSheet<TestDataRow>(this.testSheetName);
    const row = data.find(r => Number(r.CSVFileRowNumber) === rowNumber);

    if (!row) {
      throw new Error(`Row number ${rowNumber} not found in sheet ${this.testSheetName}`);
    }

    const parsedData: ParsedTestData = {
      CSVFileRowNumber: String(row.CSVFileRowNumber),
      TestScenario: row['Test Scenario'],
      TransactionId: row['TransactionId'],
      ContractId: row.ContractId,
      CorporationCode: row.CorporationCode,
      BaseRegistrationNumber: row.BaseRegistrationNumber,
      ExpiryDate: row.ExpiryDate,
      LienJurisdictionCode: row.LienJurisdictionCode,
      LienStatusCode: row.LienStatusCode,
      Reference: row.Reference,
      RegistrationDate: row.RegistrationDate,
      ServiceTypeCode: row.ServiceTypeCode,
      Term: row.Term,
      TransactionCreatedDateTime: row.TransactionCreatedDateTime,
      TransactionStatusCode: row.TransactionStatusCode,
      ContractDebtorId: row.ContractDebtorId,
      FirstName: row.FirstName,
      LastName: row.LastName,
      DateOfBirth: row.DateOfBirth,
      Address: row.Address,
      City: row.City,
      JurisdictionCode: row.JurisdictionCode,
      PostalOrZipCode: row.PostalOrZipCode,
      CountryCode: row.CountryCode,
      ContractSerialCollateralId: row.ContractSerialCollateralId,
      SerialNumberOrVIN: row.SerialNumberOrVIN,
      Make: row.Make,
      Model: row.Model,
      Year: row.Year,
      SerialCollateralTypeDescription: row.SerialCollateralTypeDescription,
    };

    this.currentTestData = parsedData;
    return parsedData;
  }

  /**
   * Get current test data
   */
  static getCurrentTestData(): ParsedTestData | null {
    return this.currentTestData;
  }

  /**
   * Get test sheet name
   * Equivalent to C# GetTestDataSheetName
   */
  static getTestSheetName(): string {
    return this.testSheetName;
  }

  /**
   * Load a specific sheet from the Excel file
 
   */
  private static loadSheet<T>(sheetName: string): T[] {
    try {
      if (!this.testDataPath) {
        throw new Error('TestDataManager not initialized. Call initialize() first.');
      }

      const workbook = XLSX.readFile(this.testDataPath);
      const trimmed = sheetName.trim();


      if (!workbook.SheetNames.includes(trimmed)) {
        throw new Error(`Sheet '${trimmed}' not found in workbook`);
      }

      const worksheet = workbook.Sheets[trimmed];
      if (!worksheet) {
        // TS + runtime safety
        throw new Error(`Sheet '${trimmed}' not found in workbook (missing worksheet object)`);
      }

      return XLSX.utils.sheet_to_json<T>(worksheet);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error loading sheet '${sheetName}': ${message}`);
    }
  }

  /**
   * Load multiple rows by row numbers
   */
  static loadMultipleRows(rowNumbers: number[]): ParsedTestData[] {
    return rowNumbers.map(rowNum => this.loadDataRow(rowNum));
  }

  /**
   * Get all rows from current test sheet
   */
  static getAllRows(): TestDataRow[] {
    if (!this.testSheetName) {
      throw new Error('TestDataManager not initialized. Call initialize() first.');
    }
    return this.loadSheet<TestDataRow>(this.testSheetName);
  }
}