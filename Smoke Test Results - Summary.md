# Smoke Test Results - Summary

## Test Execution Overview

**Date & Time:** February 23, 2026 at 2:16 PM EST
**Total Duration:** 1 minute 18 seconds
**Environment:** CBO QA

---

## Test Results Summary

| Metric | Count |
|--------|-------|
| **Total Tests** | 1 |
| **Passed** | 1 |
| **Failed** | 0 |
| **Skipped** | 0 |

### Overall Status: ✓ PASSED

---

## Test Details

### Test: CBO Debtor Lookup call
- **Status:** ✓ Passed
- **Duration:** 1 minute 13 seconds
- **Browser:** Chromium (Desktop Chrome)
- **Test File:** Debtorlookup.spec.ts

#### What was tested:
- Successfully logged into CBO Dashboard
- Submitted debtor lookup request with test data
- Received successful response (HTTP 200)
- Validated CBO lookup results

#### API Response:
- **HTTP Status:** 200

#### API Response Body:
```json
{
  "note": "Raw response (could not parse as JSON)",
  "raw": "{\n  applicationId: '20260223_141641',\n  cboFound: true,\n  cboTypes: [\n    {\n      description: 'A registration from a different lender already exists.',\n      type: 'TWO_UNDER_THIRTY'\n    }\n  ],\n  debtorId: '20260223_141641',\n  lenderCount: 1,\n  registrationCount: 1,\n  registrationInformation: [\n    {\n      cmsLenderCode: 'CIBC',\n      cmsParentLenderCode: 'CIBC',\n      date: '2026-02-23T00:00:00',\n      jurisdiction: 'ON'\n    }\n  ],\n  requestId: '94a510ba-3353-48fd-9b88-edc35d3fa4d0'\n}"
}
```

---

## Summary

All smoke tests passed successfully. The CBO Debtor Lookup functionality is working as expected in the QA environment. The system correctly identified existing registrations and returned appropriate CBO information.

**Next Steps:** No action required. All tests are passing.

---

*Report generated from automated test run*
*Test logs saved to: test-logs\TestDataLog_2026-02-23.csv*
