# Smoke Test Results - Summary

## Test Execution Overview

**Date & Time:** February 24, 2026 at 5:00 PM EST
**Total Duration:** 1 minute 7 seconds
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
- **Duration:** 1 minute 3 seconds
- **Browser:** Chromium (Desktop Chrome)
- **Test File:** Debtorlookup.spec.ts

#### What was tested:
- Successfully logged into CBO Dashboard
- Submitted debtor lookup request with test data
- Received successful response (HTTP 200)
- Validated CBO lookup results

#### API Response:
- **HTTP Status:** 200
- **Application ID:** 20260224_170009
- **Jurisdiction:** Ontario (ON)

#### API Response Body:
```json
{
  "applicationId": "20260224_170009",
  "cboFound": true,
  "cboTypes": [
    {
      "description": "A registration from a different lender already exists.",
      "type": "TWO_UNDER_THIRTY"
    }
  ],
  "debtorId": "20260224_170009",
  "lenderCount": 1,
  "registrationCount": 1,
  "registrationInformation": [
    {
      "cmsLenderCode": "CIBC",
      "cmsParentLenderCode": "CIBC",
      "date": "2026-02-24T00:00:00",
      "jurisdiction": "ON"
    }
  ],
  "requestId": "1a1d5c33-4ac2-4167-b381-bbcdc174514b"
}
```

---

## Summary

All smoke tests passed successfully. The CBO Debtor Lookup functionality is working as expected in the QA environment. The system correctly identified existing registrations and returned appropriate CBO information.

**Next Steps:** No action required. All tests are passing.

---

*Report generated from automated test run*
*Test logs saved to: test-logs\TestDataLog_2026-02-24.csv*
