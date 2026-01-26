/**
 * Database Utility
 * Handles database operations for LMS staging tables
 * Migrated from C# DataBaseUtility.cs
 */

import sql from 'mssql';
import type { ParsedTestData } from '../testdata/test-data.interface';
import fs from 'fs';
import path from 'path';
import test from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseUtility {
  private static config: sql.config;
  private static logDirectory = './test-logs';

  static contractRepo: string[] = [];
  static transactionRepo: string[] = [];
  static registrationNumberRepo: string[] = [];
  static contractdebtorRepo: string[] = [];
  static TransactionCreatedDateTime: string[] = [];
  static contractSerialColllateralRepo: string[] = [];
  static DebtorFNRepo: string[] = [];
  static DebtorLNRepo: string[] = [];

  /**
   * Initialize database connection configuration
   */
  static initialize(connectionString?: string): void {
    const server = process.env.DB_CBO_SERVER || 'MRKREGDBVWQA43.DHLTD.CORP';
    const database = process.env.DB_CBO_DATABASE || 'CBO_QA';
    const user = process.env.DB_CBO_USER?.trim();
    const password = process.env.DB_CBO_PASSWORD?.trim().replace(/^["']|["']$/g, '');
    const useWindowsAuth = process.env.DB_USE_WINDOWS_AUTH?.trim() === 'true';

    console.log('Database initialization:', {
      server,
      database,
      useWindowsAuth,
      hasUser: !!user,
      hasPassword: !!password
    });

    if (!useWindowsAuth && user && password) {
      console.log('Using SQL Server Authentication');

      this.config = {
        server,
        database,
        user,
        password,
        port: 1558, // ✅ FIXED: explicit port 1558
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true
        },
        connectionTimeout: 30000,
        requestTimeout: 300000,
        pool: {
          max: 5,
          min: 0,
          idleTimeoutMillis: 30000
        }
      };

      console.log('DB connect config:', {
        server: this.config.server,
        port: (this.config as any).port,
        database: this.config.database,
        user: this.config.user
      });
    } else {
      console.error('Windows Authentication with current user credentials is not supported by tedious driver.');
      console.log('Please set DB_USE_WINDOWS_AUTH=false and provide DB_CBO_USER and DB_CBO_PASSWORD');
      throw new Error(
        'Database configuration error: Windows Authentication requires explicit credentials with tedious driver. Use SQL Server Authentication instead.'
      );
    }
  }



  static async insertStagingData(testData: ParsedTestData): Promise<void> {
    if (!this.config) this.initialize();

    try {
      console.log('Connecting to database...');
      console.log('Config:', {
        server: this.config.server,
        database: this.config.database,
        authType: this.config.authentication?.type || 'sql',
        domain: this.config.domain || 'N/A',
        port: (this.config as any).port
      });

      const pool = await sql.connect(this.config);

      const reference = this.generatereference(testData.Reference);
      const transactionID = this.generateTransactionID(testData.TransactionId);
      const registrationDate = this.processDate(testData.RegistrationDate);

      // ✅ FIX: prevent undefined expiryTemplate
      const expiryTemplate =
        (testData as any).ExpiryDate ??
        (testData as any).expiryDate ??
        '$GetExpiryDt';

      const expiryDate = this.processExpiryDate(expiryTemplate, testData.Term, registrationDate);

      const registrationNumber = this.generateRegistrationNumber(testData.LienJurisdictionCode);
      const contractID = this.generatecontractID(testData.ContractId);
      const contractDebtorID = this.generatecontractDebtorID(testData.ContractDebtorId);
      const TransactionCreatedDateTime = this.generateTransactionCreatedDateTime(testData.TransactionCreatedDateTime);
      const contractSerialCollateralID = this.generateSerialCollateralID(testData.ContractSerialCollateralId);
      const DebtorFN = this.generateFirstName(testData.FirstName);
      const DebtorLN = this.generateLastName(testData.LastName);

      console.log('Generated firstname:',DebtorFN);
      console.log('Generated lastname:',DebtorLN);
      this.contractRepo.push(contractID);
      this.transactionRepo.push(transactionID);
      this.registrationNumberRepo.push(registrationNumber);
      this.contractdebtorRepo.push(contractDebtorID);
      this.TransactionCreatedDateTime.push(TransactionCreatedDateTime);
      this.contractSerialColllateralRepo.push(contractSerialCollateralID);
      this.DebtorFNRepo.push(DebtorFN);
      this.DebtorLNRepo.push(DebtorLN);

      console.log('Generated values:');
      console.log(`  Original reference: ${testData.Reference} -> Generated: ${reference}`);
      console.log(`  Original TransactionID: ${testData.TransactionId} -> Generated: ${transactionID}`);
      console.log(`  Original RegDate: ${testData.RegistrationDate} -> Generated: ${registrationDate}`);
      console.log(`  Original ExpiryTemplate: ${(testData as any).ExpiryDate} -> Used: ${expiryTemplate}`);
      console.log(`  Generated ExpiryDate: ${expiryDate}`);
      console.log(`  Generated contractSerialCollateralID: ${contractSerialCollateralID}`);
      console.log('  Generated Firstname:', DebtorFN);
      console.log('  Generated Lastname:', DebtorLN);
      const query = this.buildInsertQuery(
        contractID,
        transactionID,
        TransactionCreatedDateTime,
        testData.CorporationCode,
        registrationNumber,
        '',
        '',
        '',
        '',
        expiryDate,
        testData.LienJurisdictionCode,
        testData.LienStatusCode,
        0,
        reference,
        registrationDate,
        testData.ServiceTypeCode,
        parseInt(testData.Term) || 0,
        testData.TransactionStatusCode,
        contractSerialCollateralID,
        testData.SerialNumberOrVIN,
        testData.Make,
        testData.Model,
        testData.Year,
        testData.SerialCollateralTypeDescription,
        contractDebtorID,
        DebtorFN,
        DebtorLN,
        testData.DateOfBirth,
        testData.Address,
        testData.City,
        testData.JurisdictionCode,
        testData.PostalOrZipCode,
        testData.CountryCode  

      );

      await pool.request().query(query);

      console.log(`✓ Inserted TransactionId ${transactionID} into CBO DB Staging table`);

      await this.addRowDetailsToLogFile(testData, reference, transactionID, registrationNumber, registrationDate, expiryDate,contractSerialCollateralID);

      await pool.close();
    } catch (error) {
      console.error('Error inserting data into LMS staging table:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: (error as any)?.constructor?.name
      });
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private static generatereference(accountTemplate: string): string {
    if (accountTemplate === '$Getreference') {
      const d = new Date();

    const pad = (n: number) => n.toString().padStart(2, '0');

    const dateHourMinute =
      `${d.getFullYear()}` +
      `${pad(d.getMonth() + 1)}` +
      `${pad(d.getDate())}` +
      `${pad(d.getHours())}` +
      `${pad(d.getMinutes())}`;

    return `CBOSMOKE${dateHourMinute}`;
  }
  return accountTemplate;
}

  private static generatecontractID(ContractId: string): string {
    if (ContractId === '$GetContractID') {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-10);
      return `${timestamp}`;
    }
    return ContractId;
  }
   private static generateFirstName(FirstName: string): string {
  if (FirstName === '$GetFirstName') {
    const now = new Date();

    const formattedDate =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_` +
      `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    return `CBOSmokeFN${formattedDate}`;
  }
  return FirstName;
}


  private static generateLastName(LastName: string): string {
  if (LastName === '$GetLastName') {
    const now = new Date();

    const formattedDate =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_` +
      `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    return `CBOSmokeLN${formattedDate}`;
  }
  return LastName;
}


  private static generatecontractDebtorID(contractDebtorID: string): string {
    if (contractDebtorID === '$GetContractDebtorID') {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-10);
      return `${timestamp}`;
    }
    return contractDebtorID;
  }

  private static generateSerialCollateralID(ContractSerialCollateralId: string): string {
    if (ContractSerialCollateralId === '$GetContractSerialCollateralId') {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-10);
      return `${timestamp}`;
    }
    return ContractSerialCollateralId;
  }

  private static generateTransactionCreatedDateTime(TransactionCreatedDateTime: string): string {
    if (TransactionCreatedDateTime === '$GetTransactionCreatedDateTime') {
      return new Date().toISOString(); 
  }
  return TransactionCreatedDateTime;
}/*generateSerialCollateralID*/

  private static generateTransactionID(transactionTemplate: string): string {
    if (transactionTemplate === '$GetTransactionID') {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-9);
      return timestamp;
    }
    return transactionTemplate;
  }

  private static generateRegistrationNumber(province: string): string {
if (province === 'ON') {
// Format: 20170119164240853620 (20 digits)
const now = new Date();
const base = now.getFullYear().toString()
+ (now.getMonth() + 1).toString().padStart(2, '0')
+ now.getDate().toString().padStart(2, '0')
+ now.getHours().toString().padStart(2, '0')
+ now.getMinutes().toString().padStart(2, '0')
+ now.getSeconds().toString().padStart(2, '0');
const randomDigits = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');
return `${base}${randomDigits}`;
}
// Default: province + last 8 digits of timestamp
const timestamp = Date.now().toString().slice(-8);
return `${province}${timestamp}`;
}

  private static processDate(dateTemplate: string): string {
    if (dateTemplate === '$GetCurrentDateMinus35') {
      const date = new Date();
      date.setDate(date.getDate());
      return date.toISOString().split('T')[0];
    }
    if (dateTemplate === '$GetCurrentDateMinus11Months') {
      const date = new Date();
      date.setMonth(date.getMonth() - 11);
      return date.toISOString().split('T')[0];
    }
    return dateTemplate;
  }

  // ✅ updated signature to accept possibly undefined templates safely
  private static processExpiryDate(expiryTemplate: string | undefined, term: string, registrationDate: string): string {
    const template = expiryTemplate ?? '$GetExpiryDt';

    if (template === '$GetExpiryDt') {
      const termYears = parseInt(term) || 0;
      const regDate = new Date(registrationDate);
      regDate.setFullYear(regDate.getFullYear() + termYears);
      return regDate.toISOString().split('T')[0];
    }
    return template;
  }

  private static buildInsertQuery(
    contractID: string,
    TransactionId: string,
    TransactionCreatedDateTime: string,
    CorporationCode: string,
    BaseRegistrationNumber: string,
    AmendmentDate: string,
    AmendmentRegistrationNumber: string,
    DischargeDate: string,
    DischargeRegistrationNumber: string,
    ExpiryDate: string,
    LienJurisdictionCode: string,
    LienStatusCode: string,
    LoanAmount: number,
    Reference: string,
    RegistrationDate: any,
    ServiceTypeCode: string,
    Term: number,
    TransactionStatusCode: string,
    contractSerialCollateralID: string,
    SerialNumberOrVIN: string,
    Make: string,
    Model: string,
    Year: string,
    SerialCollateralTypeDescription: string,
    contractDebtorID: string,
    DebtorFN: string,
    DebtorLN: string,
    DateOfBirth: string,
    Address?: string,
    City?: string,
    JurisdictionCode?: string,
    PostalOrZipCode?: string,
    CountryCode?: string

  ): string {
    const safeValue = (val: any): string => val ?? '';

    const vinContractInsert = `INSERT INTO [dbo].[StagingLienInfo] ([ContractId] ,[TransactionId] ,[TransactionCreatedDateTime] ,[CorporationCode] ,[BaseRegistrationNumber] ,[AmendmentDate] ,[AmendmentRegistrationNumber] ,[DischargeDate] ,[DischargeRegistrationNumber] ,[ExpiryDate] ,[JurisdictionCode] ,[LienStatusCode] ,[LoanAmount] ,[Reference] ,[RegistrationDate] ,[ServiceTypeCode] ,[Term] ,[TransactionStatusCode] ,[Processed] ,[IsDeleted] ,[CreatedDateTime] ,[UpdatedDateTime] ,[SequenceNumber] ,[AuditData]) VALUES ('${safeValue(contractID)}','${safeValue(TransactionId)}','${safeValue(TransactionCreatedDateTime)}','${safeValue(CorporationCode)}','${safeValue(BaseRegistrationNumber)}',NULL,NULL,NULL,NULL, '${safeValue(ExpiryDate)}', '${safeValue(LienJurisdictionCode)}', '${safeValue(LienStatusCode)}', ${safeValue(LoanAmount) || 0}, '${safeValue(Reference)}', '${safeValue(RegistrationDate)}', '${safeValue(ServiceTypeCode)}', ${Term || 0}, '${safeValue(TransactionStatusCode)}','', 0, GETDATE(), GETDATE(), 1, '')`;
    //console.log('Insert Query:', vinContractInsert);
    const serialCollateralInsert = `INSERT INTO [dbo].[StagingSerialCollateral] ([TransactionId],[ContractSerialCollateralId] ,[SerialNumberOrVIN] ,[Make] ,[Model] ,[Year] ,[SequenceNumber],[SerialCollateralTypeDescription] ,[ModificationTypeCode],[IsDeleted] ,[CreatedDateTime] ,[UpdatedDateTime]) VALUES ('${safeValue(TransactionId)}','${safeValue(contractSerialCollateralID)}','${safeValue(SerialNumberOrVIN)}','${safeValue(Make)}','${safeValue(Model)}','${safeValue(Year)}',1,'${safeValue(SerialCollateralTypeDescription)}','ORIGINAL', 0, GETDATE(), GETDATE())`;
    console.log('Insert Query:', serialCollateralInsert);
    const debtorNameInsert = `INSERT INTO [dbo].[StagingDebtor] ([TransactionId],[ContractDebtorId] ,[FirstName] ,[MiddleName] ,[LastName] ,[DateOfBirth] ,[BusinessName],[ModificationTypeCode],[IsLVSGenerated],[IsSystemGenerated],[DebtorSourceTypeCode],[IsDeleted] ,[CreatedDateTime] ,[UpdatedDateTime]) VALUES ('${safeValue(TransactionId)}','${safeValue(contractDebtorID)}','${safeValue(DebtorFN)}','','${safeValue(DebtorLN)}','${(DateOfBirth)}','','ORIGINAL',0,0,'UI',0,GETDATE(), GETDATE())`;
    console.log('Insert Query:', debtorNameInsert);   
    const debtorAddressInsert = `INSERT INTO [dbo].[StagingDebtorAddress] ([TransactionId],[ContractDebtorId] ,[Address] ,[City] ,[JurisdictionCode] ,[JurisdictionName],[PostalOrZipCode] ,[CountryCode],[CountryName],[IsDeleted] ,[CreatedDateTime] ,[UpdatedDateTime]) VALUES ('${safeValue(TransactionId)}','${safeValue(contractDebtorID)}','${safeValue(Address)}','${safeValue(City)}','${safeValue(JurisdictionCode)}','','${safeValue(PostalOrZipCode)}','${safeValue(CountryCode)}','',0,GETDATE(), GETDATE())`;
    console.log('Insert Query:', debtorAddressInsert);
   
    return vinContractInsert + ';' + serialCollateralInsert + ';' + debtorNameInsert + ';' + debtorAddressInsert ;
    //return serialCollateralInsert;
   
  }

  private static async addRowDetailsToLogFile(
    testData: ParsedTestData,
    generatedReference: string,
    generatedTransactionID: string,
    generatedRegistrationNumber: string,
    processedRegistrationDate: string,
    processedExpiryDate: string,
    processedcontractSerialCollateralID: string
  ): Promise<void> {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const logFileName = `TestDataLog_${dateStr}.csv`;
      const logFilePath = path.join(this.logDirectory, logFileName);

      if (!fs.existsSync(logFilePath)) {
        const header =
          'CSVFileRowNumber,TestScenario,TransactionId,ContractId,CorporationCode,ExpiryDate,LienJurisdictionCode,LienStatusCode,Reference,RegistrationDate,ServiceTypeCode,Term,TransactionCreatedDateTime,TransactionStatusCode,ContractDebtorId,FirstName,LastName,DateOfBirth,Address,City,JurisdictionCode,PostalOrZipCode,CountryCode,ContractSerialCollateralId,SerialNumberOrVIN,Make,Model,Year,SerialCollateralTypeDescription\n';
        fs.writeFileSync(logFilePath, header);
      }

      const safeString = (value: any): string => (value === null || value === undefined ? '' : String(value));

      const csvRow =
        [
          safeString((testData as any).CSVFileRowNumber),
          safeString((testData as any).TestScenario),
          safeString(generatedTransactionID),
          safeString((testData as any).ContractId),
          safeString((testData as any).CorporationCode),
          safeString(processedExpiryDate),
          safeString((testData as any).LienJurisdictionCode),
          safeString((testData as any).LienStatusCode),
          safeString(generatedReference),
          safeString(processedRegistrationDate),
          safeString((testData as any).ServiceTypeCode),
          safeString((testData as any).Term),
          safeString((testData as any).TransactionCreatedDateTime),
          safeString((testData as any).TransactionStatusCode),
          safeString((testData as any).ContractDebtorId),
          safeString((testData as any).FirstName),
          safeString((testData as any).LastName),
          safeString((testData as any).DateOfBirth),
          safeString((testData as any).Address),
          safeString((testData as any).City),
          safeString((testData as any).JurisdictionCode),
          safeString((testData as any).PostalOrZipCode),
          safeString((testData as any).CountryCode),
          safeString((testData as any).ContractSerialCollateralId),
          safeString((testData as any).SerialNumberOrVIN),
          safeString((testData as any).Make),
          safeString((testData as any).Model),
          safeString((testData as any).Year),
          safeString((testData as any).SerialCollateralTypeDescription),
          now.toISOString()
        ]
          .map(field => `"${field.replace(/"/g, '""')}"`)
          .join(',') + '\n';

      fs.appendFileSync(logFilePath, csvRow);
      console.log(`✓ Test data logged to: ${logFilePath}`);
    } catch (error) {
      console.error('Error writing to test log file:', error);
    }
  }
}
