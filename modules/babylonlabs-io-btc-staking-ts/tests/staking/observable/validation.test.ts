import { ObservableStaking } from '../../../src/staking/observable';
import { testingNetworks } from '../../helper';


describe.each(testingNetworks)("Observable", ({
  network, networkName, datagen: { observableStakingDatagen: dataGenerator }
}) => {
  describe(`${networkName} validateParams`, () => {
    const { publicKey, publicKeyNoCoord} = dataGenerator.generateRandomKeyPair();
    const { address } = dataGenerator.getAddressAndScriptPubKey(
      publicKey,
    ).taproot;
    const params = dataGenerator.generateStakingParams(true);
    
    const stakerInfo = {
      address,
      publicKeyNoCoordHex: publicKeyNoCoord,
      publicKeyWithCoord: publicKey,
    };
    const validParams = dataGenerator.generateStakingParams();

    const finalityProviderPksNoCoordHex = dataGenerator.generateRandomFidelityProviderPksNoCoordHex(1);

    it('should pass with valid parameters', () => {
      expect(() => new ObservableStaking(
        network,
        stakerInfo,
        params,
        finalityProviderPksNoCoordHex,
        dataGenerator.generateRandomTimelock(params),
      )).not.toThrow();
    });

    it('should throw an error if no tag', () => {
      const params = { ...validParams, tag: "" };

      expect(() => new ObservableStaking(
        network,
        stakerInfo,
        params,
        finalityProviderPksNoCoordHex,
        dataGenerator.generateRandomTimelock(params),
      )).toThrow(
        "Observable staking parameters must include tag" 
      );
    });

    it('should throw an error if no btcActivationHeight', () => {
      const params = { ...validParams, btcActivationHeight: 0 };

      expect(() => new ObservableStaking(
        network,
        stakerInfo,
        params,
        finalityProviderPksNoCoordHex,
        dataGenerator.generateRandomTimelock(params),
      )).toThrow(
        "Observable staking parameters must include a positive activation height" 
      );
    });

    it('should throw an error if number of finality provider public keys is not 1', () => {
      const finalityProviderPksNoCoordHex = dataGenerator.generateRandomFidelityProviderPksNoCoordHex(2);

      expect(() => new ObservableStaking(
        network,
        stakerInfo,
        params,
        finalityProviderPksNoCoordHex,
        dataGenerator.generateRandomTimelock(params),
      )).toThrow(
        "Observable staking requires exactly one finality provider public key"
      );
    });
  });
});