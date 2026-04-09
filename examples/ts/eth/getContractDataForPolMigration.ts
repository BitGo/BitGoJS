/**
 * Get contract data required for Matic to Pol migration
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import * as ethAbi from 'ethereumjs-abi';

// Get data for calling approve method in MaticToken contract
function getApproveCallData() {
    // Amount here needs to be replaced with the amount of tokens to be migrated
    const data = ethAbi.methodID('approve', [ 'address', 'uint256' ]).toString('hex') + ethAbi.rawEncode([ 'address', 'uint256' ], [ '0x29e7DF7b6A1B2b07b731457f499E1696c60E2C4e', '1000000000000000000' ]).toString('hex')
    console.log('Data for calling approve method in MaticToken contract', `0x${data}`);
}

getApproveCallData();

// Get data for calling migrate method in PolygonMigration contract
function getMigrateCallData() {
    // Amount here needs to be replaced with the amount of tokens to be migrated
    const data = ethAbi.methodID('migrate', [ 'uint256' ]).toString('hex') + ethAbi.rawEncode([ 'uint256' ], [ '1000000000000000000' ]).toString('hex')
    console.log('Data for calling migrate method in PolygonMigration contract', `0x${data}`);
}

getMigrateCallData();
