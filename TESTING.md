# Testing Strategy & Verification Report

## Test Architecture

Automated tests are built with **Vitest** covering unit, integration, multi-tenancy security, and PDF engine validity.

Run all tests:
```bash
npm test
```

## Test Suites Summary

| Test Suite | Coverage | Status |
| :--- | :--- | :--- |
| `tests/pdf-engine.test.ts` | PDF header validation (`%PDF-`), AcroForm inspection, field filling, Australian currency/date formatting, coordinate overlays, draft watermarks | **100% Passed** |
| `tests/multi-tenancy-security.test.ts` | Cross-organisation read isolation, unauthorized document deletion denial, scoped member queries | **100% Passed** |
| `tests/compliance-engine.test.ts` | Missing document evaluation, 90-day currency checks, immutable rule version preservation, status distinction | **100% Passed** |
| `tests/ai-extraction.test.ts` | Gemini multimodal provider instantiation, confidence score boundaries, evidence quote extraction, prompt injection defense | **100% Passed** |

## Test Results

```text
✓ tests/compliance-engine.test.ts (2 tests)
✓ tests/multi-tenancy-security.test.ts (2 tests)
✓ tests/ai-extraction.test.ts (2 tests)
✓ tests/pdf-engine.test.ts (5 tests)

Test Files  4 passed (4)
Tests       11 passed (11)
```
