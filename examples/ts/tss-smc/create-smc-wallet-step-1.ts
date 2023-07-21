import { BitGo } from "bitgo";
import { readFileSync, writeFileSync } from "fs";

// This creates the BitGo Key from the OVC shares
// Put the file from OVC 2 in the JSON folder and name it fromOVC2-step-1.json
// This outputs a JSON that you use in OVC 1
// Save the logged BitGo key ID for step 2

// Set the environment variables here
const bitgo = new BitGo({ env: "test" }); // "test" or "prod"
const accessToken = "v2..."; // Access token
const coinName = "tsol"; // "tsol" for testnet, "sol" for mainnet

async function createSMCWalletStep1() {
  const rawdata = readFileSync("./json/fromOVC2-step-1.json").toString();
  const parsedData = JSON.parse(rawdata);

  bitgo.authenticateWithAccessToken({ accessToken });
  const bitgoCoin = bitgo.coin(coinName);

  const { bitGoOutputJsonForOvc, bitGoKeyId } = await bitgoCoin
    .keychains()
    .createTssBitGoKeyFromOvcShares(parsedData);

  const toOvc1Stringified = JSON.stringify(bitGoOutputJsonForOvc);
  const fileName = "toOVC1-step-1-" + Date.now() + ".json"
  writeFileSync(`./json/${fileName}`, toOvc1Stringified);
  console.log('File created: ' + fileName)

  console.log('Make sure to save this Bitgo key id for step 2: ' + bitGoKeyId);

}

createSMCWalletStep1().catch((e) => console.error(e));
