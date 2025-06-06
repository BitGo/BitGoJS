export const TEST_SINGLE_SIG_ACCOUNT = {
  publicKey: '022ad3a6396dbf85a9912ab2e723a490744556c49c18628f4b3ff045e860e802be',
  privateKey: 'b1cd8c1e50b0bafa04efbadf1b1c65be425de2a4c6f70b0b2e04404cd6a7d487',
  xpub: 'xpub661MyMwAqRbcFuU6ApvZ23o1PTUu1e1CV866CLnSmjwQ1eKDgeimXvvw5aMs7GcFmoUrk4HcLri3brP7MmCWx2eZkRJBfQE6NppuQ2tuTFz',
  xprv: 'xprv9s21ZrQH143K3RPd4oPYeurGqReQcBHM7uAVPxNqDQQR8qz597QWz8cTELMYTA9y6mHmDDqZYMXL6AWTXhM3idUw9LVeFQkS746VXt4jFgt',
  address: 'rKkq7my4cbS9mEcg8gwdcFW2HHxoYwRzny',
};

export const TEST_MULTI_SIG_ACCOUNT = {
  publicKey: '032c57291f0ca43affcd6d298644ed5e2e0f9d9c1a1d38d622b5004c38097e3da4',
  privateKey: 'ca84314cbf961d2bf3d8a14a1038f2d13db188c2779bfa1066526e10a623cb97',
  xpub: 'xpub661MyMwAqRbcFCtfDVVYDqBfY5bYYhjCutENN6vWgLHMWXkaLtMVwkbX4Dt2AobJP7r3gEdeBisZpvCFq89kTF869CxwupU33YyFdkcjxSE',
  xprv: 'xprv9s21ZrQH143K2ipC7TxXrhEvz3m49F1MYfJmZiWu7zkNdjRRoM3FPxH3Cx7AwdBNrrUPXmxGeoiwc1d5Sikaf1XCnUMJDicv3rX38TfdkmD',
  address: 'raJ4NmhHr2j2SGkmVFeMqKR5MUSWXjNF9a?dt=1',
};

export const SIGNER_USER = {
  address: 'ra9RZRJQgiFNM8zqKZEnzL5S7ArDjK7BcL',
  xprv: 'xprv9s21ZrQH143K2zAhPb9BvQ8Sa3qv5xkQEqgCS3q9yq8qcQiDVUrqkmtAcFkaQ7BpQ2PtuJAVH6H5RWPkgMawNReNMxrPMcWcdgH39Tbyuac',
  xpub: 'xpub661MyMwAqRbcFUFAVcgCHY5B85gQVRUFc4boESEmYAfpVD3N32B6JaCeTYZ2CH5mg46XBG3PNB4cDdeY4WFe9yqNfgAT982qKXmTkmuQmrD',
  prv: '5d52ac345dcf212df393e8df407a11d44961bdafc775630ba78e3ef444881662',
  pub: '0346779230aac40c8bf83e5006cc5715cf24dc8e1a446e498adb3c05ab00b097d3',
};

export const SIGNER_BACKUP = {
  address: 'rnfauwz5nWBzb9zouGBihxu4bNqC7Xxosx',
  xprv: 'xprv9s21ZrQH143K2fG7vDhgRwzpEZMmHt9NSpQLKRi5Dooo7zGCmTgyXeg8WeM18W6haxJYkCS45ZJpiHNhhvwQ3FoPsGbpLBzt22eiba4zxxi',
  xpub: 'xpub661MyMwAqRbcF9Lb2FEgo5wYnbCFhLsDp3Kw7p7gn9LmznbMK11E5SzcMuiPG22j1bfpusgZT9QepksvX7Mxt5wQ5EwKNDgc9bQe2qyUngL',
  prv: 'a2f05ffc7f0a1777fbc27d6246cdb6ac48bf966537abdf35078c3611db503f2d',
  pub: '02cf7a5834145c00a2a0e92b04adb465fdd5ef7cfb26e30126db9f9d03a8c9a201',
};

export const SIGNER_BITGO = {
  address: 'rhxWyYLhh2PqzjcyLr2ZDWK7Yt1hhuXRNd',
  xprv: 'xprv9s21ZrQH143K3aWYerbBbitETBTysf28H4gVTvrunjEiKaygwdvcy9aVegNXWfYFYMNPrACUAfCuFQBMse87sZP77uTvyWAN1JuMX876Myw',
  xpub: 'xpub661MyMwAqRbcG4b1kt8Bxrpy1DJUH7jyeHc6GKGXM4mhCPJqVBEsWwtyVxy71WVbbNLKmrbxmia5SQ2WhULANearAy1h9feHrdePzuCAANZ',
  prv: '86727cce9bbb4d8849bf4ace4d210997068249ab184fc76e328445b429183027',
  pub: '0354a53774fd9b5ef4b2a474a369becd92e379fa759681a831a4f86d1e5313d6ff',
};

