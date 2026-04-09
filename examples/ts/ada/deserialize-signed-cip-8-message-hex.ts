/**
 * Deserialize a signed CIP-8 message from an MPC wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc. All Rights Reserved.
 */
import { BaseCoin } from "@bitgo/statics";
import { MessageBuilderFactory, bufferToCoseObjectsOutput } from "@bitgo/sdk-coin-ada";

async function deserializeSignedCip8MessageHex(): Promise<void> {
    const signedMsgHex = '';

    const coinConfig = { name: 'ada' } as BaseCoin;
    const factory = new MessageBuilderFactory(coinConfig);
    const builder = factory.fromBroadcastString(signedMsgHex);
    const message = await builder.build();

    const payload = message.getPayload();
    console.log(`Message: ${payload}`);

    const address = message.getSigners()[0];
    console.log(`Signer address: ${address}`);

    const signature = message.getSignatures()[0].signature;
    const publicKeyHex = message.getSignatures()[0].publicKey.pub;
    console.log(`Public key hex: ${publicKeyHex}`);

    const coseObjectsOutput = await bufferToCoseObjectsOutput(signature);

    const coseKey = coseObjectsOutput.manualCoseKeyHex;
    console.log(`Cose key: ${coseKey}`);

    const coseSign1 = coseObjectsOutput.manualCoseSign1Hex;
    console.log(`Cose sign1: ${coseSign1}`);
}

deserializeSignedCip8MessageHex().catch(console.error);
