import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResults {
  config: any;
  suites: Array<{
    title: string;
    file: string;
    specs: Array<{
      title: string;
      ok: boolean;
      tests: Array<{
        timeout: number;
        projectName: string;
        results: Array<{
          status: string;
          duration: number;
          startTime: string;
          errors: any[];
          stdout: Array<{ text: string }>;
        }>;
      }>;
      file: string;
      line: number;
    }>;
  }>;
  errors: any[];
  stats: {
    startTime: string;
    duration: number;
    expected: number;
    skipped: number;
    unexpected: number;
    flaky: number;
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
}

function extractKeyInfo(stdout: Array<{ text: string }>): {
  applicationId?: string;
  debtorName?: string;
  vehicle?: string;
  lender?: string;
  jurisdiction?: string;
  cboFound?: boolean;
  cboType?: string;
  registrationCount?: number;
  existingLender?: string;
  responseBody?: any;
  httpStatus?: string;
} {
  const info: any = {};

  for (const log of stdout) {
    const text = log.text;

    // Extract HTTP status
    if (text.includes('HTTP status:')) {
      const statusMatch = text.match(/HTTP status:\s*\u001b\[\d+m(\d+)\u001b\[\d+m/);
      if (statusMatch) {
        info.httpStatus = statusMatch[1];
      } else {
        const simpleMatch = text.match(/HTTP status:\s*(\d+)/);
        if (simpleMatch) info.httpStatus = simpleMatch[1];
      }
    }

    // Extract application ID
    if (text.includes('applicationId')) {
      const match = text.match(/applicationId['":\s]+['"]([^'"]+)['"]/);
      if (match) info.applicationId = match[1];
    }

    // Extract debtor name
    if (text.includes('firstName') && text.includes('lastName')) {
      const fnMatch = text.match(/firstName['":\s]+['"]([^'"]+)['"]/);
      const lnMatch = text.match(/lastName['":\s]+['"]([^'"]+)['"]/);
      if (fnMatch && lnMatch) {
        info.debtorName = `${fnMatch[1]} ${lnMatch[1]}`;
      }
    }

    // Extract vehicle info
    if (text.includes('make') && text.includes('model')) {
      const yearMatch = text.match(/year['":\s]+['"](\d{4})['"]/);
      const makeMatch = text.match(/make['":\s]+['"]([^'"]+)['"]/);
      const modelMatch = text.match(/model['":\s]+['"]([^'"]+)['"]/);
      const vinMatch = text.match(/serialNumberOrVIN['":\s]+['"]([^'"]+)['"]/);
      if (yearMatch && makeMatch && modelMatch) {
        info.vehicle = `${yearMatch[1]} ${makeMatch[1]} ${modelMatch[1]}`;
        if (vinMatch) info.vehicle += ` (VIN: ${vinMatch[1]})`;
      }
    }

    // Extract lender
    if (text.includes('cmsLenderCode') && text.includes('Request Data')) {
      const match = text.match(/"cmsLenderCode":\s*"([^"]+)"/);
      if (match) info.lender = match[1];
    }

    // Extract jurisdiction
    if (text.includes('jurisdiction')) {
      const match = text.match(/jurisdiction['":\s]+['"]([^'"]+)['"]/);
      if (match && match[1] && match[1].length === 2) info.jurisdiction = match[1];
    }

    // Extract CBO results and full response body
    if (text.includes('cboFound') || (text.includes('applicationId') && text.includes('requestId'))) {
      const foundMatch = text.match(/cboFound[:\s]+(true|false)/);
      if (foundMatch) info.cboFound = foundMatch[1] === 'true';

      const typeMatch = text.match(/type[:\s]+['"]([^'"]+)['"]/);
      if (typeMatch) info.cboType = typeMatch[1];

      const countMatch = text.match(/registrationCount[:\s]+(\d+)/);
      if (countMatch?.[1]) info.registrationCount = parseInt(countMatch[1]);

      const lenderMatch = text.match(/cmsLenderCode[:\s]+['"]([^'"]+)['"]/);
      if (lenderMatch && !info.existingLender) {
        info.existingLender = lenderMatch[1];
      }

      // Try to parse the entire response body if it's a complete object
      if (text.includes('applicationId') && text.includes('requestId') && !info.responseBody) {
        try {
          // Remove ANSI color codes first
          let cleanText = text.replace(/\u001b\[\d+m/g, '');
          cleanText = cleanText.trim();

          // Try multiple parsing strategies

          // Strategy 1: Try to parse as-is if it looks like JSON
          if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            try {
              info.responseBody = JSON.parse(cleanText);
              return info; // Success, exit early
            } catch (e) {
              // Continue to next strategy
            }
          }

          // Strategy 2: Convert console.log object notation to JSON
          // Handle: { key: 'value', nested: { key2: 'value2' } }
          let jsonStr = cleanText
            .replace(/(\w+):/g, '"$1":')     // Quote property names
            .replace(/'/g, '"')               // Replace single quotes with double quotes
            .replace(/,(\s*[}\]])/g, '$1');   // Remove trailing commas

          try {
            info.responseBody = JSON.parse(jsonStr);
          } catch (e) {
            // Strategy 3: Extract as structured object with key fields
            const structured: any = {};

            const appIdMatch = text.match(/applicationId[:\s]+['"]([^'"]+)['"]/);
            if (appIdMatch) structured.applicationId = appIdMatch[1];

            const cboFoundMatch = text.match(/cboFound[:\s]+(true|false)/);
            if (cboFoundMatch) structured.cboFound = cboFoundMatch[1] === 'true';

            const reqIdMatch = text.match(/requestId[:\s]+['"]([^'"]+)['"]/);
            if (reqIdMatch) structured.requestId = reqIdMatch[1];

            const debtorIdMatch = text.match(/debtorId[:\s]+['"]([^'"]+)['"]/);
            if (debtorIdMatch) structured.debtorId = debtorIdMatch[1];

            const lenderCountMatch = text.match(/lenderCount[:\s]+(\d+)/);
            if (lenderCountMatch?.[1]) structured.lenderCount = parseInt(lenderCountMatch[1]);

            const regCountMatch = text.match(/registrationCount[:\s]+(\d+)/);
            if (regCountMatch?.[1]) structured.registrationCount = parseInt(regCountMatch[1]);

            // Extract cboTypes array
            if (text.includes('cboTypes')) {
              const cboTypesMatch = text.match(/cboTypes:\s*\[([\s\S]*?)\]/);
              if (cboTypesMatch) {
                try {
                  const cboTypesStr = '[' + cboTypesMatch[1] + ']';
                  const cleanedCboTypes = cboTypesStr
                    .replace(/(\w+):/g, '"$1":')
                    .replace(/'/g, '"')
                    .replace(/,(\s*[}\]])/g, '$1');
                  structured.cboTypes = JSON.parse(cleanedCboTypes);
                } catch (e) {
                  // Keep raw if parsing fails
                }
              }
            }

            // Extract registrationInformation array
            if (text.includes('registrationInformation')) {
              const regInfoMatch = text.match(/registrationInformation:\s*\[([\s\S]*?)\]/);
              if (regInfoMatch) {
                try {
                  const regInfoStr = '[' + regInfoMatch[1] + ']';
                  const cleanedRegInfo = regInfoStr
                    .replace(/(\w+):/g, '"$1":')
                    .replace(/'/g, '"')
                    .replace(/,(\s*[}\]])/g, '$1');
                  structured.registrationInformation = JSON.parse(cleanedRegInfo);
                } catch (e) {
                  // Keep raw if parsing fails
                }
              }
            }

            if (Object.keys(structured).length > 0) {
              info.responseBody = structured;
            } else {
              // Fallback: store clean text
              info.responseBody = { _raw: cleanText };
            }
          }
        } catch (e) {
          // Final fallback: store raw text
          info.responseBody = { _raw: text.replace(/\u001b\[\d+m/g, '').trim() };
        }
      }
    }
  }

  return info;
}

function generateReport() {
  const resultsPath = path.join(__dirname, '..', 'test-results', 'test-results.json');
  // Generate summary in test-results directory so it's available when running in Docker
  const outputPath = path.join(__dirname, '..', 'test-results', 'Smoke Test Results - Summary.md');

  // Check if results file exists
  if (!fs.existsSync(resultsPath)) {
    console.error('Test results file not found:', resultsPath);
    process.exit(1);
  }

  // Read test results
  const rawData = fs.readFileSync(resultsPath, 'utf-8');
  const results: TestResults = JSON.parse(rawData);

  // Calculate totals and check for timeout cases
  let timeoutCount = 0;
  for (const suite of results.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        const result = test.results?.[0];
        if (!result) continue;

        const isTimeout = (result.errors && result.errors.length > 0 &&
                         result.errors.some((e: any) =>
                           e.message?.includes('Test timeout') ||
                           e.message?.includes('exceeded'))) ||
                         result.duration >= 300000;
        if (isTimeout) {
          timeoutCount++;
        }
      }
    }
  }

  const totalTests = results.stats.expected + results.stats.unexpected + results.stats.skipped;
  let passedTests = results.stats.expected;
  let failedTests = results.stats.unexpected;
  const skippedTests = results.stats.skipped;

  // Adjust counts if there are timeout cases (move from passed to failed)
  if (timeoutCount > 0) {
    passedTests = Math.max(0, passedTests - timeoutCount);
    failedTests = failedTests + timeoutCount;
  }

  const overallStatus = failedTests === 0 ? '✓ PASSED' : '✗ FAILED';

  // Start building report
  let report = '# Smoke Test Results - Summary\n\n';
  report += '## Test Execution Overview\n\n';
  report += `**Date & Time:** ${formatDateTime(results.stats.startTime)}\n`;
  report += `**Total Duration:** ${formatDuration(results.stats.duration)}\n`;
  report += `**Environment:** CBO QA\n\n`;
  report += '---\n\n';

  // Results summary table
  report += '## Test Results Summary\n\n';
  report += '| Metric | Count |\n';
  report += '|--------|-------|\n';
  report += `| **Total Tests** | ${totalTests} |\n`;
  report += `| **Passed** | ${passedTests} |\n`;
  report += `| **Failed** | ${failedTests} |\n`;
  report += `| **Skipped** | ${skippedTests} |\n\n`;
  report += `### Overall Status: ${overallStatus}\n\n`;
  report += '---\n\n';

  // Test details
  report += '## Test Details\n\n';

  for (const suite of results.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        const result = test.results?.[0];
        if (!result) continue;

        // Check if test was aborted due to timeout
        const isTimeout = (result.errors && result.errors.length > 0 &&
                         result.errors.some((e: any) =>
                           e.message?.includes('Test timeout') ||
                           e.message?.includes('exceeded'))) ||
                         result.duration >= 300000;

        // Override status display if timeout occurred
        const displayStatus = isTimeout ? 'failed' : result.status;
        const statusIcon = displayStatus === 'passed' ? '✓' : '✗';

        report += `### Test: ${spec.title}\n`;
        report += `- **Status:** ${statusIcon} ${displayStatus === 'passed' ? 'Passed' : 'Failed'}\n`;
        report += `- **Duration:** ${formatDuration(result.duration)}\n`;
        report += `- **Browser:** ${test.projectName.charAt(0).toUpperCase() + test.projectName.slice(1)} (Desktop Chrome)\n`;
        report += `- **Test File:** ${spec.file}\n\n`;

        // Extract and display key information
        const keyInfo = extractKeyInfo(result.stdout || []);

        if (isTimeout) {
          report += '#### Failure Reason:\n';
          report += '- **Smoke test running longer than expected time. Test case aborted**\n\n';
        } else if (result.status === 'passed') {
          report += '#### What was tested:\n';
          const logs = (result.stdout || []).map(s => s.text);
          const loggedInSuccess = logs.some(l => l && l.includes('Successfully logged in'));
          const navigatedToDashboard = logs.some(l => l && l.includes('Hangfire Dashboard'));
          const httpSuccess = logs.some(l => l && (l.includes('HTTP status: 200') || l.includes('200')));

          if (loggedInSuccess) report += '- Successfully logged into CBO Dashboard\n';
          if (navigatedToDashboard) report += '- Navigated to Hangfire Dashboard\n';
          report += '- Submitted debtor lookup request with test data\n';
          if (httpSuccess) report += '- Received successful response (HTTP 200)\n';
          report += '- Validated CBO lookup results\n\n';

          // Show HTTP Status
          if (keyInfo.httpStatus) {
            report += '#### API Response:\n';
            report += `- **HTTP Status:** ${keyInfo.httpStatus}\n`;
          } else {
            report += '#### Test Results:\n';
          }

          if (Object.keys(keyInfo).length > 0) {
            if (keyInfo.applicationId) report += `- **Application ID:** ${keyInfo.applicationId}\n`;
            if (keyInfo.debtorName) report += `- **Debtor Name:** ${keyInfo.debtorName}\n`;
            if (keyInfo.vehicle) report += `- **Vehicle:** ${keyInfo.vehicle}\n`;
            if (keyInfo.lender) report += `- **Lender:** ${keyInfo.lender}\n`;
            if (keyInfo.jurisdiction) report += `- **Jurisdiction:** ${keyInfo.jurisdiction === 'ON' ? 'Ontario (ON)' : keyInfo.jurisdiction}\n`;

            if (keyInfo.cboType) report += `- **CBO Type:** ${keyInfo.cboType}\n`;
            if (keyInfo.registrationCount) report += `- **Registration Count:** ${keyInfo.registrationCount}\n`;
            if (keyInfo.existingLender) report += `- **Existing Lender:** ${keyInfo.existingLender}\n`;
          }
          report += '\n';

          // Include full response body if available
          if (keyInfo.responseBody) {
            report += '#### API Response Body:\n';
            report += '```json\n';
            // Always use JSON.stringify to ensure proper JSON format with quoted keys
            const bodyToDisplay = keyInfo.responseBody._raw
              ? { note: "Raw response (could not parse as JSON)", raw: keyInfo.responseBody._raw }
              : keyInfo.responseBody;
            report += JSON.stringify(bodyToDisplay, null, 2);
            report += '\n```\n\n';
          }
        } else if (result.status === 'failed') {
          report += '#### Error Details:\n';
          if (result.errors && result.errors.length > 0) {
            for (const error of result.errors) {
              report += `\`\`\`\n${error.message || JSON.stringify(error)}\n\`\`\`\n\n`;
            }
          }
        }
      }
    }
  }

  report += '---\n\n';
  report += '## Summary\n\n';

  if (failedTests === 0) {
    report += 'All smoke tests passed successfully. The CBO Debtor Lookup functionality is working as expected in the QA environment. ';
    report += 'The system correctly identified existing registrations and returned appropriate CBO information.\n\n';
    report += '**Next Steps:** No action required. All tests are passing.\n';
  } else {
    if (timeoutCount > 0) {
      report += `${failedTests} test(s) failed. ${timeoutCount} test(s) exceeded the 5-minute timeout limit and were aborted.\n\n`;
      report += '**Next Steps:** Investigate why the test is taking longer than expected and fix performance issues, then re-run the test suite.\n';
    } else {
      report += `${failedTests} test(s) failed. Please review the error details above and investigate the failures.\n\n`;
      report += '**Next Steps:** Fix failing tests and re-run the test suite.\n';
    }
  }

  report += '\n---\n\n';
  report += '*Report generated from automated test run*\n';

  // Check for test log files
  const testLogsDir = path.join(__dirname, '..', 'test-logs');
  if (fs.existsSync(testLogsDir)) {
    const logFiles = fs.readdirSync(testLogsDir)
      .filter(f => f.startsWith('TestDataLog_'))
      .sort()
      .reverse();

    // Clean up old log files, keep only the last 5
    if (logFiles.length > 5) {
      const filesToDelete = logFiles.slice(5);
      for (const file of filesToDelete) {
        const filePath = path.join(testLogsDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted old test log: ${file}`);
        } catch (error) {
          console.error(`Failed to delete ${file}:`, error);
        }
      }
    }

    if (logFiles.length > 0) {
      report += `*Test logs saved to: test-logs\\${logFiles[0]}*\n`;
    }
  }

  // Delete old report if exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log('Deleted previous summary report');
  }

  // Write new report
  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log('✓ Summary report generated:', outputPath);
}

// Run the report generation
try {
  generateReport();
} catch (error) {
  console.error('Error generating summary report:', error);
  process.exit(1);
}