export const TEST_TRANSFER_TX_SINGLE_SIG = {
  unsignedTxHex:
    '1200002280000000240017938B2E00000001614000000001C9C3806840000000000003E88114CDBC9E5CA061B57159D89C3F77D434EA9C42803183143A216D9FD01469A7D4D90332A5D732CD86E5E38C',
  signedTxHex:
    '1200002280000000240017938B2E00000001614000000001C9C3806840000000000003E87321022AD3A6396DBF85A9912AB2E723A490744556C49C18628F4B3FF045E860E802BE74463044022020A3F3A6E7FF28C656C9722342907C293A7441DA423C49999E3162AB573EF5050220556F4BB2F2E0577AB54A45A9CA433B8F81F6A80C28A6B514E6EE57EAF25B465B8114CDBC9E5CA061B57159D89C3F77D434EA9C42803183143A216D9FD01469A7D4D90332A5D732CD86E5E38C',
};

export const TEST_TRANSFER_TX_MULTI_SIG = {
  unsignedTxHex:
    '120000228000000024001797266140000000001E84806840000000000003E881143A216D9FD01469A7D4D90332A5D732CD86E5E38C8314CDBC9E5CA061B57159D89C3F77D434EA9C428031',
  signedTxHex:
    '120000228000000024001797266140000000001E84806840000000000003E8730081143A216D9FD01469A7D4D90332A5D732CD86E5E38C8314CDBC9E5CA061B57159D89C3F77D434EA9C428031F3E01073210354A53774FD9B5EF4B2A474A369BECD92E379FA759681A831A4F86D1E5313D6FF74473045022100A58813DD5407D9DAD1E1855A859E60610FA8D77882D8391677E7436D471F419C022024E2C038C58CC19F8278D3D4FDDB187083CE786119E831D0F7257FE3E964DE7081142B6846E804F59FB21B1B3B2CA202DCC321303D3EE1E01073210346779230AAC40C8BF83E5006CC5715CF24DC8E1A446E498ADB3C05AB00B097D374463044022018FC756A5775E296721D146B90D1BD01F8CB34F4A954B69E3EA49597C5B66DF7022076B06630AB33DAEA0C2183FFEDADCC2974FF82CB5CB70031452F6F5143BDD4E681143870751788B5A4552965725080F5F65B0ACB8D20E1F1',
};

export const TEST_WALLET_INIT_TX = {
  unsignedTxHex:
    '12000C228000000024001797232023000000026840000000000003E881143A216D9FD01469A7D4D90332A5D732CD86E5E38CF4EB13000181143870751788B5A4552965725080F5F65B0ACB8D20E1EB13000181142D07EC6FB57747ED1B4C4EA251AA7A8B1A067BEDE1EB13000181142B6846E804F59FB21B1B3B2CA202DCC321303D3EE1F1',
  signedTxHex:
    '12000C228000000024001797232023000000026840000000000003E87321032C57291F0CA43AFFCD6D298644ED5E2E0F9D9C1A1D38D622B5004C38097E3DA474463044022015949B936A05D47903C3EF6A28C8CB22B58AF3B907601759D0BC0109B77FBA2502202A85713C509E34F275EE653F11CA739AC7838D65D308589720445A904104A3DB81143A216D9FD01469A7D4D90332A5D732CD86E5E38CF4EB13000181143870751788B5A4552965725080F5F65B0ACB8D20E1EB13000181142D07EC6FB57747ED1B4C4EA251AA7A8B1A067BEDE1EB13000181142B6846E804F59FB21B1B3B2CA202DCC321303D3EE1F1',
};

export const TEST_ACCOUNT_UPDATE_TX = {
  unsignedTxHex: '120003228000000024001797252021000000046840000000000003E881143A216D9FD01469A7D4D90332A5D732CD86E5E38C',
  signedTxHex:
    '120003228000000024001797252021000000046840000000000003E87321032C57291F0CA43AFFCD6D298644ED5E2E0F9D9C1A1D38D622B5004C38097E3DA474473045022100C5C4DFCE0B16A9C2195FAD8A7E827C90F8838AE07D6798C10270FD41662E45D102203EA1CB2094E56F39C9FEC0D85F48D5AD6B09FF11E57001364419531601336CB481143A216D9FD01469A7D4D90332A5D732CD86E5E38C',
};

