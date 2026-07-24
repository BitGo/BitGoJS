# HOW TO

## Create an EdDSA TSS Self-Managed Cold Wallet

This guide explains how to create a self-managed TSS cold wallet for EdDSA assets using the provided repository.

## Prerequisites

- Set up 2 air-gapped machines with the BitGo Offline Vault Console (OVC) (1 for the user key and 1 for the backup key).
- Install Node.js
- Install Node Package Manager (npm)
- Install the necessary dependencies by running `npm install` from the root directory of the repository.

## Steps

1. Open OVC on one of the air-gapped machines. Select `Generate TSS Key Share` from the menu. Select `OVC 1` as the instance.
2. Open the OVC on the other the air-gapped machine. Select `Generate TSS Key Share` from the menu. Select `OVC 2` as the instance.
**Note:** Keep both instances of the OVC open until you finish creating the wallet.
3. In OVC 1, select the `Single Private Key` option and download the JSON.
4. In OVC 2, upload the JSON and select the `Single Private Key` option. Download the updated JSON file.
5. Open the script `create-smc-wallet-step-1` and follow the instructions. Execute it using `npm run step1`. This generates `toOVC1-step-1-timestamp.json`. Make note of the BitGo key ID displayed in the console.
6. In OVC 1, upload the JSON file generated in the previous step. Download the updated JSON, the private-key file, and the public-key file.
**Note:** Store the private-key file in a secure location.
7. In OVC 2, upload the JSON generated previous step. Download the private-key file and the public-key file.
**Note:** Store the private-key file in a secure location.
8. Open the script `create-smc-wallet-step-2` and follow the instructions. Include the public-key files from OVC 1 and OVC 2 and the BitGo key ID from step 5. Execute the script using `npm run step2`. This creates the wallet, and stores the relevant information in `wallet-walletName.json` (for informational purposes only).