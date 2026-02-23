import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SummaryReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    // Optional: Log when tests start
  }

  onTestBegin(test: TestCase, result: TestResult) {
    // Optional: Log individual test starts
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Optional: Log individual test completions
  }

  onEnd(result: FullResult) {
    // This runs after all tests complete and after built-in reporters write their files
    console.log('\n' + '='.repeat(60));
    console.log('Generating summary report...');
    console.log('='.repeat(60));

    try {
      const scriptPath = path.join(__dirname, 'generate-summary-report.ts');
      execSync(`npx tsx "${scriptPath}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('✓ Summary report generated successfully');
    } catch (error) {
      console.error('Failed to generate summary report:', error);
    }
  }
}

export default SummaryReporter;
