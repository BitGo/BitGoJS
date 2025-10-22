import { BitGo } from 'bitgo';
import { Config } from './config';

export async function getBitGoInstance(config: Config): Promise<BitGo> {
  const bitgoOptions: any = { env: config.env };
  
  if (config.customRootUri) {
    bitgoOptions.customRootUri = config.customRootUri;
  }
  
  if (config.customBitcoinNetwork) {
    bitgoOptions.customBitcoinNetwork = config.customBitcoinNetwork;
  }

  const bitgo = new BitGo(bitgoOptions);
  await bitgo.authenticateWithAccessToken({ accessToken: config.accessToken });
  
  return bitgo;
}

export async function unlockIfNeeded(bitgo: BitGo, config: Config): Promise<void> {
  if (config.otp) {
    const unlocked = await bitgo.unlock({ otp: config.otp, duration: 3600 });
    if (!unlocked) {
      throw new Error('Failed to unlock BitGo session with provided OTP');
    }
  }
}

