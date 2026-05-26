import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { CantonCommand, IWallet } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

import { Canton, CantonTransactionParams, Tcanton, TransactionBuilderFactory } from '../../src';
import { CantonPrepareCommandResponse } from '../../src/lib/iface';
import {
  CantonExerciseCommandPrepareResponse,
  CantonCreateCommandPrepareResponse,
  CantonTokenPreApprovalPrepareResponse,
  OneStepEnablement,
  OneStepPreApprovalPrepareResponse,
} from '../resources';

/**
 * Builds a base64-encoded raw transaction for a OneStepPreApproval (enable token flow).
 * For TSS wallets (which Canton always is), verifyTransaction receives txParams.enableTokens,
 * not txParams.recipients. The wallet SDK's buildTokenEnablements passes enableTokens through
 * unchanged for TSS wallets rather than converting them to recipients.
 */
function buildOneStepPreApprovalRawTx(
  prepareResponse: typeof OneStepPreApprovalPrepareResponse,
  commandId: string
): string {
  const data = {
    prepareCommandResponse: prepareResponse,
    txType: 'OneStepPreApproval',
    preparedTransaction: '',
    partySignatures: { signatures: [] },
    deduplicationPeriod: { Empty: {} },
    submissionId: commandId,
    hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
    minLedgerTime: { time: { Empty: {} } },
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/** Returns a mock wallet whose coinSpecific().rootAddress matches the given party ID. */
function walletWithRootAddress(rootAddress: string): IWallet {
  return { coinSpecific: () => ({ rootAddress }) } as unknown as IWallet;
}

describe('Canton verifyTransaction:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Canton;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcanton') as Canton;
  });

  describe('OneStepPreApproval (enable token flow):', function () {
    it('should return true when txParams has no type (non-enabletoken flow)', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {},
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    it('should return true when enableTokens is absent', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { type: 'enabletoken' },
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    it('should return true when enableTokens is empty', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { type: 'enabletoken', enableTokens: [] },
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    describe('coin pre-approval (TransferPreapprovalProposal):', function () {
      let txHex: string;
      let receiver: string;

      before(function () {
        txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
        // Dynamically derive receiver from parsed transaction to avoid hardcoding protobuf-decoded addresses
        const txBuilder = new TransactionBuilderFactory(coins.get('tcanton')).from(txHex);
        receiver = (txBuilder.transaction as any).toJson().receiver as string;
      });

      it('should return true when wallet has no coinSpecific (receiver check skipped)', async function () {
        // Typical case: wallet mock has no coinSpecific() method, and no address in enableTokens
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton' }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should return true when wallet rootAddress matches receiver', async function () {
        // Typical UI flow: enableTokens has no address, receiver validated from wallet.coinSpecific().rootAddress
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton' }],
          },
          wallet: walletWithRootAddress(receiver),
        });
        result.should.equal(true);
      });

      it('should return true when enableToken.address matches receiver (explicit address)', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton', address: receiver }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should throw when wallet rootAddress does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'canton' }],
            },
            wallet: walletWithRootAddress(wrongAddress),
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });

      it('should throw when explicit enableToken.address does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'canton', address: wrongAddress }],
            },
            wallet: {} as any,
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });
    });

    describe('token pre-approval (TransferPreapproval):', function () {
      let txHex: string;
      let receiver: string;

      before(function () {
        const commandId = '7d99789d-2f22-49e1-85cb-79d2ce5a69c1';
        txHex = buildOneStepPreApprovalRawTx(CantonTokenPreApprovalPrepareResponse, commandId);
        const txBuilder = new TransactionBuilderFactory(coins.get('tcanton')).from(txHex);
        receiver = (txBuilder.transaction as any).toJson().receiver as string;
      });

      it('should return true when wallet rootAddress matches receiver', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'tcanton:testcoin1' }],
          },
          wallet: walletWithRootAddress(receiver),
        });
        result.should.equal(true);
      });

      it('should return true when enableToken.address matches receiver (explicit address)', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'tcanton:testcoin1', address: receiver }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should throw when wallet rootAddress does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'tcanton:testcoin1' }],
            },
            wallet: walletWithRootAddress(wrongAddress),
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });

      it('should throw when explicit enableToken.address does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'tcanton:testcoin1', address: wrongAddress }],
            },
            wallet: {} as any,
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });
    });
  });
});

// --------------- ExerciseCommand verification tests ---------------

const CANTON_CMD_ACT_AS = 'RegRegistrar::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5';
const CANTON_CMD_TEMPLATE_ID =
  '7a75ef6e69f69395a4e60919e228528bb8f3881150ccfde3f31bcc73864b18ab:Utility.Registry.App.V0.Service.AllocationFactory:AllocationFactory';
const CANTON_CMD_CONTRACT_ID =
  '00f3afdce846a40c6f3f618c4b584b022a0197010057ecd59458200183ab27de0aca1212204aef7ede37a5f41b674a1d95446d42a404461c5558c4e6d1860b65560120ef18';
