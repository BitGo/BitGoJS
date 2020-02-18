import { Origination, Reveal} from "../../src/coin/xtz/iface";

/**
 * Create a reveal operation for a public key.
 *
 * @param {string} counter Source account next counter
 * @param {string} source Source account address
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} balance New multisig account initial balance taken from the source account
 * @param {string} pubKey The public key to reveal
 * @return An origination operation
 */
export function revealOperation(
    counter: string,
    source: string,
    fee: string,
    gasLimit: string,
    storageLimit: string,
    balance: string,
    pubKey: string): Reveal {
  return {
    kind: 'reveal',
    counter,
    source,
    fee,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    balance,
    public_key: pubKey,
  };
}

/**
 * Create an origination operation for the generic multisg contract. It does not create a reveal
 * operation for the source account.
 *
 * @param {string} counter Source account next counter
 * @param {string} source Source account address
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} balance New multisig account initial balance taken from the source account
 * @param {string[]} pubKeys List of public keys of the multisig owner
 * @return An origination operation
 */
export function genericMultisigOriginationOperation(
    counter: string,
    source: string,
    fee: string,
    gasLimit: string,
    storageLimit: string,
    balance: string,
    pubKeys: string[]): Origination {
  const walletPublicKeys: any[] = [];
  pubKeys.forEach(pk => walletPublicKeys.push({ string: pk }));
  return {
    kind: 'origination',
    counter,
    source,
    fee,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    balance,
    script: {
      code: genericMultisig,
      storage: { prim: 'Pair',
        args: [{
          int: '0'
        }, {
          prim: 'Pair',
          args: [ {
            int: '2' },
            walletPublicKeys]
        }]
      },
    },
  };
}

/**
 * Generic Multisig contract from https://github.com/murbard/smart-contracts/blob/master/multisig/michelson/generic.tz
 */
