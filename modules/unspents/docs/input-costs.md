# Input Costs
This document contains the worst-case input costs for various script types and spend types.
The input costs are calculated using the `Dimensions` class from `@bitgo/unspents`.

| Script Type | Chain Codes | Spend Type | Input Size (Virtual Bytes) | Relative Size (p2trMusig2 = 1.00) |
| --- | --- | --- | --- | --- |
| p2sh | 0/1 | all | 298 | 5.14 |
| p2shP2wsh | 10/11 | all | 140 | 2.41 |
| p2wsh | 20/21 | all | 105 | 1.81 |
| p2tr | 30/31 | Script Path, Level 2 (Backup/User, Backup/BitGo) | 116 | 2.00 |
| p2tr | 30/31 | Script Path, Level 1 (User/BitGo) | 108 | 1.86 |
| p2trMusig2 | 40/41 | Script Path (Backup/User, Backup/BitGo) | 108 | 1.86 |
| p2trMusig2 | 40/41 | Key Path (User/BitGo) | 58 | 1.00 |