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
    txBuilder.contract(erc721ContractAddress);
  });

  it('should sign and build ERC721 transfer', async () => {
    txBuilder.type(TransactionType.SendERC721);

    // Dummy addresses
    const owner = "0x19645032c7f1533395d44a629462e751084d3e4d";
    const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c'
    const expireTime = 1590066728;
    const sequenceId = 5;

    txBuilder
      .erc721Transfer()
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .contractSequenceId(sequenceId)
      .tokenId(1)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    let tx = await txBuilder.build();
  });

  it('should sign and build ERC1155 transfer', async () => {
    txBuilder.type(TransactionType.SendERC1155);

    // Dummy addresses
    const owner = "0x19645032c7f1533395d44a629462e751084d3e4d";
    const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c'
    const expireTime = 1590066728;
    const sequenceId = 5;

    txBuilder
      .erc1155Transfer()
      .from(owner)
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
    let tx = await txBuilder.build();

    
  });

});
