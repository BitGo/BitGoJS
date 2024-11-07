import assert from 'assert';
import { EnvironmentName } from '../environments';

export const bitgoMpcGpgPubKeys = {
  mpcv1: {
    nitro: {
      test: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EYqEU5hMFK4EEAAoCAwQDdbAIZrsblEXIavyg2go6p9oG0SqWTgFsdHTc\nBhqdIS/WjQ8pj75q+vLqFtV9hlImYGInsIWh97fsigzB2owyzRhoc20gPGhz\nbUB0ZXN0LmJpdGdvLmNvbT7ChAQTEwgAFQUCYqEU5wILCQIVCAIWAAIbAwIe\nAQAhCRCJNRsIDGunexYhBHRL5D/8nRM3opQnXok1GwgMa6d7tg8A/24A9awq\nSCJx7RddiUzFHcKhVvvo3R5N7bHaOGP3TP79AP0TavF2WzhUXmZSjt3IK23O\n7/aknbijVeq52ghbWb1SwsJ1BBATCAAGBQJioRTnACEJEAWuA35KJgtgFiEE\nZttLPR0KcYvjgvJCBa4DfkomC2BsrwD/Z+43zOw+WpfPHxe+ypyVog5fnOKl\nXwleH6zDvqUWmWkA/iaHC6ullYkSG4Mv68k6qbtgR/pms/X7rkfa0QQFJy5p\nzlMEYqEU5hIFK4EEAAoCAwSsLqmfonjMF3o0nZ5JHvLpmfTA1RIVDsAEoRON\ntZA6rAA23pGl6s3Iyt4/fX9Adzoh3EElOjMsgi8Aj3dFpuqiAwEIB8J4BBgT\nCAAJBQJioRTnAhsMACEJEIk1GwgMa6d7FiEEdEvkP/ydEzeilCdeiTUbCAxr\np3vM7AD9GPp6HhYNEh2VVCDtFSt14Bni5FVM5icpVDo6w9ibvWAA/2Ti3Jv4\nIhIxl81/wqAgqigIblrz6vjtagr9/ykXQCW3\n=skCo\n-----END PGP PUBLIC KEY BLOCK-----\n',
      prod: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY4m6ZBMFK4EEAAoCAwRSTwdXgiY+EBNj2JgNzisUygcVGVxp1Fv+pT64\nTsJ64y9Fr5h9ljqMIsmM0MWn9hczpmdAEHpkSg264wAPNcIWzQtCaXRHbyBO\naXRyb8KEBBMTCAA2BQJjibpmAgsJCRDHgvrWqx65HwIVCAIWAAIbAwIeARYh\nBLgnzI9Cn6UamNlJ2MeC+tarHrkfAABEwgD/W0+LXpHEMtSnShf7rSg7tQfG\n1Bb6be2Y1utd+auj/EcA/jGJO8MtejxcVGBpH/ZrODL+D0yS/I2YD3nveLtD\nD5z3wnUEEBMIACcFAmOJumkJEHuS1voAd5fJFiEE1Xxbfbbr5zLGqNJ7e5LW\n+gB3l8kAAPtmAP0WZnW/cgGCWzG1NYbAU1sJUwYdspM1WDLByjmo5JkCrQD+\nOK/6U8zvmQEcoOq0YXArhb+yWQDDHDEkLxRptB+KO8nOUwRjibpkEgUrgQQA\nCgIDBOUvn/oNKZnjEMtnAbB6hoos8vDf8mqyIbtGRjDil1T3t19q2Ke6xFFo\nJ+U2w4gtFxjDER8igas+ja4P3u7EFlMDAQgHwngEGBMIACoFAmOJumgJEMeC\n+tarHrkfAhsMFiEEuCfMj0KfpRqY2UnYx4L61qseuR8AANHPAP96lvwGT3A0\nNNz1WAr+Sn13mR3k8arfeqcvZ1FCmioMogD9GzJIaJlbAbdsRB4QnLkRcKJO\nnMH13PKq9qM6tg4UQFM=\n=SD0h\n-----END PGP PUBLIC KEY BLOCK-----\n',
    },
    onprem: {
      test: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EYqEU5hMFK4EEAAoCAwQDdbAIZrsblEXIavyg2go6p9oG0SqWTgFsdHTc\nBhqdIS/WjQ8pj75q+vLqFtV9hlImYGInsIWh97fsigzB2owyzRhoc20gPGhz\nbUB0ZXN0LmJpdGdvLmNvbT7ChAQTEwgAFQUCYqEU5wILCQIVCAIWAAIbAwIe\nAQAhCRCJNRsIDGunexYhBHRL5D/8nRM3opQnXok1GwgMa6d7tg8A/24A9awq\nSCJx7RddiUzFHcKhVvvo3R5N7bHaOGP3TP79AP0TavF2WzhUXmZSjt3IK23O\n7/aknbijVeq52ghbWb1SwsJ1BBATCAAGBQJioRTnACEJEAWuA35KJgtgFiEE\nZttLPR0KcYvjgvJCBa4DfkomC2BsrwD/Z+43zOw+WpfPHxe+ypyVog5fnOKl\nXwleH6zDvqUWmWkA/iaHC6ullYkSG4Mv68k6qbtgR/pms/X7rkfa0QQFJy5p\nzlMEYqEU5hIFK4EEAAoCAwSsLqmfonjMF3o0nZ5JHvLpmfTA1RIVDsAEoRON\ntZA6rAA23pGl6s3Iyt4/fX9Adzoh3EElOjMsgi8Aj3dFpuqiAwEIB8J4BBgT\nCAAJBQJioRTnAhsMACEJEIk1GwgMa6d7FiEEdEvkP/ydEzeilCdeiTUbCAxr\np3vM7AD9GPp6HhYNEh2VVCDtFSt14Bni5FVM5icpVDo6w9ibvWAA/2Ti3Jv4\nIhIxl81/wqAgqigIblrz6vjtagr9/ykXQCW3\n=skCo\n-----END PGP PUBLIC KEY BLOCK-----\n',
      prod: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmE8EYqKKQRMFK4EEAAoCAwROWJbH3UCPdZTPEJXpPZcktwtDJwil4QHlXZELcUbF\nETboq/cY22w+uG0IlRypdbo6+sDuaeg3dfja2ioq6TtJtAVCaXRHb4iEBBMTCAAV\nBQJioopDAgsJAhUIAhYAAhsDAh4BACEJEFXOMjZat5vMFiEEFYS/Xvdht8iMtmyP\nVc4yNlq3m8ym1AD+P9clE3kj764YmrHDOcRPl/+tX2CoUD0rbdSYyJyfCwAA/As0\nF0UFbPzlxPSaZhV/jQxB+PsF4LViwDdh4V4pUtn9uFMEYqKKQRIFK4EEAAoCAwQh\n5wBrOktqJe4G5sbSOdyw1rn1/1EvkO4hj8R4C3UAK7Apz599Xbi6jt3pD2rhduL1\nFnS5zhziYSBkko/B2Iw8AwEIB4h4BBgTCAAJBQJioopEAhsMACEJEFXOMjZat5vM\nFiEEFYS/Xvdht8iMtmyPVc4yNlq3m8ymVwD8DwKddfZG+VgQtXrzh523Rwk0jl+E\nwdcV2h6AiKoV/3AA/jV+yS3+KTHk6Q89TGR2QftpckwcUTKON9puGe9+ulan\n=Yop7\n-----END PGP PUBLIC KEY BLOCK-----\n',
    },
  },
  mpcv2: {
    nitro: {
      test: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZiF3CBMFK4EEAAoCAwQWD7Pa752fAl4z0PxfWVC05d89vfo80PyUQ3Er\nLXlhGLkik+NkAl/DBd8diN7i4kTvRoIo0xrHU+lZgdgt+ct5zRhoc20gPGhz\nbUB0ZXN0LmJpdGdvLmNvbT7ChAQTEwgANgUCZiF3CAILCQkQ5ycuezbbVOkC\nFQgCFgACGwMCHgEWIQRPr6GNiE7tRv0p4afnJy57NttU6QAAbAYA+wRvSLOa\ne0iREOx00HhYWP030GhN98BcZtehT9iTZMV8AP97Otkrtq6jby2f7PdEV7uv\nd4aikTa5BgnpKvl8yqL4ccKEBBATCAA2BQJmIXcKAgsJCRCZRBfch5MUcwIV\nCAIWAAIbAwIeARYhBAmXBS0TYEvmC/3L9JlEF9yHkxRzAABJ1wD+KyI1j9nu\nYWvDxwDB+JBGMt7mic77ajBOgaCabEZ0j1MA/2RCOiV2cOL3x1AOzosqofsh\niA1s9BpS14xAwrKJPwY+zlMEZiF3CBIFK4EEAAoCAwSgLs60kLzhHD3o1sDg\n0fQ/QHw6hgq9PQ5LvilUvuIGYDR79sPwrMuwy7wUcOQgJvwIOJHommDq5nj+\nKfgAtE6uAwEIB8KEBBgTCAA2BQJmIXcJAgsJCRDnJy57NttU6QIVCAIWAAIb\nDAIeARYhBE+voY2ITu1G/Snhp+cnLns221TpAADWmQD/bV9sBkwyYfYfJYTS\nqvTmubCesQDY5Ranv9wYvv7RiLQA/iwX6ZHwdbvQFVui0GrvV2iFaCHut1pn\nF4YCDqpUKidwzk8EZiF3CBMFK4EEAAoCAwTfm/HZxwvubP/rr2KOU88mkDL9\njcWjfQx1uFZ9mlIgMBV3++OgtkVE0eEe+lNWpwgksGOGrBWeQ3K0XRF0YlUp\nwsBKBBgTCAC8BQJmIXcJAgsJCRDnJy57NttU6QIVCAIWAAIbAgIeAYUgBBgT\nCAA2BQJmIXcJAgsJCRBrEMTq2oOYhgIVCAIWAAIbAgIeARYhBLFg1zIcwAmc\nRhGdOmsQxOrag5iGAAAxoAD/YNPhMmf3l4Qh7fprkmOjoU0CvFiiP+kcxTr9\nm9luVhUA/RvhIB4sqrAcSD7ZGVIQcEI14rdAFeok4Higz2cGf9R6FiEET6+h\njYhO7Ub9KeGn5ycuezbbVOkAAPnaAP0dYpya7EzvN5Q6RpIzqLFN9izyGt4Q\n6keZsvnVbW9qJAD9Fj7tAAMUbbstz/Kx9RY8qoIOFTuSwaeDXnJMrI9v84w=\n=uzVB\n-----END PGP PUBLIC KEY BLOCK-----\n',
      prod: '',
    },
    onprem: {
      test: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZiF3CBMFK4EEAAoCAwQWD7Pa752fAl4z0PxfWVC05d89vfo80PyUQ3Er\nLXlhGLkik+NkAl/DBd8diN7i4kTvRoIo0xrHU+lZgdgt+ct5zRhoc20gPGhz\nbUB0ZXN0LmJpdGdvLmNvbT7ChAQTEwgANgUCZiF3CAILCQkQ5ycuezbbVOkC\nFQgCFgACGwMCHgEWIQRPr6GNiE7tRv0p4afnJy57NttU6QAAbAYA+wRvSLOa\ne0iREOx00HhYWP030GhN98BcZtehT9iTZMV8AP97Otkrtq6jby2f7PdEV7uv\nd4aikTa5BgnpKvl8yqL4ccKEBBATCAA2BQJmIXcKAgsJCRCZRBfch5MUcwIV\nCAIWAAIbAwIeARYhBAmXBS0TYEvmC/3L9JlEF9yHkxRzAABJ1wD+KyI1j9nu\nYWvDxwDB+JBGMt7mic77ajBOgaCabEZ0j1MA/2RCOiV2cOL3x1AOzosqofsh\niA1s9BpS14xAwrKJPwY+zlMEZiF3CBIFK4EEAAoCAwSgLs60kLzhHD3o1sDg\n0fQ/QHw6hgq9PQ5LvilUvuIGYDR79sPwrMuwy7wUcOQgJvwIOJHommDq5nj+\nKfgAtE6uAwEIB8KEBBgTCAA2BQJmIXcJAgsJCRDnJy57NttU6QIVCAIWAAIb\nDAIeARYhBE+voY2ITu1G/Snhp+cnLns221TpAADWmQD/bV9sBkwyYfYfJYTS\nqvTmubCesQDY5Ranv9wYvv7RiLQA/iwX6ZHwdbvQFVui0GrvV2iFaCHut1pn\nF4YCDqpUKidwzk8EZiF3CBMFK4EEAAoCAwTfm/HZxwvubP/rr2KOU88mkDL9\njcWjfQx1uFZ9mlIgMBV3++OgtkVE0eEe+lNWpwgksGOGrBWeQ3K0XRF0YlUp\nwsBKBBgTCAC8BQJmIXcJAgsJCRDnJy57NttU6QIVCAIWAAIbAgIeAYUgBBgT\nCAA2BQJmIXcJAgsJCRBrEMTq2oOYhgIVCAIWAAIbAgIeARYhBLFg1zIcwAmc\nRhGdOmsQxOrag5iGAAAxoAD/YNPhMmf3l4Qh7fprkmOjoU0CvFiiP+kcxTr9\nm9luVhUA/RvhIB4sqrAcSD7ZGVIQcEI14rdAFeok4Higz2cGf9R6FiEET6+h\njYhO7Ub9KeGn5ycuezbbVOkAAPnaAP0dYpya7EzvN5Q6RpIzqLFN9izyGt4Q\n6keZsvnVbW9qJAD9Fj7tAAMUbbstz/Kx9RY8qoIOFTuSwaeDXnJMrI9v84w=\n=uzVB\n-----END PGP PUBLIC KEY BLOCK-----\n',
      prod: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZmHyKBMFK4EEAAoCAwS+tBY/2P47G0mgYRhq90jK475f02f3f3W4VbKA\nSwd9s6aI5spk7GeYsjRvP6rBf4vFIjLj7Ty7K2V03rZPQc8bzQVCaXRHb8KE\nBBMTCAA2BQJmYfIpAgsJCRAKMB4ATA5V7QIVCAIWAAIbAwIeARYhBAIdflLB\nK4deHok+gQowHgBMDlXtAACRpAD/UUbTsFEkjt+CCJmVq2v5l6oocR9hXXkT\nzhRQKQIwSigA/RVvS2RsoZLkaL68GUHLy63XVHtG149pN3BYPwb63EcQwoQE\nEBMIADYFAmZh8ioCCwkJEFlh2DLM6IVNAhUIAhYAAhsDAh4BFiEEsb9f1VA0\n9rOLgFM+WWHYMszohU0AAFC8AP4wH0ndmzCSg2O/a+ZfqW2yA465BFvDM1ij\nvMtCJYSxzAD/RjcfDfkN4Ipjaa2LRuHxfHZbvgCgoOChsJLv4KQLTafOUwRm\nYfIoEgUrgQQACgIDBM+W01KEUaAm8a3hMBWG9EShyNrZxbtv9ryd8JIIxeEb\nEckLTVQvIer3YvDUyjeY/v83VCRdm6H5cahV92sydrIDAQgHwoQEGBMIADYF\nAmZh8ikCCwkJEAowHgBMDlXtAhUIAhYAAhsMAh4BFiEEAh1+UsErh14eiT6B\nCjAeAEwOVe0AAEcSAP9H96t/z9uKe9lAoq2d9Dt3Hrq9eM6sLQ2+cVblngP+\nDQD/dCqHYQzDdsuc9Y3HmWbhCK1Um6ewppkct1v5lmbaJ1bOTwRmYfIoEwUr\ngQQACgIDBJDIofWOLj/JkBFkZDh3a++LNEH8TBNlDZvU7tNfURXWApxV2VAb\nFBKYddN03Q1SBpMR0GkPl42rH7whYdeaEBHCwEoEGBMIALwFAmZh8ioCCwkJ\nEAowHgBMDlXtAhUIAhYAAhsCAh4BhSAEGBMIADYFAmZh8ioCCwkJEGAfBsMT\nFzVjAhUIAhYAAhsCAh4BFiEE2zAGHSaLnswqIvBrYB8GwxMXNWMAANroAP0f\ntFPumKFwQrCf7OMHQWsesrQYpKT6Z65VbewBoGaGigD/UkeeygTtlyzTV2YF\nNAjWAzaQtXWmmzRgnOj0IKub39MWIQQCHX5SwSuHXh6JPoEKMB4ATA5V7QAA\nTjMA/jDSVXJNblr/kSLNFTordgDjKP0nN1aElvFUFh/QEVT0AP9lmf2Fc/o7\nyYOGPPg4OvvU6odrTsuNgljvPqBlaCc2EA==\n=ZLkt\n-----END PGP PUBLIC KEY BLOCK-----\n',
    },
  },
};

