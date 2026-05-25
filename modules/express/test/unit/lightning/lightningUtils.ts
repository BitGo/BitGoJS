import * as assert from 'assert';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { getLightningSignerConfig } from '../../../src/lightning/lightningUtils';

describe('Lightning signer config', () => {
  const lightningSignerConfigs = {
    fakeid1: {
      url: 'https://127.0.0.1:8080',
      tlsCert: 'tlsCert1',
    },
    fakeid2: {
      url: 'https://127.0.0.2:8080',
      tlsCert: 'tlsCert2',
    },
  };

  it('should get lightning signer config for wallet id', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));
    const config = await getLightningSignerConfig('fakeid2', {
      lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
    });
    config.should.deepEqual(lightningSignerConfigs.fakeid2);
    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });

  it('should convert http to https for signer url', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(
      JSON.stringify({
        fakeid1: {
          url: 'http://127.0.0.1:8080',
          tlsCert: 'tlsCert1',
        },
      })
    );
    const config = await getLightningSignerConfig('fakeid1', {
      lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
    });
    config.should.deepEqual(lightningSignerConfigs.fakeid1);
    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });

  it('should fail to get lightning signer config for invalid wallet id', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));

    await assert.rejects(
      async () =>
        await getLightningSignerConfig('fakeid3', {
          lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
        }),
      /Missing required configuration for walletId: fakeid3/
    );

    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });

  it('should fail to get invalid lightning signer config', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(
      JSON.stringify({
        fakeid1: {
          url: 'http://127.0.0.1:8080',
          tlsCert: 1,
        },
      })
    );

    await assert.rejects(
      async () =>
        await getLightningSignerConfig('fakeid1', {
          lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
        }),
      /Invalid lightning signer config file:/
    );

    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });
});