const CANTON_CMD_CHOICE = 'AllocationFactory_OfferMint';

function buildCantonCommandRawTx(prepareResponse: Partial<CantonPrepareCommandResponse>, commandId: string): string {
  const data = {
    prepareCommandResponse: prepareResponse,
    txType: 'CantonCommand',
    preparedTransaction: '',
    partySignatures: { signatures: [] },
    deduplicationPeriod: { Empty: {} },
    submissionId: commandId,
    hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
    minLedgerTime: { time: { Empty: {} } },
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

describe('Canton verifyTransaction - CantonCommand:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Canton;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcanton') as Canton;
  });

  describe('Happy path tests:', function () {
    let txHex: string;

    before(function () {
      txHex = buildCantonCommandRawTx(CantonExerciseCommandPrepareResponse, 'test-canton-cmd-001');
    });

    it('should return true when cantonCommandParams is undefined (no user params to verify)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {},
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true for matching ExerciseCommand (templateId, choice, contractId, actAs, argument)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              ExerciseCommand: {
                templateId: CANTON_CMD_TEMPLATE_ID,
                contractId: CANTON_CMD_CONTRACT_ID,
                choice: CANTON_CMD_CHOICE,
                choiceArgument: {
                  expectedAdmin: CANTON_CMD_ACT_AS,
                  mint: {
                    instrumentId: {
                      admin: CANTON_CMD_ACT_AS,
                      id: 'TESTTOKEN',
                    },
                    amount: '100',
                    holder: 'RegIssuer::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5',
                    reference: 'test-prepare-mint',
                  },
                },
              },
            },
            actAs: [CANTON_CMD_ACT_AS],
            readAs: [],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true when contractId is omitted (IMS-resolved)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              ExerciseCommand: {
                templateId: CANTON_CMD_TEMPLATE_ID,
                choice: CANTON_CMD_CHOICE,
                choiceArgument: {},
              },
            },
            actAs: [CANTON_CMD_ACT_AS],
            readAs: [],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true with resolveContracts injectAs skipping contractId (empty contractId)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              ExerciseCommand: {
                templateId: CANTON_CMD_TEMPLATE_ID,
                contractId: '',
                choice: CANTON_CMD_CHOICE,
                choiceArgument: {},
              },
            },
            actAs: [CANTON_CMD_ACT_AS],
            readAs: [],
            resolveContracts: [
              {
                templateId: CANTON_CMD_TEMPLATE_ID,
                actAs: [CANTON_CMD_ACT_AS],
                injectAs: 'command.ExerciseCommand.contractId',
              },
            ],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true with resolveContracts injectAs skipping non-empty contractId mismatch', async function () {
      // User supplies a placeholder contractId that doesn't match what's on-chain;
      // resolveContracts marks it as IMS-injected, so the mismatch must be ignored.
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              ExerciseCommand: {
                templateId: CANTON_CMD_TEMPLATE_ID,
                contractId: '00placeholder_contract_id_not_on_chain',
                choice: CANTON_CMD_CHOICE,
                choiceArgument: {},
              },
            },
            actAs: [CANTON_CMD_ACT_AS],
            readAs: [],
            resolveContracts: [
              {
                templateId: CANTON_CMD_TEMPLATE_ID,
                actAs: [CANTON_CMD_ACT_AS],
                injectAs: 'command.ExerciseCommand.contractId',
              },
            ],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });
  });

  describe('Error cases:', function () {
    let txHex: string;

    before(function () {
      txHex = buildCantonCommandRawTx(CantonExerciseCommandPrepareResponse, 'test-canton-cmd-002');
    });

    it('should throw when preparedTransaction is missing on tx prebuild', async function () {
      const emptyPrepare = { ...CantonExerciseCommandPrepareResponse, preparedTransaction: undefined };
      const badTx = buildCantonCommandRawTx(emptyPrepare, 'cmd-bad');
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex: badTx },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: { templateId: CANTON_CMD_TEMPLATE_ID, choice: CANTON_CMD_CHOICE, choiceArgument: {} },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/missing preparedTransaction/);
    });

    it('should throw when user command has neither CreateCommand nor ExerciseCommand', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: { UnknownCommand: {} } as unknown as CantonCommand,
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/must contain a CreateCommand or ExerciseCommand/);
    });

    it('should throw when user command contains both CreateCommand and ExerciseCommand', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                CreateCommand: { templateId: CANTON_CMD_TEMPLATE_ID, createArguments: {} },
                ExerciseCommand: { templateId: CANTON_CMD_TEMPLATE_ID, choice: CANTON_CMD_CHOICE, choiceArgument: {} },
              } as unknown as CantonCommand,
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/exactly one of CreateCommand or ExerciseCommand/);
    });

    it('should throw on invalid user templateId format', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: 'InvalidFormat',
                  choice: CANTON_CMD_CHOICE,
                  choiceArgument: {},
                },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/invalid user templateId/);
    });

    it('should throw on templateId module/entity mismatch', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: 'SomePkg:Wrong.Module:WrongEntity',
                  choice: CANTON_CMD_CHOICE,
                  choiceArgument: {},
                },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/templateId mismatch/);
    });

    it('should throw on submitterInfo.actAs mismatch', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: CANTON_CMD_TEMPLATE_ID,
                  choice: CANTON_CMD_CHOICE,
                  choiceArgument: {},
                },
              },
              actAs: ['WrongParty::1220aaaa'],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/submitterInfo.actAs.*does not match user actAs/);
    });

    it('should throw on choice mismatch for ExerciseCommand', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: CANTON_CMD_TEMPLATE_ID,
                  choice: 'WrongChoice',
                  choiceArgument: {},
                },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/choice mismatch/);
    });

    it('should throw on contractId mismatch when user provides explicit contractId', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: CANTON_CMD_TEMPLATE_ID,
                  contractId: '00wrongcontractid',
                  choice: CANTON_CMD_CHOICE,
                  choiceArgument: {},
                },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/contractId mismatch/);
    });

    it('should throw on argument deep mismatch', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                ExerciseCommand: {
                  templateId: CANTON_CMD_TEMPLATE_ID,
                  choice: CANTON_CMD_CHOICE,
                  choiceArgument: {
                    expectedAdmin: 'WrongParty::totally-different',
                  },
                },
              },
              actAs: [CANTON_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/mismatch/);
    });
  });
});

