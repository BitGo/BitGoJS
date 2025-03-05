import * as utils from '../../src/utils/staking';
import { testingNetworks } from '../helper';
import { Staking } from "../../src/staking";

describe.each(testingNetworks)("Staking input validations", ({
  network, datagen: { stakingDatagen: dataGenerator }
}) => {
  describe('validateDelegationInputs', () => {
    const params = dataGenerator.generateStakingParams(true);
    const feeRate = 1;
    const {
      stakingTx, timelock, stakerInfo, finalityProviderPkNoCoordHex,
    } = dataGenerator.generateRandomStakingTransaction(
      network, feeRate, undefined, undefined, undefined, params,
    );
    
    const stakingInstance = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );
    beforeEach(() => {
      jest.restoreAllMocks();
    });
  
    it('should throw an error if the timelock is out of range', () => {
      expect(() => {
        new Staking(
          network, stakerInfo,
          params, finalityProviderPkNoCoordHex, params.minStakingTimeBlocks - 1,
        );
      }).toThrow('Staking transaction timelock is out of range');

      expect(() => {
        new Staking(
          network, stakerInfo,
          params, finalityProviderPkNoCoordHex, params.maxStakingTimeBlocks + 1,
        );
      }).toThrow('Staking transaction timelock is out of range');
    });
  
    it('should throw an error if the output index is out of range', () => {
      jest.spyOn(utils, "findMatchingTxOutputIndex").mockImplementation(() => {
        throw new Error('Staking transaction output index is out of range');
      });
      expect(() => {
        stakingInstance.createWithdrawStakingExpiredPsbt(
          stakingTx, feeRate,
        );
      }).toThrow('Staking transaction output index is out of range');

      expect(() => {
        stakingInstance.createUnbondingTransaction(
          stakingTx
        );
      }).toThrow('Staking transaction output index is out of range');
    });
  });

  describe('validateParams', () => {
    const { publicKey, publicKeyNoCoord} = dataGenerator.generateRandomKeyPair();
    const { address } = dataGenerator.getAddressAndScriptPubKey(
      publicKey,
    ).taproot;
    
    const stakerInfo = {
      address,
      publicKeyNoCoordHex: publicKeyNoCoord,
      publicKeyWithCoord: publicKey,
    };
    const finalityProviderPkNoCoordHex = dataGenerator.generateRandomKeyPair().publicKeyNoCoord;
    const validParams = dataGenerator.generateStakingParams();
    const stakingInstance = new Staking(
      network,
      stakerInfo,
      validParams,
      finalityProviderPkNoCoordHex,
      dataGenerator.generateRandomTimelock(validParams),
    );
    

    it('should pass with valid parameters', () => {
      expect(() => new Staking(
        network,
        stakerInfo,
        validParams,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).not.toThrow();
    });

    it('should pass with valid parameters without slashing', () => {
      const paramsWithoutSlashing = { ...validParams, slashing: undefined };
      expect(() => new Staking(
        network,
        stakerInfo,
        paramsWithoutSlashing,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).not.toThrow();
    });

    it('should throw an error if covenant public keys are empty', () => {
      const params = { ...validParams, covenantNoCoordPks: [] };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Could not find any covenant public keys'
      );
    });

    it('should throw an error if covenant public keys are with coordinates', () => {
      const params = {
        ...validParams, 
        covenantNoCoordPks: validParams.covenantNoCoordPks.map(pk => '02' + pk )
      };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Covenant public key should contains no coordinate'
      );
    });

    it('should throw an error if covenant public keys are less than the quorum', () => {
      const params = { ...validParams, covenantQuorum: validParams.covenantNoCoordPks.length + 1 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Covenant public keys must be greater than or equal to the quorum'
      );
    });

    it('should throw an error if unbonding time is less than or equal to 0', () => {
      const params = { ...validParams, unbondingTime: 0 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Unbonding time must be greater than 0'
      );
    });

    it('should throw an error if unbonding fee is less than or equal to 0', () => {
      const params = { ...validParams, unbondingFeeSat: 0 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Unbonding fee must be greater than 0'
      );
    });

    it('should throw an error if max staking amount is less than min staking amount', () => {
      const params = { ...validParams, maxStakingAmountSat: 500 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Max staking amount must be greater or equal to min staking amount'
      );
    });

    it('should throw an error if min staking amount is less than 1', () => {
      const params = { ...validParams, minStakingAmountSat: -1 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Min staking amount must be greater than unbonding fee plus 1000'
      );

      const params0 = { ...validParams, minStakingAmountSat: 0 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params0,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Min staking amount must be greater than unbonding fee plus 1000'
      );
    });

    it('should throw an error if max staking time is less than min staking time', () => {
      const params = { ...validParams, maxStakingTimeBlocks: validParams.minStakingTimeBlocks - 1 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Max staking time must be greater or equal to min staking time'
      );
    });

    it('should throw an error if min staking time is less than 1', () => {
      const params = { ...validParams, minStakingTimeBlocks: -1 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Min staking time must be greater than 0'
      );

      const params0 = { ...validParams, minStakingTimeBlocks: 0 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params0,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Min staking time must be greater than 0'
      );
    });

    it('should throw an error if covenant quorum is less than or equal to 0', () => {
      const params = { ...validParams, covenantQuorum: 0 };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Covenant quorum must be greater than 0'
      );
    });

    it('should throw an error if slashing rate is not within the range', () => {
      const params0 = { ...validParams, slashing: {
        ...validParams.slashing!,
        slashingRate: 0,
      } };

      expect(() => new Staking(
        network,
        stakerInfo,
        params0,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Slashing rate must be greater than 0'
      );

      const params1 = { ...validParams, slashing: {
        ...validParams.slashing!,
        slashingRate: 1.1,
      } };

      expect(() => new Staking(
        network,
        stakerInfo,
        params1,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Slashing rate must be less or equal to 1'
      );
    });

    it('should throw an error if slashing public key scrit is empty', () => {
      const params = { ...validParams, slashing: {
        ...validParams.slashing!,
        slashingPkScriptHex: "",
      } };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Slashing public key script is missing'
      );
    });

    it('should throw an error if minSlashingTxFeeSat is not positive number', () => {
      const params = { ...validParams, slashing: {
        ...validParams.slashing!,
        minSlashingTxFeeSat: 0,
      } };

      expect(() => new Staking(
        network,
        stakerInfo,
        params,
        finalityProviderPkNoCoordHex,
        dataGenerator.generateRandomTimelock(validParams),
      )).toThrow(
        'Minimum slashing transaction fee must be greater than 0'
      );
    });
  });
});