export const TEST_TRUSTLINE_TX = {
  unsignedTxHex:
    '1200142280000000240017972863D7838D7EA4C68000524C555344000000000000000000000000000000FCF4DD8C64636BC503F4A58DC6C684D2C7C3C24F6840000000000003E881143A216D9FD01469A7D4D90332A5D732CD86E5E38C',
  signedTxHex:
    '1200142280000000240017972863D7838D7EA4C68000524C555344000000000000000000000000000000FCF4DD8C64636BC503F4A58DC6C684D2C7C3C24F6840000000000003E8730081143A216D9FD01469A7D4D90332A5D732CD86E5E38CF3E01073210354A53774FD9B5EF4B2A474A369BECD92E379FA759681A831A4F86D1E5313D6FF74473045022100C9BEF11C62D3DACD8A0A14689D1C589316E8E4103399F1BAC0CE0667C934E02E022030DAF0AA0B704CA5D3DD2ECCDEB7136E037FF18DDC43FD371A5D2FE0B2B667A781142B6846E804F59FB21B1B3B2CA202DCC321303D3EE1E01073210346779230AAC40C8BF83E5006CC5715CF24DC8E1A446E498ADB3C05AB00B097D374473045022100F97EC46A56FCC7BF3FB94257947B446B3F13DE55298A3E565847F134B5493C8B022072C11967B18E993B1EA9CCDE098C2FA386AE18B23F9FBF07FF65AED4BB5CF8B281143870751788B5A4552965725080F5F65B0ACB8D20E1F1',
};

export const TEST_TOKEN_TRANSFER_TX = {
  unsignedTxHex:
    '1200002280000000240017972A61D4C8E1BC9BF04000524C555344000000000000000000000000000000FCF4DD8C64636BC503F4A58DC6C684D2C7C3C24F6840000000000003E881143A216D9FD01469A7D4D90332A5D732CD86E5E38C8314CDBC9E5CA061B57159D89C3F77D434EA9C428031',
  signedTxHex:
    '1200002280000000240017972A61D4C8E1BC9BF04000524C555344000000000000000000000000000000FCF4DD8C64636BC503F4A58DC6C684D2C7C3C24F6840000000000003E8730081143A216D9FD01469A7D4D90332A5D732CD86E5E38C8314CDBC9E5CA061B57159D89C3F77D434EA9C428031F3E01073210354A53774FD9B5EF4B2A474A369BECD92E379FA759681A831A4F86D1E5313D6FF744630440220245F27F79415F1C47CE85F34417F8C47CCFC5D699943456CF75734033670A32D0220254874C265CC91F9AFC7588E836CA8F2A2BB91DB864E5F4091A94AAF18CA4A2A81142B6846E804F59FB21B1B3B2CA202DCC321303D3EE1E01073210346779230AAC40C8BF83E5006CC5715CF24DC8E1A446E498ADB3C05AB00B097D37446304402203549AA24CE9339A5730B64DAD02569C80ED9244F06DEB8090609455868D5177C02206FA75998EE414130F9555E20B807DB91DF2E5BD35F8A3084146FC81F744C618881143870751788B5A4552965725080F5F65B0ACB8D20E1F1',
};

export const keys = {
  userKey:
    '{"iv":"ZN/gBap8QYIpjbbkZCDY8g==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"Egt/IC14ugw=","ct":"eRiONKtGrlEX8e\n' +
    '5s5EAon7MadWZxyQWJMFJp16rimEd/2LWyGObo/d6hdJWUSZE1lDzpYV9x/Qg3vKz8Wy4ee8R0h\n' +
    '8J+Ddo/Q8dR/yDNImcNGBclBMrh9c8cowuzRMnbMlbrLc949tN3d3A1jXOu3Rr5Wt4h1ag="}',
  backupKey:
    '{"iv":"D5SCw343R+l9qbP3TrXzlg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"yug6WjWDjCA=","ct":"++m1LyBWw9emM2\n' +
    'J1P85+T2VJEFPXFjshWssVBaHuccsiD0MsYsFX5d+hVfDrWV2aDOJAuOdtoCo+R3LrG2JST80ru\n' +
    '37Y383IvRlB3A85MSo/poMtN1JyzorwF6Cfiz26bY3OKxywaeWJvr9SEDJxTDTx8HH9GsE="}',
  bitgoKey:
    'xpub661MyMwAqRbcGBXTTnaLrqur67ZHc9BA9X3GdAx6Kj8HVyg32TvktXv8DPN13QvnWSnrfC8\n' +
    'KFWvaUfR4kfwyikf6TuyJ3Ei8HGs7vxfdyia',
  rootAddress: 'rNTfZB1h4TDdF9QXw37nbWk9euZmRby4qn',
};

