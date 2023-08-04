# `utxo-bin`

This repository contains a CLI tool for parsing BitGo wallet transactions (withdrawals) and
formatting them for terminal output.


# Installation

## npm

To install the tool globally, run

```bash
npm install --global @bitgo/utxo-bin
```

This will enable the `utxo-bin` tool to be run from anywhere on your system.

## npx

To run the tool without installing, you can use `npx`. Be aware that this will download the
package every time you run it.

```bash
npx @bitgo/utxo-bin ...
```

## parseTx

#### From file

```bash
utxo-bin -n bitcoin parseTx <path-to-file>
```

#### From hex or base64

```bash
utxo-bin -n bitcoin parseTx --data <hex/base64>
```

#### From stdin

```bash
echo <txhex> | utxo-bin -n bitcoin parseTx --stdin
```

```bash
utxo-bin -n bitcoin parseTx --stdin
<paste txhex>
<CTRL-D>
```

#### From clipboard

```bash
utxo-bin -n bitcoin parseTx --clipboard
```

#### From txid

```bash
utxo-bin -n bitcoin parseTx --txid b0b7e5c2fbbbeb42478f91e1c14b300624a9419631e70dd1564084fb28a55155
```

#### Lookup inputs

```bash
utxo-bin -n bitcoin parseTx \
  --txid b0b7e5c2fbbbeb42478f91e1c14b300624a9419631e70dd1564084fb28a55155 \
  --fetchInputs
```

#### Formats

Supported transactions formats are

* full-signed transactions
* half-signed transactions in proprietary bitcoinjs-lib format ("legacy")
* half-signed transactions in PSBT/BIP174 format

Supported encodings are hex and base64.

## parseAddress

```
utxo-bin -n bitcoin parseAddress 3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC
```

Convert to other networks:

```
utxo-bin -n bitcoin parseAddress 3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC --convert
```

## Generate addresses
```
utxo-bin generateAddresses \
    --userKey xpub661MyMwAqRbcEvoSo4qrsT5xhByHzUoBjm88hdCPohF1rdQ4TkntuHfccN2N7FbmAmBgmaBxD7VY1QZ43YfgGRLBL37BBkBhYbezgnsPRVP \
    --backupKey xpub661MyMwAqRbcF8Evdu2twZS3ELM8Wg6DqSrVR8GpvCeXMgj3rNPf4nasU1FBzX9yeWYTfyikk7rfuWS5FkMqGnh3HpxeeYtuQEx7FVq5FZa \
    --bitgoKey xpub661MyMwAqRbcEnKX5fhLKdrixijBk4sYCZ7gQ1qRUmib2dXragQVAjv9GmXL4tusTKRwcrYAGrXGETFkFxKFSBCFUAuqdbdM9u2uyQtYkUW
```

## Development

```bash
git clone https://github.com/BitGo/BitGoJS.git
yarn install
cd modules/utxo-bin
yarn ts-node bin/index.ts ...
```

See the toplevel [DEVELOPERS.md](../../DEVELOPERS.md) for more information.
