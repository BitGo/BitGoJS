module.exports.getHalfSignedTethFromVault = function() {
  return {
    paramsFromVault: {
      "txPrebuild": {
        "halfSigned": {
          "recipients": [
            {
              "address": "0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b",
              "amount": "1000000000000000000",
              "value": "1.000000000000000000 TETH"
            }
          ],
          "expireTime": 1549311285,
          "contractSequenceId": 1,
          "operationHash": "0x19e8caf58f41071b8522e57d84686458667221e70a584e55bfc3af0c02a143f9",
          "signature": "0x45864316d0c882ace5a3d5a000db8b9047835281c7dc9759441424f3f470d48821f9baebc35e4d1955af1cb072d4e9b1fa4d4dddcb7a859ba6d3bbe33f6efdfb1c"
        },
        "coin": "teth",
        "gasPrice": "20000000000",
        "gasLimit": "500000",
        "amount": "1000000000000000000",
        "walletContractAddress": "0x27121c36c854c8775166f01ee9b2a5cc012718af",
        "recipients": [
          {
            "address": "0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b",
            "amount": "1000000000000000000",
            "value": "1.000000000000000000 TETH",
            "$$hashKey": "object:20"
          }
        ],
        "fee": "0.010000000000000000 TETH",
        "total": "1.010000000000000009 TETH",
        "isUnknownTokenAddress": false
      },
      "prv": "xprv9s21ZrQH143K4Vt5t2P7wySzHWNLZrCzwHBJFGnr9nnLVW45iCvfT9iSpEsmnnkQxxSrtSSfU9APZRo4oR28z6kqQ2HxBRWec4dti5APG1K",
      "recipients": [
        {
          "address": "0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b",
          "amount": "1000000000000000000",
          "value": "1.000000000000000000 TETH",
          "$$hashKey": "object:20"
        }
      ],
      "signingKeyNonce": 1,
      "walletContractAddress": "0x27121c36c854c8775166f01ee9b2a5cc012718af",
      "isLastSignature": true
    },
    expectedResult: {
      txHex: 'f901cb018504a817c8008307a1209427121c36c854c8775166f01ee9b2a5cc012718af80b9016439125215000000000000000000000000ebd0d0c1f101ab5a27ef1c54430e0c4b1166548b0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000005c589d35000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004145864316d0c882ace5a3d5a000db8b9047835281c7dc9759441424f3f470d48821f9baebc35e4d1955af1cb072d4e9b1fa4d4dddcb7a859ba6d3bbe33f6efdfb1c000000000000000000000000000000000000000000000000000000000000001ba0ea29106959adf3042ff3ee4955db795ec2b0ddb994c4a244fa3ea5a891d49109a06efee03668c6579f4ece9362b2e682a313a89224d9bc73e72cbd9364fd6aa3c4'
    }
  }
}