// --------------- CreateCommand verification tests ---------------

const CREATE_CMD_ACT_AS = 'RegProvider::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5';
const CREATE_CMD_TEMPLATE_ID =
  '7a75ef6e69f69395a4e60919e228528bb8f3881150ccfde3f31bcc73864b18ab:Utility.Registry.App.V0.Service.Provider:ProviderServiceRequest';
const CREATE_CMD_OPERATOR = 'RegOperator::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5';

describe('Canton verifyTransaction - CreateCommand:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Canton;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcanton') as Canton;
  });

  describe('Happy path tests:', function () {
    let txHex: string;

    before(function () {
      txHex = buildCantonCommandRawTx(CantonCreateCommandPrepareResponse, 'test-create-cmd-001');
    });

    it('should return true for matching CreateCommand (templateId, createArguments, actAs)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              CreateCommand: {
                templateId: CREATE_CMD_TEMPLATE_ID,
                createArguments: {
                  operator: CREATE_CMD_OPERATOR,
                  provider: CREATE_CMD_ACT_AS,
                },
              },
            },
            actAs: [CREATE_CMD_ACT_AS],
            readAs: [],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true when createArguments is empty (no deep-compare)', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              CreateCommand: {
                templateId: CREATE_CMD_TEMPLATE_ID,
                createArguments: {},
              },
            },
            actAs: [CREATE_CMD_ACT_AS],
            readAs: [],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });

    it('should return true with resolveContracts injectAs skipping createArguments field', async function () {
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          cantonCommandParams: {
            command: {
              CreateCommand: {
                templateId: CREATE_CMD_TEMPLATE_ID,
                createArguments: {
                  operator: 'placeholder-operator-id',
                  provider: CREATE_CMD_ACT_AS,
                },
              },
            },
            actAs: [CREATE_CMD_ACT_AS],
            readAs: [],
            resolveContracts: [
              {
                templateId: 'some-template',
                actAs: [CREATE_CMD_ACT_AS],
                injectAs: 'command.CreateCommand.createArguments.operator',
              },
            ],
          },
        } as CantonTransactionParams,
        wallet: {} as IWallet,
      });
      result.should.equal(true);
    });
  });

  describe('Error cases:', function () {
    let txHex: string;

    before(function () {
      txHex = buildCantonCommandRawTx(CantonCreateCommandPrepareResponse, 'test-create-cmd-err');
    });

    it('should throw on templateId mismatch for CreateCommand', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                CreateCommand: {
                  templateId: 'WrongPkg:Wrong.Module:WrongEntity',
                  createArguments: {},
                },
              },
              actAs: [CREATE_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/templateId mismatch/);
    });

    it('should throw on createArguments deep mismatch', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                CreateCommand: {
                  templateId: CREATE_CMD_TEMPLATE_ID,
                  createArguments: {
                    operator: 'WrongOperator::totally-different',
                    provider: CREATE_CMD_ACT_AS,
                  },
                },
              },
              actAs: [CREATE_CMD_ACT_AS],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/mismatch/);
    });

    it('should throw on actAs mismatch for CreateCommand', async function () {
      await basecoin
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            cantonCommandParams: {
              command: {
                CreateCommand: {
                  templateId: CREATE_CMD_TEMPLATE_ID,
                  createArguments: {},
                },
              },
              actAs: ['WrongParty::1220aaaa'],
            },
          } as CantonTransactionParams,
          wallet: {} as IWallet,
        })
        .should.be.rejectedWith(/submitterInfo.actAs.*does not match user actAs/);
    });
  });
});
