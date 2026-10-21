# Statutory Compliance Rules Framework

## 1. Engine Methodology

The platform implements a configurable statutory compliance rules engine rather than a static checklist.

- **Immutability & Versioning**: When a rule changes, past assessments retain the exact rule version (`rule_version`) active at the time of review.
- **States Supported**:
  - `not_assessed`: Rule has not yet been processed.
  - `incomplete`: Missing mandatory documents or required fields.
  - `awaiting_review`: Extracted fields require human verification.
  - `needs_correction`: Conflicting data flagged by reviewer.
  - `exception_requiring_review`: Conditional requirement requires formal approval.
  - `verified_complete`: Supporting documents cited, currency limits satisfied, and human sign-off obtained.
  - `not_applicable`: Rule excluded for recorded legal reason.

## 2. Sample Rules Catalog (Jurisdiction: AU-QLD)

*Notice: Sample rules provided for the development framework. Authorised legal/credit professionals must review and approve rules before production deployment.*

### Mortgage & Finance
1. **`MF-NCCP-VOI`**: Borrower Verification of Identity (VOI) Standard
   - *Reference*: National Consumer Credit Protection Act 2009 (Cth) s130 & ARNECC Standard.
   - *Requirement*: Primary identification document cited and verified within currency.
2. **`MF-INCOME-CURRENCY`**: 90-Day Income Currency Verification
   - *Reference*: ASIC Regulatory Guide 209 (Responsible Lending Conduct).
   - *Requirement*: Payslips or bank statements must be issued within 90 days of application submission.
3. **`MF-HEM-LIVING-EXPENSES`**: Living Expenses Benchmark Review
   - *Reference*: Household Expenditure Measure (HEM) comparative assessment.

### Solicitors & Conveyancing (Queensland)
1. **`CV-QLD-CONTRACT-VALIDATION`**: REIQ / QLS Contract of Sale Execution Check
   - *Reference*: Property Law Act 1974 (QLD) s59 & Land Title Act 1994 (QLD).
   - *Requirement*: Verified property address, lot/plan description, consideration price, and settlement date.
2. **`CV-CLIENT-AUTHORITY`**: Client Legal Retainer & Authority Form
   - *Reference*: Legal Profession Act 2007 (QLD).
3. **`CV-CONFLICT-CHECK-RECORD`**: Conflict of Interest Screening
   - *Reference*: Australian Solicitors Conduct Rules (Rules 10 & 11).

### Real Estate & Property Management (Queensland)
1. **`RE-QLD-PO-ACT-APPOINTMENT`**: Form 6 Property Occupations Appointment Check
   - *Reference*: Property Occupations Act 2014 (QLD) Part 4.
2. **`RE-QLD-TENANCY-BOND-LODGEMENT`**: RTA Form 2 Bond Lodgement Completeness
   - *Reference*: Residential Tenancies and Rooming Accommodation Act 2008 (QLD) s116.
3. **`RE-SMOKE-ALARM-DISCLOSURE`**: Interconnected Photoelectric Smoke Alarm Safety Record
   - *Reference*: Fire and Emergency Services Act 1990 (QLD).
