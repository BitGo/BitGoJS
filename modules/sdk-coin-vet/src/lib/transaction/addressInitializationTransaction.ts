import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import {
  Clause,
  ABIContract,
  Address,
  TransactionBody,
  Transaction as VetTransaction,
  HexUInt,
} from '@vechain/sdk-core';
import { KeyPair } from '../keyPair';
import assert from 'assert';

export class AddressInitializationTransaction extends Transaction {
  private _forwarderFactoryAddress: string;
  private _baseAddress: string;
  private _feeAddress: string;
  private _salt: string;
  private _forwarderImplementationAddress: string;
  private _contractAbi;
  private _signature: Buffer | undefined;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.AddressInitialization;
    this._contractAbi = [
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'ForwarderDeposited',
        type: 'event',
      },
      {
        stateMutability: 'payable',
        type: 'fallback',
      },
      {
        inputs: [],
        name: 'autoFlush1155',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'autoFlush721',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'tokenContractAddress',
            type: 'address',
          },
          {
            internalType: 'uint256[]',
            name: 'tokenIds',
            type: 'uint256[]',
          },
        ],
        name: 'batchFlushERC1155Tokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address[]',
            name: 'tokenContractAddresses',
            type: 'address[]',
          },
        ],
        name: 'batchFlushERC20Tokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'callFromParent',
        outputs: [
          {
            internalType: 'bytes',
            name: '',
            type: 'bytes',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'feeAddress',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'flush',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'tokenContractAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
        ],
        name: 'flushERC1155Tokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'tokenContractAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
        ],
        name: 'flushERC721Token',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'tokenContractAddress',
            type: 'address',
          },
        ],
        name: 'flushTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_parentAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_feeAddress',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: '_autoFlush721',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: '_autoFlush1155',
            type: 'bool',
          },
        ],
        name: 'init',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_operator',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_from',
            type: 'address',
          },
          {
            internalType: 'uint256[]',
            name: 'ids',
            type: 'uint256[]',
          },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'onERC1155BatchReceived',
        outputs: [
          {
            internalType: 'bytes4',
            name: '',
            type: 'bytes4',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_operator',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_from',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'onERC1155Received',
        outputs: [
          {
            internalType: 'bytes4',
            name: '',
            type: 'bytes4',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_operator',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_from',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_tokenId',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        name: 'onERC721Received',
        outputs: [
          {
            internalType: 'bytes4',
            name: '',
            type: 'bytes4',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'parentAddress',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bool',
            name: 'autoFlush',
            type: 'bool',
          },
        ],
        name: 'setAutoFlush1155',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bool',
            name: 'autoFlush',
            type: 'bool',
          },
        ],
        name: 'setAutoFlush721',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bytes4',
            name: 'interfaceId',
            type: 'bytes4',
          },
        ],
        name: 'supportsInterface',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        stateMutability: 'payable',
        type: 'receive',
      },
    ];
  }

  get forwarderFactoryAddress(): string {
    return this._forwarderFactoryAddress;
  }

  set forwarderFactoryAddress(address: string) {
    this._forwarderFactoryAddress = address;
  }

  get baseAddress(): string {
    return this._baseAddress;
  }

  set baseAddress(address: string) {
    this._baseAddress = address;
  }

  get feeAddress(): string {
    return this._feeAddress;
  }

  set feeAddress(address: string) {
    this._feeAddress = address;
  }

  get salt(): string {
    return this._salt;
  }

  set salt(salt: string) {
    this._salt = salt;
  }

  get forwarderImplementationAddress(): string {
    return this._forwarderImplementationAddress;
  }

  set forwarderImplementationAddress(address: string) {
    this._forwarderImplementationAddress = address;
  }

  buildClauses(): void {
    const contractCallClause = Clause.callFunction(
      Address.of(this._forwarderFactoryAddress),
      ABIContract.ofAbi(this._contractAbi).getFunction('init'), //check funcName
      [this._baseAddress, this._feeAddress, this._salt]
    );
    this._clauses = [contractCallClause];
  }

  protected async buildRawTransaction(): Promise<void> {
    const transactionBody: TransactionBody = {
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: 64, //move this value to constants
      clauses: this.clauses,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: null,
      nonce: this.nonce,
    };

    this.rawTransaction = VetTransaction.of(transactionBody);
  }

  sign(keyPair: KeyPair): void {
    const signedTx = this._rawTransaction.sign(HexUInt.of(keyPair.getKeys().prv as string).bytes);
    if (signedTx.isSigned) {
      assert(signedTx.signature);
      this._signature = Buffer.from(signedTx.signature);
    }
    this._id = signedTx.id.toString();
  }
}