export function getBitgoMpcGpgPubKey(
  env: EnvironmentName,
  pubKeyType: 'nitro' | 'onprem',
  mpcVersion: 'mpcv1' | 'mpcv2'
): string {
  assert(
    mpcVersion in bitgoMpcGpgPubKeys,
    `Invalid mpcVersion in getBitgoMpcGpgPubKey, got: ${mpcVersion}, expected: mpcv1 or mpcv2`
  );
  assert(
    pubKeyType in bitgoMpcGpgPubKeys[mpcVersion],
    `Invalid pubKeyType in getBitgoMpcGpgPubKey, got: ${pubKeyType}, expected: nitro or onprem`
  );
  if (env !== 'prod' && env !== 'test' && env !== 'staging' && env !== 'adminProd' && env !== 'adminTest') {
    throw new Error('Invalid environment to get a BitGo MPC GPG public key');
  }
  if (env !== 'prod' && env !== 'adminProd') {
    // default to test gpg keys if not in prod
    env = 'test';
  }
  if (env === 'adminProd') {
    env = 'prod';
  }
  if (pubKeyType === 'nitro' && env === 'prod' && mpcVersion === 'mpcv2') {
    throw new Error('Nitro mpcv2 pub key is not available in production environments yet.');
  }
  if (pubKeyType !== 'nitro') {
    // This will be the default key type
    pubKeyType = 'onprem';
  }
  return bitgoMpcGpgPubKeys[mpcVersion][pubKeyType][env];
}

export function isBitgoMpcPubKey(key: string, mpcvVersion: 'mpcv1' | 'mpcv2'): boolean {
  return Object.values(bitgoMpcGpgPubKeys[mpcvVersion]).some((envKeys) => Object.values(envKeys).includes(key));
}

export function envRequiresBitgoPubGpgKeyConfig(env: EnvironmentName): boolean {
  return env === 'prod' || env === 'test' || env === 'staging' || env === 'adminProd' || env === 'adminTest';
}
