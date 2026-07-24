# HOW TO

If you are using a self-managed cold wallet and using a master key to manage multiple wallets, you probably need to specify a Key ID during wallet creation. This is the same as `coldDerivationSeed` in BitGo API documentation [link](https://developers.bitgo.com/api/express.wallet.generate). In this documentation, we will show you how to recover a wallet with a Key ID.

## Prerequisites
- Have a BitGo self-managed cold wallet.
- Have keycard of the BitGo wallet in hand.
- Have encrypted master user key and encryption password.
- Have encrypted backup key and backup key password.
- Set up air-gapped machines with BitGo Offline Vault Console (OVC) (1 for the user key and 1 for the backup key).
- Set up BitGo Wallet Recovery Wizard in an internet-connected machine.

## Recover Base Wallet
### Build Unsigned Sweep
1. Open BitGo Wallet Recovery Wizard. Select `Build Unsigned Sweep` from the menu.
2. Select a coin in the `currency` dropdown, e.g. `TTRX` (Testnet Tron).
3. Fill in the `Self-managed cold wallet details` section.
    - `User public key`: The user public key in the key card.
    - `User Key ID (optional)`: The Key ID of the user key in the key card.
    - `Backup public key`: The backup public key in the key card.
    - `BitGo public key`: The BitGo public key in the key card.
    - `Destination Address`: The recover destination address.
4. Click `Recover Funds` button. An unsigned transaction with name `ttrx-unsigned-sweep-xxx.json` will be generated locally.

### Sign with User Key in OVC 1
1. Copy the unsigned transaction file to the air-gapped machine with OVC.
2. Select `Sign Transactions` under `Transactions` from the menu.
3. Upload the unsigned transaction file and click `Continue` button.
4. Upload the encrypted master user key and key in the encryption password.
5. Click `Continue` button. A half-signed transaction with name `Half-signed-ttrx-unsigned-sweep-xxx-xxx` will be generated locally.

### Sign with Backup Key in OVC 2
1. Copy the half-signed transaction file to the other air-gapped machine with OVC.
2. Select `Sign Transactions` under `Transactions` from the menu.
3. Upload the half-signed transaction file and click `Continue` button.
4. Upload the encrypted backup key and key in the backup key password.
5. Click `Continue` button. A fully-signed transaction with name `Full-signed-Half-signed-ttrx-unsigned-sweep-xxx-xxx-xxx` will be generated locally.

### Submit Transaction
1. Copy the fully-signed transaction file to the internet-connected machine.
2. Fetch the txHex field within the fully-signed transaction file.
3. Broadcast the transaction to a fullnode with the txHex, e.g. for Tron, you can do the following:
```bash
curl --location 'https://api.shasta.trongrid.io/wallet/broadcasttransaction' \
--header 'Content-Type: application/json' \
--data '<txHex>'
```
