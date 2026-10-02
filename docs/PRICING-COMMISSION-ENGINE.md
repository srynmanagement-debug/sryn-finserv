# Pricing & Commission Engine Blueprint

## 1. Multi-Tier Calculation Types
Supported calculation types:
- **FIXED**: Fixed currency amount per disbursal / approval (e.g., ₹1,500 per approved credit card).
- **PERCENTAGE**: Percentage of loan amount disbursed (e.g., 2.5% of disbursed loan amount).
- **SLAB**: Progressive percentage or fixed tiers based on volume or disbursal amount (e.g., 2% for ₹1L-5L, 3% for >₹5L).

## 2. Multi-Level Commission Hierarchy
When an application reaches `DISBURSED` status, the commission engine evaluates rules for each participant in the attribution chain:
- **Retailer / Sourcing Agent**: Primary sourcing payout.
- **Distributor**: Channel master overrides.
- **Team Leader**: Team performance override.
- **Manager**: Branch / region override.

## 3. Historical Snapshot Preservation
When a customer submits an application, the backend captures an immutable JSON snapshot of active pricing and commission rules:
- Prevents future rule modifications from altering commission expectations for applications already in flight.
- Preserved in `applications.pricing_snapshot` and `applications.commission_snapshot`.

## 4. Commission Ledger State Machine
Commission events are recorded in `commission_ledger` following a financial state machine:
```
[PENDING] ───► [APPROVED] ───► [PAYABLE] ───► [PAID]
    │                                          │
    └───► [REVERSED]                           └───► [CLAWBACK]
```
