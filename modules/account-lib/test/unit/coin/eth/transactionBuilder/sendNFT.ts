import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import * as testData from '../../../../resources/eth/eth';

describe('Eth transaction builder sendNFT', () => {
  // dummy addresses
  const owner = "0x19645032c7f1533395d44a629462e751084d3e4d";
  const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c'
  const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';

  // ens erc721
  const erc721ContractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
  // opensea erc1155
  const erc1155ContractAddress = '0x495f947276749ce646f68ac8c248420045cb7b5e';
  let key;

  beforeEach(() => {
    key = testData.KEYPAIR_PRV.getKeys().prv as string;
  });

  it('should sign and build ERC721 transfer', async () => {
    const txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
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

    const erc721Transfer = txBuilder.transfer() as Eth.ERC721TransferBuilder;
    erc721Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc721ContractAddress)
      .contractSequenceId(sequenceId)
      .tokenId(1)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const signedTx = await txBuilder.build();
    console.log(signedTx.toBroadcastFormat());
  });

  it('should sign and build ERC1155 transfer', async () => {
    const txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.contract(contractAddress);
    txBuilder.type(TransactionType.SendERC1155);

    const expireTime = 1590066728;
    const sequenceId = 5;
    const erc1155Transfer = txBuilder.transfer() as Eth.ERC1155TransferBuilder;
    erc1155Transfer
      .from(owner)
      .to(recipient)
      .expirationTime(expireTime)
      .tokenContractAddress(erc1155ContractAddress)
      .contractSequenceId(sequenceId)
      .entry(1, 10)
      .entry(2, 10)
      .entry(3, 10)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY });
    const signedTx = await txBuilder.build();
    console.log(signedTx.toBroadcastFormat());
  });

  // TODO: test decoding data
});
