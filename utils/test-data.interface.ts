/**
 * Test Data Interfaces
 * Migrated from C# TestData.cs
 */

export interface TestDataRow {
CSVFileRowNumber: string
'Test Scenario': string
TransactionId	: string
ContractId	:string
CorporationCode	:string
BaseRegistrationNumber	:string
ExpiryDate 	:string
LienJurisdictionCode	:string
LienStatusCode	:string
Reference	:string
RegistrationDate:string
ServiceTypeCode:string
Term:string
TransactionCreatedDateTime:string
TransactionStatusCode:string	
ContractDebtorId:string
FirstName: string	
LastName	:   string
DateOfBirth	:string
Address	:string
City	:string
JurisdictionCode	:string
PostalOrZipCode	:string
CountryCode	:string
ContractSerialCollateralId	:string    
SerialNumberOrVIN	:string
Make	:string
Model	:string
Year	:string
SerialCollateralTypeDescription	:string
APIid: string
APIproviderCode: string
APIproviderName: string
APIreference1: string
APIserialNumberOrVIN: string
APImake: string
APImodel: string
APItrimOrStyle: string  
APItype: string
APIyear: string
APIfirstName: string  
APIlastName: string
APIdateOfBirth: string
APIaddressType: string
APIaddress: string
APIcity: string
APIjurisdiction: string
APIpostalOrZipCode: string
APIcountry: string
APIcmsLenderCode: string
APIproviderLenderName: string
APIapplicationType: string
APIloanType: string
}   


export interface TestDataSummary {
  TestCaseID: string;
  SheetName: string;
}

export interface ParsedTestData {
CSVFileRowNumber: string
TestScenario: string
TransactionId	: string
ContractId	:string
CorporationCode	:string
BaseRegistrationNumber	:string
ExpiryDate 	:string
LienJurisdictionCode	:string
LienStatusCode	:string
Reference	:string
RegistrationDate:string
ServiceTypeCode:string
Term:string
TransactionCreatedDateTime:string
TransactionStatusCode:string	
ContractDebtorId:string
FirstName: string	
LastName	:   string
DateOfBirth	:string
Address	:string
City	:string
JurisdictionCode	:string
PostalOrZipCode	:string
CountryCode	:string
ContractSerialCollateralId	:string    
SerialNumberOrVIN	:string
Make	:string
Model	:string
Year	:string
SerialCollateralTypeDescription	:string
APIid: string
APIproviderCode: string
APIproviderName: string
APIreference1: string
APIserialNumberOrVIN: string
APImake: string
APImodel: string
APItrimOrStyle: string  
APItype: string
APIyear: string
APIfirstName: string  
APIlastName: string
APIdateOfBirth: string
APIaddressType: string
APIaddress: string
APIcity: string
APIjurisdiction: string
APIpostalOrZipCode: string
APIcountry: string
APIcmsLenderCode: string
APIproviderLenderName: string
APIapplicationType: string
APIloanType: string
}

