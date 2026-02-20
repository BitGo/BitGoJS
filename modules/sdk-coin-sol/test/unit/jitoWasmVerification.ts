/**
 * Verification test: Jito WASM parsing works in BitGoJS
 */
import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '../../src';

describe('Jito WASM Verification', function () {
  let bitgo: TestBitGoAPI;
  let tsol: Tsol;

  // From BitGoJS test/resources/sol.ts - JITO_STAKING_ACTIVATE_SIGNED_TX
  const JITO_TX_BASE64 =
    'AdOUrFCk9yyhi1iB1EfOOXHOeiaZGQnLRwnypt+be8r9lrYMx8w7/QTnithrqcuBApg1ctJAlJMxNZ925vMP2Q0BAAQKReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Ecg6pe+BOG2OETfAVS9ftz6va1oE4onLBolJ2N+ZOOhJ6naP7fZEyKrpuOIYit0GvFUPv3Fsgiuc5jx3g9lS4fCeaj/uz5kDLhwd9rlyLcs2NOe440QJNrw0sMwcjrUh/80UHpgyyvEK2RdJXKDycbWyk81HAn6nNwB+1A6zmgvQSKPgjDtJW+F/RUJ9ib7FuAx+JpXBhk12dD2zm+00bWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABU5Z4kwFGooUp7HpeX8OEs36dJAhZlMZWmpRKm8WZgKwaBTtTK9ooXRnL9rIYDGmPoTqFe+h1EtyKT9tvbABZQBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKnjMtr5L6vs6LY/96RABeX9/Zr6FYdWthxalfkEs7jQgQEICgUHAgABAwEEBgkJDuCTBAAAAAAA';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    tsol = bitgo.coin('tsol') as Tsol;
  });

  it('should parse Jito DepositSol transaction via WASM', function () {
    // Verify the raw WASM parsing returns StakePoolDepositSol
    const { parseTransaction } = require('@bitgo/wasm-solana');
    const txBytes = Buffer.from(JITO_TX_BASE64, 'base64');
    const wasmTx = parseTransaction(txBytes);
    const wasmParsed = wasmTx.parse();

    // Verify WASM returns StakePoolDepositSol instruction
    const depositSolInstr = wasmParsed.instructionsData.find((i: { type: string }) => i.type === 'StakePoolDepositSol');
    should.exist(depositSolInstr, 'WASM should parse StakePoolDepositSol instruction');
    depositSolInstr.lamports.should.equal(300000n);

    // Now test explainTransactionWithWasm - should map to StakingActivate
    const explained = tsol.explainTransactionWithWasm({
      txBase64: JITO_TX_BASE64,
      feeInfo: { fee: '5000' },
    });

    // Verify the transaction is correctly interpreted
    should.exist(explained.id);
    explained.type.should.equal('StakingActivate');
    explained.outputAmount.should.equal('300000');
    explained.outputs.length.should.equal(1);
    explained.outputs[0].address.should.equal('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb');
    explained.outputs[0].amount.should.equal('300000');
  });
});
