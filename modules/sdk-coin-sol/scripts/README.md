# Solana SDK Scripts

## Transaction Size Benchmark

Determines safe transaction limits for Solana legacy transactions (1232 byte limit).

**Run:**
```bash
npx tsx modules/sdk-coin-sol/scripts/transaction-size-benchmark.ts
```

**Output:**
- Console: Test results and recommended limits
- File: `transaction-size-benchmark-results.json`

**Tests:**
- Token transfers with ATA creation (new recipients)
- Token transfers without ATA creation (existing accounts)

