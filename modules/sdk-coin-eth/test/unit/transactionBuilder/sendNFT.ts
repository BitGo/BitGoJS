import { TransactionType } from '@bitgo/sdk-core';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';
import { ERC1155TransferBuilder, ERC721TransferBuilder, TransactionBuilder } from '../../../src';
import * as testData from '../../resources/eth';
import { ethers } from 'ethers';
import should from 'should';
import { ERC1155ABI } from '../../resources/erc1155Abi';
import { walletSimpleABI } from '../../resources/walletSimpleAbi';
import { erc721ABI } from '../../resources/erc721Abi';
import {
  erc1155BatchTransferEncoding,
  erc1155SafeTransferEncoding,
  erc721Encoding,
} from '../../resources/nftEncodings';
import { getBuilder } from '../getBuilder';

describe('Eth transaction builder sendNFT', () => {
  // dummy addresses
  const owner = '0x19645032c7f1533395d44a629462e751084d3e4d';
  const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
  const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';

  // ens erc721
  const erc721ContractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
  // opensea erc1155
  const erc1155ContractAddress = '0x495f947276749ce646f68ac8c248420045cb7b5e';
  const coin = coins.get('hteth') as unknown as EthLikeNetwork;
  let key;

  beforeEach(() => {
    key = testData.KEYPAIR_PRV.getKeys().prv as string;
  });

  it('should sign ERC721 properly', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC721);

    // Dummy addresses
    const expireTime = 1590066728;
    const sequenceId = 5;
    const tokenId = '1';

    const erc721Transfer = txBuilder.transfer() as ERC721TransferBuilder;
    erc721Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc721ContractAddress)
      .contractSequenceId(sequenceId)
      .tokenId(tokenId)
      .key(key);

    txBuilder.sign({ key: testData.PRIVATE_KEY });
    await txBuilder.build();
  });

  it('should sign and build ERC721 transfer with Builder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC721);

    // Dummy addresses
    const expireTime = 1590066728;
    const sequenceId = 5;
    const tokenId = '1';

    const erc721Transfer = txBuilder.transfer() as ERC721TransferBuilder;
    erc721Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc721ContractAddress)
      .contractSequenceId(sequenceId)
      .tokenId(tokenId)
      .key(key);

    const sendMultisigCallData = erc721Transfer.signAndBuild(`${coin.chainId}`);
    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(erc721ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[2], tokenId);
  });

  it('should sign and build ERC721 transfer with Decoder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC721);

    const tokenId = '1';

    const erc721Transfer = txBuilder.transfer(erc721Encoding) as ERC721TransferBuilder;
    const sendMultisigCallData = erc721Transfer.signAndBuild(`${coin.chainId}`);
    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(erc721ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[2], tokenId);
  });

  it('should sign and build ERC1155 single transfer with Builder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC1155);

    const expireTime = 1590066728;
    const sequenceId = 5;
    const tokenId = 1;
    const value = 10;

    const erc1155Transfer = txBuilder.transfer() as ERC1155TransferBuilder;
    erc1155Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc1155ContractAddress)
      .contractSequenceId(sequenceId)
      .entry(tokenId, value)
      .key(key);

    const sendMultisigCallData = erc1155Transfer.signAndBuild(`${coin.chainId}`);
    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(ERC1155ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[2], tokenId);
    should.equal(decodedSafeTransferFromCallData.args[3], value);

    txBuilder.sign({ key: testData.PRIVATE_KEY });
    await txBuilder.build();
  });

  it('should sign and build ERC1155 single transfer with Decoder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC1155);

    const tokenId = '1';
    const value = '10';

    const erc1155Transfer = txBuilder.transfer(erc1155SafeTransferEncoding) as ERC1155TransferBuilder;
    const sendMultisigCallData = erc1155Transfer.signAndBuild(`${coin.chainId}`);

    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(ERC1155ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[2], tokenId);
    should.equal(decodedSafeTransferFromCallData.args[3], value);
  });

  it('should sign and build ERC1155 batch transfer with Builder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC1155);

    const expireTime = 1590066728;
    const sequenceId = 5;
    const tokenIds = [1, 2, 3];
    const values = [10, 10, 10];

    const erc1155Transfer = txBuilder.transfer() as ERC1155TransferBuilder;
    erc1155Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc1155ContractAddress)
      .contractSequenceId(sequenceId)
      .entry(tokenIds[0], values[0])
      .entry(tokenIds[1], values[1])
      .entry(tokenIds[2], values[2])
      .key(key);

    const sendMultisigCallData = erc1155Transfer.signAndBuild(`${coin.chainId}`);
    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(ERC1155ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.deepEqual(
      decodedSafeTransferFromCallData.args[2].map((x) => x.toNumber()),
      tokenIds
    );
    should.deepEqual(
      decodedSafeTransferFromCallData.args[3].map((x) => x.toNumber()),
      values
    );
  });

  it('should sign and build ERC1155 batch transfer with Decoder pattern', async () => {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC1155);

    const tokenIds = [1, 2, 3];
    const values = [10, 10, 10];

    const erc1155Transfer = txBuilder.transfer(erc1155BatchTransferEncoding) as ERC1155TransferBuilder;

    const sendMultisigCallData = erc1155Transfer.signAndBuild(`${coin.chainId}`);
    const decodedSendMultisigCallData = decodeTransaction(JSON.stringify(walletSimpleABI), sendMultisigCallData);

    const safeTransferFromCallData = decodedSendMultisigCallData.args[2];
    const decodedSafeTransferFromCallData = decodeTransaction(JSON.stringify(ERC1155ABI), safeTransferFromCallData);

    should.equal(decodedSafeTransferFromCallData.args[0].toLowerCase(), owner.toLowerCase());
    should.equal(decodedSafeTransferFromCallData.args[1].toLowerCase(), recipient.toLowerCase());
    should.deepEqual(
      decodedSafeTransferFromCallData.args[2].map((x) => x.toNumber()),
      tokenIds
    );
    should.deepEqual(
      decodedSafeTransferFromCallData.args[3].map((x) => x.toNumber()),
      values
    );
  });
});

function decodeTransaction(abi: string, calldata: string) {
  const contractInterface = new ethers.utils.Interface(abi);
  return contractInterface.parseTransaction({ data: calldata });
}
