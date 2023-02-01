# PSBTs (Partially Signed Bitcoin Transactions)

### Background
PSBTs aim to standardize the format in which multiple parties across platforms can construct and sign UTXO transactions. Even though Bitcoin
is in the name, PSBTs can be used for all UTXO coins.

PSBTs are basically a transaction with some metadata structured in a very specific way 
(see [BIP174 Specification](https://en.bitcoin.it/wiki/BIP_0174#Specification) for more details). You do not need to populate
all of these fields, only the data you need to know for signing. At signing time, the only thing that you need is the PSBT
and your Bip32Interface signer.

### Overview of PSBT implementation
The `UtxoPsbt`, the Bitgo implementation of the PSBT, is an extension of
the `Psbt` class in `bitcoinjs-lib`. We extend the class to work seamlessly with other UTXO coins as well such as Zcash,
Dash, Bitcoin Cash, Doge, and Bitcoin Gold. Additionally, we provide helpers for Bitgo specific multisig creation, 
streamlining your experience.




### References
[`UtxoPsbt` - Bitgo implementation of PSBTs](../../../modules/utxo-lib/src/bitgo/UtxoPsbt.ts)\
[BIP174 - Partially Signed Bitcoin Transaction Format](https://en.bitcoin.it/wiki/BIP_0174)\
[BIP370 - PSBT version 2](https://en.bitcoin.it/wiki/BIP_0370)\
[`Psbt` - bitcoinjs-lib PSBT implementation](https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/psbt.ts)