export const accountInfoResponse = {
  body: {
    result: {
      account_data: {
        Account: 'rQNZGRLwTAF4WAxZvc1UbueEs4rQb7KQmN',
        Balance: '99997952',
        Flags: 1179648,
        LedgerEntryType: 'AccountRoot',
        OwnerCount: 2,
        PreviousTxnID: '1216237378659EC1849D45D210B45C96B7B091B4134BA3A00509B8F9DCBA59C4',
        PreviousTxnLgrSeq: 1851142,
        Sequence: 807096,
        index: 'BDD920F6F4C21E2EDF8E604257AB2D3EFF3CD8374330B98989A58E9AB27FDC9D',
        signer_lists: [
          {
            Flags: 65536,
            LedgerEntryType: 'SignerList',
            OwnerNode: '0',
            PreviousTxnID: '1216237378659EC1849D45D210B45C96B7B091B4134BA3A00509B8F9DCBA59C4',
            PreviousTxnLgrSeq: 1851142,
            SignerEntries: [
              {
                SignerEntry: {
                  Account: 'rwFcXstMseu91iejAdoYWCPaVR4GgdiV5i',
                  SignerWeight: 1,
                },
              },
              {
                SignerEntry: {
                  Account: 'r45kBeT5cmtaW6DHGAXzfjYHQzsVFhPX3M',
                  SignerWeight: 1,
                },
              },
              {
                SignerEntry: {
                  Account: 'r3mykfPQZt4eJZKLUGMNVB49eDSJiE9zh3',
                  SignerWeight: 1,
                },
              },
            ],
            SignerListID: 0,
            SignerQuorum: 2,
            index: '00B47042E37B5F11E6325D7BECAA08D165C6681DB4F6528AF7D1CA6ED50075B7',
          },
        ],
      },
      account_flags: {
        allowTrustLineClawback: false,
        defaultRipple: false,
        depositAuth: false,
        disableMasterKey: false,
        disallowIncomingCheck: false,
        disallowIncomingNFTokenOffer: false,
        disallowIncomingPayChan: false,
        disallowIncomingTrustline: false,
        disallowIncomingXRP: false,
        globalFreeze: false,
        noFreeze: false,
        passwordSpent: false,
        requireAuthorization: false,
        requireDestinationTag: false,
      },
      ledger_current_index: 1851200,
      queue_data: {
        txn_count: 0,
      },
      validated: false,
    },
    status: 'success',
    type: 'response',
  },
};

export const accountlinesResponse = {
  body: {
    result: {
      account: 'rMficzfw4t5iGu9hhB23eKwDjM879vJWTR',
      ledger_hash: 'E6F38D1D7B94153BF7FFC8D8CC1DF57D57151D26FC2EB7647B5631786B955EFF',
      ledger_index: 1848964,
      lines: [
        {
          account: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
          balance: '4',
          currency: '524C555344000000000000000000000000000000',
          limit: '1000000000',
          limit_peer: '0',
          no_ripple: false,
          no_ripple_peer: false,
          quality_in: 0,
          quality_out: 0,
        },
      ],
      validated: true,
    },
    status: 'success',
    type: 'response',
  },
};