export const genericMultisig = [{
  "prim": "parameter",
  "args": [{
    "prim": "or",
    "args": [{ "prim": "unit", "annots": ["%default"] },
      {
        "prim": "pair",
        "args": [{
          "prim": "pair",
          "args": [{
            "prim": "nat",
            "annots": ["%counter"]
          },
            {
              "prim": "or",
              "args": [{
                "prim": "lambda",
                "args": [{ "prim": "unit" },
                  {
                    "prim": "list",
                    "args": [{
                      "prim": "operation"
                    }]
                  }],
                "annots": ["%operation"]
              },
                {
                  "prim": "pair",
                  "args": [{
                    "prim": "nat",
                    "annots": ["%threshold"]
                  },
                    {
                      "prim": "list",
                      "args": [{ "prim": "key" }],
                      "annots": ["%keys"]
                    }],
                  "annots": ["%change_keys"]
                }],
              "annots": [":action"]
            }],
          "annots": [":payload"]
        },
          {
            "prim": "list",
            "args": [{
              "prim": "option",
              "args": [{ "prim": "signature" }]
            }],
            "annots": ["%sigs"]
          }],
        "annots": ["%main"]
      }]
  }]
},
  {
    "prim": "storage",
    "args": [{
      "prim": "pair",
      "args": [{
        "prim": "nat",
        "annots": ["%stored_counter"]
      },
        {
          "prim": "pair",
          "args": [{
            "prim": "nat",
            "annots": ["%threshold"]
          },
            {
              "prim": "list",
              "args": [{ "prim": "key" }],
              "annots": ["%keys"]
            }]
        }]
    }]
  },
  {
    "prim": "code",
    "args": [[[[{ "prim": "DUP" }, { "prim": "CAR" },
      {
        "prim": "DIP",
        "args": [[{ "prim": "CDR" }]]
      }]],
      {
        "prim": "IF_LEFT",
        "args": [[{ "prim": "DROP" },
          {
            "prim": "NIL",
            "args": [{ "prim": "operation" }]
          },
          { "prim": "PAIR" }],
          [{
            "prim": "PUSH",
            "args": [{ "prim": "mutez" },
              { "int": "0" }]
          },
            { "prim": "AMOUNT" },
            [[{ "prim": "COMPARE" },
              { "prim": "EQ" }],
              {
                "prim": "IF",
                "args": [[],
                  [[{ "prim": "UNIT" },
                    { "prim": "FAILWITH" }]]]
              }],
            { "prim": "SWAP" }, { "prim": "DUP" },
            {
              "prim": "DIP",
              "args": [[{ "prim": "SWAP" }]]
            },
            {
              "prim": "DIP",
              "args": [[[[{ "prim": "DUP" },
                { "prim": "CAR" },
                {
                  "prim": "DIP",
                  "args": [[{ "prim": "CDR" }]]
                }]],
                { "prim": "DUP" },
                { "prim": "SELF" },
                { "prim": "ADDRESS" },
                { "prim": "PAIR" },
                { "prim": "PACK" },
                {
                  "prim": "DIP",
                  "args": [[[[{ "prim": "DUP" },
                    {
                      "prim": "CAR",
                      "annots": ["@counter"]
                    },
                    {
                      "prim": "DIP",
                      "args": [[{
                        "prim": "CDR"
                      }]]
                    }]],
                    {
                      "prim": "DIP",
                      "args": [[{ "prim": "SWAP" }]]
                    }]]
                },
                { "prim": "SWAP" }]]
            },
            [[{ "prim": "DUP" },
              {
                "prim": "CAR",
                "annots": ["@stored_counter"]
              },
              {
                "prim": "DIP",
                "args": [[{ "prim": "CDR" }]]
              }]],
            {
              "prim": "DIP",
              "args": [[{ "prim": "SWAP" }]]
            },
            [[{ "prim": "COMPARE" },
              { "prim": "EQ" }],
              {
                "prim": "IF",
                "args": [[],
                  [[{ "prim": "UNIT" },
                    { "prim": "FAILWITH" }]]]
              }],
            {
              "prim": "DIP",
              "args": [[{ "prim": "SWAP" }]]
            },
            [[{ "prim": "DUP" },
              {
                "prim": "CAR",
                "annots": ["@threshold"]
              },
              {
                "prim": "DIP",
                "args": [[{
                  "prim": "CDR",
                  "annots": ["@keys"]
                }]]
              }]],
            {
              "prim": "DIP",
              "args": [[{
                "prim": "PUSH",
                "args": [{ "prim": "nat" },
                  { "int": "0" }],
                "annots": ["@valid"]
              },
                { "prim": "SWAP" },
                {
                  "prim": "ITER",
                  "args": [[{
                    "prim": "DIP",
                    "args": [[{ "prim": "SWAP" }]]
                  },
                    { "prim": "SWAP" },
                    {
                      "prim": "IF_CONS",
                      "args": [[[{
                        "prim": "IF_NONE",
                        "args": [[{
                          "prim": "SWAP"
                        },
                          {
                            "prim": "DROP"
                          }],
                          [{
                            "prim": "SWAP"
                          },
                            {
                              "prim": "DIP",
                              "args": [[{
                                "prim": "SWAP"
                              },
                                {
                                  "prim": "DIP",
                                  "args": [{
                                    "int": "2"
                                  },
                                    [[{
                                      "prim": "DIP",
                                      "args": [[{
                                        "prim": "DUP"
                                      }]]
                                    },
                                      {
                                        "prim": "SWAP"
                                      }]]]
                                },
                                [[{
                                  "prim": "DIP",
                                  "args": [{
                                    "int": "2"
                                  },
                                    [{
                                      "prim": "DUP"
                                    }]]
                                },
                                  {
                                    "prim": "DIG",
                                    "args": [{
                                      "int": "3"
                                    }]
                                  }],
                                  {
                                    "prim": "DIP",
                                    "args": [[{
                                      "prim": "CHECK_SIGNATURE"
                                    }]]
                                  },
                                  {
                                    "prim": "SWAP"
                                  },
                                  {
                                    "prim": "IF",
                                    "args": [[{
                                      "prim": "DROP"
                                    }],
                                      [{
                                        "prim": "FAILWITH"
                                      }]]
                                  }],
                                {
                                  "prim": "PUSH",
                                  "args": [{
                                    "prim": "nat"
                                  },
                                    {
                                      "int": "1"
                                    }]
                                },
                                {
                                  "prim": "ADD",
                                  "annots": ["@valid"]
                                }]]
                            }]]
                      }]],
                        [[{
                          "prim": "UNIT"
                        },
                          {
                            "prim": "FAILWITH"
                          }]]]
                    },
                    { "prim": "SWAP" }]]
                }]]
            },
            [[{ "prim": "COMPARE" },
              { "prim": "LE" }],
              {
                "prim": "IF",
                "args": [[],
                  [[{ "prim": "UNIT" },
                    { "prim": "FAILWITH" }]]]
              }],
            {
              "prim": "IF_CONS",
              "args": [[[{ "prim": "UNIT" },
                { "prim": "FAILWITH" }]],
                []]
            }, { "prim": "DROP" },
            {
              "prim": "DIP",
              "args": [[[[{ "prim": "DUP" },
                { "prim": "CAR" },
                {
                  "prim": "DIP",
                  "args": [[{ "prim": "CDR" }]]
                }]],
                {
                  "prim": "PUSH",
                  "args": [{ "prim": "nat" },
                    { "int": "1" }]
                },
                {
                  "prim": "ADD",
                  "annots": ["@new_counter"]
                },
                { "prim": "PAIR" }]]
            },
            {
              "prim": "IF_LEFT",
              "args": [[{ "prim": "UNIT" },
                { "prim": "EXEC" }],
                [{
                  "prim": "DIP",
                  "args": [[{ "prim": "CAR" }]]
                },
                  { "prim": "SWAP" },
                  { "prim": "PAIR" },
                  {
                    "prim": "NIL",
                    "args": [{ "prim": "operation" }]
                  }]]
            },
            { "prim": "PAIR" }]]
      }]]
  }];
