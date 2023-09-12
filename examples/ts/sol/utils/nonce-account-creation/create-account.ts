import { KeyPair } from "@bitgo/sdk-coin-sol"
import { writeFileSync } from "fs"

// This script will generate a new keypair and save it to json/keypair.json
// The generated keypair will be used to create nonce accounts
// ** DO NOT USE THIS KEYPAIR FOR ANYTHING ELSE **
// ** RUNNING THIS SCRIPT TWICE WILL OVERWRITE THE DATA ON THE FILE **

// to run this script you can use the following command:
// npx ts-node create-account.ts

async function main() {
  const newKeyPair = new KeyPair()
  const { prv: privateKey, pub: publicKey } = newKeyPair.getKeys()

  const result = {
    address: publicKey,
    privateKey,
  }
  writeFileSync('json/keypair.json', JSON.stringify(result))
  console.log('New keypair generated and saved to json/keypair.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(-1)
})
