# `utxo-bin`

This repository contains a CLI tool for parsing BitGo wallet transactions (withdrawals) and
formatting them for terminal output.

# Installation

```bash
npm install --global @bitgo/utxo-bin
```

# Sample Usage

## parseTx

#### From hex

```bash
utxo-bin -n bitcoin parseTx --stdin
<paste txhex>
<Ctrl-D>
```

Or

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