export const accountInfoResponseUnsigned = {
  body: {
    result: {
      account_data: {
        Account: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        Balance: '99997952',
        Flags: 1179648,
        LedgerEntryType: 'AccountRoot',
        OwnerCount: 2,
        PreviousTxnID: '1216237378659EC1849D45D210B45C96B7B091B4134BA3A00509B8F9DCBA59C4',
        PreviousTxnLgrSeq: 1851142,
        Sequence: 807096,
        index: 'BDD920F6F4C21E2EDF8E604257AB2D3EFF3CD8374330B98989A58E9AB27FDC9D',
        signer_lists: [
          {
            Flags: 65536,
            LedgerEntryType: 'SignerList',
            OwnerNode: '0',
            PreviousTxnID: '1216237378659EC1849D45D210B45C96B7B091B4134BA3A00509B8F9DCBA59C4',
            PreviousTxnLgrSeq: 1851142,
            SignerEntries: [
              {
                SignerEntry: {
                  Account: 'rGmQHwvb5SZRbyhp4JBHdpRzSmgqADxPbE',
                  SignerWeight: 1,
                },
              },
              {
                SignerEntry: {
                  Account: 'rGevN87RpWBbdLxKCF4FAqWgRoSyMJA81f',
                  SignerWeight: 1,
                },
              },
              {
                SignerEntry: {
                  Account: 'r3mykfPQZt4eJZKLUGMNVB49eDSJiE9zh3',
                  SignerWeight: 1,
                },
              },
            ],
            SignerListID: 0,
            SignerQuorum: 2,
            index: '00B47042E37B5F11E6325D7BECAA08D165C6681DB4F6528AF7D1CA6ED50075B7',
          },
        ],
      },
      account_flags: {
        allowTrustLineClawback: false,
        defaultRipple: false,
        depositAuth: false,
        disableMasterKey: false,
        disallowIncomingCheck: false,
        disallowIncomingNFTokenOffer: false,
        disallowIncomingPayChan: false,
        disallowIncomingTrustline: false,
        disallowIncomingXRP: false,
        globalFreeze: false,
        noFreeze: false,
        passwordSpent: false,
        requireAuthorization: false,
        requireDestinationTag: false,
      },
      ledger_current_index: 1851200,
      queue_data: {
        txn_count: 0,
      },
      validated: false,
    },
    status: 'success',
    type: 'response',
  },
};

export const accountlinesResponseUnsigned = {
  body: {
    result: {
      account: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
      ledger_hash: 'E6F38D1D7B94153BF7FFC8D8CC1DF57D57151D26FC2EB7647B5631786B955EFF',
      ledger_index: 1848964,
      lines: [
        {
          account: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
          balance: '4',
          currency: '524C555344000000000000000000000000000000',
          limit: '1000000000',
          limit_peer: '0',
          no_ripple: false,
          no_ripple_peer: false,
          quality_in: 0,
          quality_out: 0,
        },
      ],
      validated: true,
    },
    status: 'success',
    type: 'response',
  },
};

export const feeResponse = {
  body: {
    id: 'fee_websocket_example',
    result: {
      current_ledger_size: '5',
      current_queue_size: '0',
      drops: {
        base_fee: '10',
        median_fee: '5000',
        minimum_fee: '10',
        open_ledger_fee: '10',
      },
      expected_ledger_size: '1168',
      ledger_current_index: 1847940,
      levels: {
        median_level: '128000',
        minimum_level: '256',
        open_ledger_level: '256',
        reference_level: '256',
      },
      max_queue_size: '23360',
    },
    status: 'success',
    type: 'response',
  },
};

export const serverInfoResponse = {
  body: {
    result: {
      info: {
        build_version: '2.2.2',
        complete_ledgers: '6-1848000',
        hostid: 'TUN',
        initial_sync_duration_us: '5977360',
        io_latency_ms: 1,
        jq_trans_overflow: '0',
        last_close: {
          converge_time_s: 2,
          proposers: 6,
        },
        load_factor: 1,
        network_id: 1,
        peer_disconnects: '227613',
        peer_disconnects_resources: '1245',
        peers: 84,
        ports: [
          {
            port: '2459',
            protocol: ['peer'],
          },
          {
            port: '51233',
            protocol: ['ws2', 'wss2'],
          },
          {
            port: '50051',
            protocol: ['grpc'],
          },
        ],
        pubkey_node: 'n9KEk3TLMuoiTTLgrWWmfYm99hHFBZTXWzoyrHr3FbJWmRCXm96v',
        server_state: 'full',
        server_state_duration_us: '3738974235451',
        state_accounting: {
          connected: {
            duration_us: '0',
            transitions: '0',
          },
          disconnected: {
            duration_us: '2975611',
            transitions: '1',
          },
          full: {
            duration_us: '3738974235451',
            transitions: '1',
          },
          syncing: {
            duration_us: '3001722',
            transitions: '1',
          },
          tracking: {
            duration_us: '26',
            transitions: '1',
          },
        },
        time: '2024-Oct-28 06:29:00.124327 UTC',
        uptime: 3738980,
        validated_ledger: {
          age: 1,
          base_fee_xrp: 0.00001,
          hash: 'ED30F1BEFE89FE2C87A768A3791104E2A658DFC20A4085C61863B2837551E8E6',
          reserve_base_xrp: 10,
          reserve_inc_xrp: 2,
          seq: 1848000,
        },
        validation_quorum: 5,
      },
    },
    status: 'success',
    type: 'response',
  },
};
