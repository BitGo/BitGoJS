# Generate test vectors for new ZCash testnet consensus branch IDs

## 1. Get yourself a ZCash testnet node and upgrade it

- You may need to add a parameter like `-conf=/path/to/zcashd.conf` for each CLI command

- Double-check the upgrade is in place (`Canopy` is the next upgrade at time of writing)

```
$ zcash-cli getblockchaininfo | jq .upgrades

{
  "5ba81b19": {
    "name": "Overwinter",
    "activationheight": 207500,
    "status": "active",
    "info": "See https://z.cash/upgrade/overwinter/ for details."
  },
  "76b809bb": {
    "name": "Sapling",
    "activationheight": 280000,
    "status": "active",
    "info": "See https://z.cash/upgrade/sapling/ for details."
  },
  "2bb40e60": {
    "name": "Blossom",
    "activationheight": 584000,
    "status": "active",
    "info": "See https://z.cash/upgrade/blossom/ for details."
  },
  "f5b9230b": {
    "name": "Heartwood",
    "activationheight": 903800,
    "status": "active",
    "info": "See https://z.cash/upgrade/heartwood/ for details."
  },
  "e9ff75a6": {
    "name": "Canopy",
    "activationheight": 1028500,
    "status": "active",
    "info": "See https://z.cash/upgrade/canopy/ for details."
  }
}
```

## 2. Get the output script spent by the test transaction

- Since I am doing this for you now, you can skip this step and just copy the string

- The transactions in `test/fixtures/forks/zcash/transaction_builder.json` spend this output:

```
$ zcash-cli getrawtransaction \
1d7d9686ed5eeb7154c2fe659fd3eeea169057cb7bc996962945225139669b86 1 | jq .vout[1].scriptPubKey.hex

"a9146bce9ddfba5a1b420b797b751a0f9d848a816efe87"
```

## 3. Create the transaction to be signed

- The last parameter is `expiryHeight` which may need to be increased

```
$ zcash-cli createrawtransaction \
"[{\"txid\":\"1d7d9686ed5eeb7154c2fe659fd3eeea169057cb7bc996962945225139669b86\",\"vout\":1}]" \
"{\"tmKBPqa8qqKA7vrGq1AaXHSAr9vqa3GczzK\":1.99999000}" \
0 \
1150000

0400008085202f8901869b6639512245299696c97bcb579016eaeed39f65fec25471eb5eed86967d1d0100000000ffffffff0118beeb0b000000001976a91467d674a78a010c82c168718ba42a6bbb1e124af088ac00000000308c11000000000000000000000000
```

## 4. Sign the transaction using the private keys in the `.json` file

```
$ zcash-cli signrawtransaction \
0400008085202f8901869b6639512245299696c97bcb579016eaeed39f65fec25471eb5eed86967d1d0100000000ffffffff0118beeb0b000000001976a91467d674a78a010c82c168718ba42a6bbb1e124af088ac00000000308c11000000000000000000000000 \
"[{\"txid\":\"1d7d9686ed5eeb7154c2fe659fd3eeea169057cb7bc996962945225139669b86\", \"vout\":1,\"scriptPubKey\":\"a9146bce9ddfba5a1b420b797b751a0f9d848a816efe87\",\"redeemScript\":\"5221021dbb31392fa4857601d5ce2225429923688fede8c2d69e547542cbd88240903a2103c8249e0c474d95e09bb04254d342ef1177f8ca92d2a57356a16df25a4635a5382102fae89068c5c63426f83f0bd5492c4fd757e1f4b575b5d6d05592e8ba519bfd6e53ae\",\"amount\":2.00000000}]" \
"[\"cVmRcxsNdhiCigzrBfpv51JtExBPehtMNzUs9CBvymu1B3ch7LLa\",\"cV2mApzXqoGcGzyoDy5aaiZqQtV5G1HeEuoM1cgpEoiGAeagPeV2\"]"

{
  "hex": "0400008085202f8901869b6639512245299696c97bcb579016eaeed39f65fec25471eb5eed86967d1d01000000fdfd0000483045022100adfaa8d95d01c66d9d5176e588a31c56e85eb0635c6a1891c713f1526b9029fa022017f5b00c15eab347c77534308100c027da9b5aad86ebb824ca9f1c9f3a5c755b014730440220475d1a00d639a07ba6dc5fe0e15f5cfb7190b78322f80fcdb0603b8e7af5e61202202894684ec668187e81a873d53d4e367f38a002aa52f6aedcd685f07b94484a29014c695221021dbb31392fa4857601d5ce2225429923688fede8c2d69e547542cbd88240903a2103c8249e0c474d95e09bb04254d342ef1177f8ca92d2a57356a16df25a4635a5382102fae89068c5c63426f83f0bd5492c4fd757e1f4b575b5d6d05592e8ba519bfd6e53aeffffffff0118beeb0b000000001976a91467d674a78a010c82c168718ba42a6bbb1e124af088ac00000000308c11000000000000000000000000",
  "complete": true
}
```

