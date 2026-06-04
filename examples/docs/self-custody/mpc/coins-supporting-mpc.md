# Chains và coins hỗ trợ tạo ví MPC (TSS)

Tài liệu này liệt kê các chain/coin trong BitGoJS **có thể tạo ví MPC (TSS)** theo logic SDK, và phân biệt hỗ trợ **TSS nói chung** với **MPCv2** (wallet version 5/6).

---

## Điều kiện trong SDK

Trong [wallets.ts](modules/sdk-core/src/bitgo/wallet/wallets.ts):

1. **Tạo ví TSS (bất kỳ version)**
   Coin phải có `supportsTss() === true` (implement trong từng module coin).

2. **Tạo ví MPCv2 (walletVersion 5 hoặc 6)**
   Ngoài `supportsTss()`, coin còn phải có feature **`CoinFeature.MPCV2`** trong statics (`getConfig().features`), ví dụ từ [coinFeatures.ts](modules/statics/src/coinFeatures.ts).

3. **Enterprise**
   Tạo ví TSS luôn yêu cầu `enterprise` (và với MPCv2, backend có thể yêu cầu cấu hình TSS cho từng coin).

**Lưu ý:** Backend BitGo (API) có thể giới hạn thêm theo môi trường (test/prod) hoặc theo từng coin; nếu backend không hỗ trợ TSS cho một coin thì dù SDK cho phép, việc tạo ví vẫn có thể thất bại.

---

## Coins có `supportsTss() === true` (có thể tạo ví TSS trong SDK)

Danh sách dựa trên các module override `supportsTss()` trả về `true`:

| Family / Chain   | Coin (ví dụ) | Ghi chú |
|------------------|--------------|--------|
| **EVM / ETH-like** | eth, hteth, bsc, tbsc, polygon, tpolygon, arbeth, opeth, topeth, bera, oas, coredao, apechain, soneium, tempo, mon, world, wemix, xdc, flr, vet | Nhiều chain EVM dùng EVM_FEATURES hoặc feature set riêng có TSS/MPCV2 |
| **Solana**       | sol, tsol    | EdDSA TSS |
| **Cosmos**       | atom, tatom, tia, ttia, … (cosmos sidechains) | CosmosCoin, COSMOS_SIDECHAIN_FEATURES |
| **Polkadot**     | dot          | Substrate, EdDSA |
| **Sui**          | sui          | EdDSA |
| **Aptos**        | apt          | EdDSA |
| **TON**          | ton          | EdDSA |
| **Near**         | near         | EdDSA |
| **Cardano**      | ada          | EdDSA |
| **ICP**          | icp, ticp    | ECDSA, SHA256_WITH_ECDSA_TSS |
| **Stellar**      | sgb          | |
| **Other**        | stt, iota, canton, tao, polyx, vet, ton, xdc | Một số có TSS/MPCV2 trong statics |

*(Danh sách coin đăng ký đầy đủ nằm trong [coinFactory](modules/bitgo/src/v2/coinFactory.ts) và [statics](modules/statics/src/allCoinsAndTokens.ts).)*

---

## Coins có feature MPCV2 (có thể tạo ví MPCv2 – walletVersion 5/6)

Các coin có **`CoinFeature.MPCV2`** trong statics mới vượt qua check khi gọi `generateWallet` với `walletVersion: 5` hoặc `6` (và `multisigType: 'tss'`). Ví dụ từ [coinFeatures.ts](modules/statics/src/coinFeatures.ts):

- **EVM_FEATURES** (dùng cho nhiều EVM chain): baseeth, opbnb, fantom, og, tempo, wemix, …
- **POLYGON_FEATURES**: polygon, tpolygon
- **BSC_FEATURES**: bsc, tbsc
- **ARBETH_FEATURES**: arbeth, tarbeth
- **OPETH_FEATURES**: opeth, topeth
- **BERA_FEATURES**: bera
- **OAS_FEATURES**: oas
- **COREDAO_FEATURES**: coredao
- **APECHAIN_FEATURES**: apechain
- **SONEIUM_FEATURES**: soneium
- **VET_FEATURES**: vet
- **ICP_FEATURES**: icp (và có thể ticp tùy statics)
- **COSMOS_SIDECHAIN_FEATURES**: atom, tia, … (cosmos sidechains dùng chung feature set có MPCV2)

*(Chi tiết từng coin xem trong [coinFeatures.ts](modules/statics/src/coinFeatures.ts) và [allCoinsAndTokens.ts](modules/statics/src/allCoinsAndTokens.ts).)*

**BTC và SOL:**
- **BTC** (abstract-utxo): không override `getMPCAlgorithm()`, mặc định base coin throw; trong SDK không đi luồng TSS ECDSA/MPCv2. Backend có thể hỗ trợ TSS BTC theo cơ chế khác.
- **SOL**: dùng EdDSA; hỗ trợ TSS (`supportsTss() === true`) nhưng không dùng khái niệm MPCv2 (MPCv1/MPCv2 là cho ECDSA). Tạo ví TSS SOL không qua `walletVersion` 5/6 như EVM.

---

## Tóm tắt

- **Có thể tạo ví MPC (TSS)** cho mọi coin có `supportsTss() === true` trong SDK (bảng trên); điều kiện bắt buộc là có **enterprise**.
- **Có thể tạo ví MPCv2** (walletVersion 5/6) chỉ cho các coin có **`CoinFeature.MPCV2`** trong statics (EVM có MPCV2, polygon, bsc, arbeth, opeth, bera, oas, coredao, apechain, soneium, vet, icp, cosmos sidechains, …).
- **Không phải mọi chain/coin** trong repo đều hỗ trợ TSS: chỉ những coin đã implement `supportsTss(): true` và (nếu cần MPCv2) có feature MPCV2.
- Hỗ trợ thực tế còn phụ thuộc **backend BitGo** (cấu hình TSS theo môi trường và theo coin); có thể dùng script [get-multisig-type-versions.js](../../js/get-multisig-type-versions.js) để xem `multiSigTypeVersion` trả về từ API cho từng coin.
