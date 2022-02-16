import should from 'should';
import { coins, EthereumNetwork } from '@bitgo/statics';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import * as testData from '../../../../resources/eth/eth';
import { decodeTransferData, getCommon } from '../../../../../src/coin/eth/utils';

describe('Eth transaction builder sendNFT', () => {
  // ens erc721
  let erc721ContractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
  // opensea erc1155
  let erc1155ContractAddress = '0x495f947276749ce646f68ac8c248420045cb7b5e';
  let key;
  let txBuilder;

  beforeEach(() => {
    txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    key = testData.KEYPAIR_PRV.getKeys().prv as string;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
    // txBuilder.contract(contractAddress);
  });

  it('should sign and build ERC721 transfer', async () => {

    // const owner = wallet.address;
    const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c'
    // const amount = 0;
    // const types = ['address', 'address', 'uint256'];
    // const values = [owner, toAddress, tokenId];
    // const data = await getMethodData(types, values, 'safeTransferFrom')
    const expireTime = 1590066728;
    const sequenceId = 5;
    // await wallet.sendMultiSig(
    //   erc721ContractAddress,
    //   amount,
    //   data,
    //   expireTime,
    //   sequenceId,
    //   // helpers.serializeSignature(sig),
    //   // { from: params.msgSenderAddress }
    // );

    // proposal 1
    txBuilder
      .nftTransfer()
      .to(recipient)
      .expirationTime(expireTime)
      .contractSequenceId(sequenceId)
      .ids([....])
      .values([....])
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const tx = await txBuilder.build();

    // proposal 2
    txBuilder
      .nftTransfer()
      .to(recipient)
      .expirationTime(expireTime)
      .contractSequenceId(sequenceId)
      .entries([
        { id: 1, value: 10 },
        { id: 2, value: 10 },
        { id: 3, value: 10 },
      ])
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const tx = await txBuilder.build();

    // proposal 3
    txBuilder
      .erc721Transfer()
      .to(recipient)
      .expirationTime(expireTime)
      .contractSequenceId(sequenceId)
      .tokenId(1)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const tx = await txBuilder.build();

    txBuilder
      .erc1155Transfer()
      .to(recipient)
      .expirationTime(expireTime)
      .contractSequenceId(sequenceId)
      .entries([
        { id: 1, value: 10 },
        { id: 2, value: 10 },
        { id: 3, value: 10 },
      ])
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const tx = await txBuilder.build();

  });
});