## 5. Get the individual `scriptSig` values for each signer

- This one is a bit tricky. Decode the raw transaction from above and get the completed `scriptSig`:

```
$ zcash-cli -conf=/data/zcashd.conf decoderawtransaction 0400008085202f8901869b6639512245299696c97bcb579016eaeed39f65fec25471eb5eed86967d1d01000000fdfd0000483045022100adfaa8d95d01c66d9d5176e588a31c56e85eb0635c6a1891c713f1526b9029fa022017f5b00c15eab347c77534308100c027da9b5aad86ebb824ca9f1c9f3a5c755b014730440220475d1a00d639a07ba6dc5fe0e15f5cfb7190b78322f80fcdb0603b8e7af5e61202202894684ec668187e81a873d53d4e367f38a002aa52f6aedcd685f07b94484a29014c695221021dbb31392fa4857601d5ce2225429923688fede8c2d69e547542cbd88240903a2103c8249e0c474d95e09bb04254d342ef1177f8ca92d2a57356a16df25a4635a5382102fae89068c5c63426f83f0bd5492c4fd757e1f4b575b5d6d05592e8ba519bfd6e53aeffffffff0118beeb0b000000001976a91467d674a78a010c82c168718ba42a6bbb1e124af088ac00000000308c11000000000000000000000000 | jq .vin[0].scriptSig

{
  "asm": "0 3045022100adfaa8d95d01c66d9d5176e588a31c56e85eb0635c6a1891c713f1526b9029fa022017f5b00c15eab347c77534308100c027da9b5aad86ebb824ca9f1c9f3a5c755b[ALL] 30440220475d1a00d639a07ba6dc5fe0e15f5cfb7190b78322f80fcdb0603b8e7af5e61202202894684ec668187e81a873d53d4e367f38a002aa52f6aedcd685f07b94484a29[ALL] 5221021dbb31392fa4857601d5ce2225429923688fede8c2d69e547542cbd88240903a2103c8249e0c474d95e09bb04254d342ef1177f8ca92d2a57356a16df25a4635a5382102fae89068c5c63426f83f0bd5492c4fd757e1f4b575b5d6d05592e8ba519bfd6e53ae",
  "hex": "00483045022100adfaa8d95d01c66d9d5176e588a31c56e85eb0635c6a1891c713f1526b9029fa022017f5b00c15eab347c77534308100c027da9b5aad86ebb824ca9f1c9f3a5c755b014730440220475d1a00d639a07ba6dc5fe0e15f5cfb7190b78322f80fcdb0603b8e7af5e61202202894684ec668187e81a873d53d4e367f38a002aa52f6aedcd685f07b94484a29014c695221021dbb31392fa4857601d5ce2225429923688fede8c2d69e547542cbd88240903a2103c8249e0c474d95e09bb04254d342ef1177f8ca92d2a57356a16df25a4635a5382102fae89068c5c63426f83f0bd5492c4fd757e1f4b575b5d6d05592e8ba519bfd6e53ae"
}
```

- What you have in `asm` is:

`0 <signature #0>[ALL] <signature #1>[ALL] <redeem script>`


## 6. Add the values from above output to the `.json` file

- Like so (you need to replace `[ALL]` with `01`):

```
...
  "signs": [
    {
      "pubKeyIndex": 0,
      ...
      "scriptSig": "OP_0 <signature #0>01 OP_0 OP_0 <redeem script>"
    },
    {
      "pubKeyIndex": 1,
      ...
      "scriptSig": "OP_0 <signature #0>01 <signature #1>01 OP_0 <redeem script>"
    }
  ]
...
```

- You'll also need to update `expiryHeight` and `txHex`
