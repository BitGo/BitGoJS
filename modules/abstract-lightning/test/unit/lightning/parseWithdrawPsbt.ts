import { validatePsbtForWithdraw } from '../../../src';
import * as utxolib from '@bitgo/utxo-lib';
import assert from 'assert';

describe('parseWithdrawPsbt', () => {
  const unsignedPsbtHex =
    '70736274ff01007d02000000015e50b8d96cebdc3273d9a100eb68392d980d5b934b8170c80a23488b595268ca0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15affa80a000000000016001480a06f2e6b77e817fd5de6e41ea512c563c26cb800000000000100ea02000000000101a158d806735bb7c54e4c701d4f5821cd5342d48d5e1fcbed1169e6e45aa444be0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15a6a310c000000000016001478a5d98c7160484b9b00f1782803c58edfc49b9a024730440220407d9162f52371df246dcfa2943d40fbdcb0d4b6768f7682c65193378b2845a60220101c7bc460c93d2976961ac23400f0f10c145efb989a3addb7f03ebaaa2200950121037e17444c85c8b7da07f12fd53cb2ca142c2b4932d0f898649c4b5be0021da0980000000001030401000000220602e57146e5b4762a7ff374adf4072047b67ef115ad46a34189bdeb6a4f88db9b0818000000005400008000000080000000800100000006000000000022020379abbe44004ff7e527bdee3dd8d95e5cd250053f35ee92258b97aa83dfa93c621800000000540000800000008000000080010000005000000000';
  const network = utxolib.networks.testnet;
  const recipients = [
    {
      amountSat: 100000n,
      address: 'tb1px7du3rxpt5mqtmvauxmpl7xk2qsmv5xmz9g7w5drpzzuelx869dqwape7k',
    },
  ];
  const accounts = [
    {
      xpub: 'tpubDCmiWMkTJrZ24t1Z6ECR3HyynCyZ9zGsWqhcLh6H4yFK2CDozSszD1pP2Li4Nx1YYtRcvmNbdb3nD1SzFejYtPFfTocTv2EaAgJCg4zpJpA',
      purpose: 49,
      coin_type: 0,
      account: 0,
    },
    {
      xpub: 'tpubDCFN7bsxR9UTKggdH2pmv5HeHGQNiDrJwa1EZFtP9sH5PF28i37FHpoYSYARQkKZ6Mi98pkp7oypDcxFmE4dQGq8jV8Gv3L6gmWBeRwPxkP',
      purpose: 84,
      coin_type: 0,
      account: 0,
    },
  ];
  it('should parse a valid withdraw PSBT', () => {
    validatePsbtForWithdraw(unsignedPsbtHex, network, recipients, accounts);
  });
  it('should throw for invalid PSBT', () => {
    assert.throws(() => {
      validatePsbtForWithdraw('asdasd', network, recipients, accounts);
    }, /ERR_BUFFER_OUT_OF_BOUNDS/);
  });
  it('should throw for invalid recipient address', () => {
    const differentRecipients = [
      {
        ...recipients[0],
        address: 'tb1qxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyzxyz',
      },
    ];
    assert.throws(() => {
      validatePsbtForWithdraw(unsignedPsbtHex, network, differentRecipients, accounts);
    }, /PSBT output tb1px7du3rxpt5mqtmvauxmpl7xk2qsmv5xmz9g7w5drpzzuelx869dqwape7k with value 100000 does not match any recipient/);
  });
  it('should throw for invalid recipient value', () => {
    const differentRecipients = [
      {
        ...recipients[0],
        amountSat: 99999n,
      },
    ];
    assert.throws(() => {
      validatePsbtForWithdraw(unsignedPsbtHex, network, differentRecipients, accounts);
    }, /PSBT output tb1px7du3rxpt5mqtmvauxmpl7xk2qsmv5xmz9g7w5drpzzuelx869dqwape7k with value 100000 does not match any recipient/);
  });
  it('should throw for account not found', () => {
    const incompatibleAccounts = [];
    assert.throws(() => {
      validatePsbtForWithdraw(unsignedPsbtHex, network, recipients, incompatibleAccounts);
    }, /Account not found for purpose/);
  });
  it('should throw for invalid pubkey', () => {
    const incompatibleAccounts = [
      {
        ...accounts[1],
        xpub: 'tpubDCmiWMkTJrZ24t1Z6ECR3HyynCyZ9zGsWqhcLh6H4yFK2CDozSszD1pP2Li4Nx1YYtRcvmNbdb3nD1SzFejYtPFfTocTv2EaAgJCg4zpJpA',
      },
    ];
    assert.throws(() => {
      validatePsbtForWithdraw(unsignedPsbtHex, network, recipients, incompatibleAccounts);
    }, /Derived pubkey does not match for address/);
  });
  it('should throw for invalid purpose', () => {
    const incompatibleAccounts = [
      {
        ...accounts[1],
        purpose: 1017,
      },
    ];
    const incompatiblePsbt = `70736274ff01007d02000000015e50b8d96cebdc3273d9a100eb68392d980d5b934b8170c80a23488b595268ca0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15affa80a000000000016001480a06f2e6b77e817fd5de6e41ea512c563c26cb800000000000100ea02000000000101a158d806735bb7c54e4c701d4f5821cd5342d48d5e1fcbed1169e6e45aa444be0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15a6a310c000000000016001478a5d98c7160484b9b00f1782803c58edfc49b9a024730440220407d9162f52371df246dcfa2943d40fbdcb0d4b6768f7682c65193378b2845a60220101c7bc460c93d2976961ac23400f0f10c145efb989a3addb7f03ebaaa2200950121037e17444c85c8b7da07f12fd53cb2ca142c2b4932d0f898649c4b5be0021da0980000000001030401000000220602e57146e5b4762a7ff374adf4072047b67ef115ad46a34189bdeb6a4f88db9b0818000000005400008000000080000000800100000006000000000022020379abbe44004ff7e527bdee3dd8d95e5cd250053f35ee92258b97aa83dfa93c621800000000f90300800000008000000080010000005000000000`;
    assert.throws(() => {
      validatePsbtForWithdraw(incompatiblePsbt, network, recipients, incompatibleAccounts);
    }, /Unsupported purpose/);
  });
});
