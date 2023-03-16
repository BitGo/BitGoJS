// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { ObjectId, SuiMoveFunctionArgTypes } from '../types';
import { NotImplementedError } from '@bitgo/sdk-core';

export const TARGETED_RPC_VERSION = '0.27.0';

export interface PaginationArguments {
  /** Optional paging cursor */
  cursor?: ObjectId | null;
  /** Maximum item returned per page */
  limit?: number | null;
}

export class LocalProvider {
  /**
   * Get Move function argument types like read, write and full access
   */
  async getMoveFunctionArgTypes(input: {
    package: string;
    module: string;
    function: string;
  }): Promise<SuiMoveFunctionArgTypes> {
    throw new NotImplementedError('Method not implemented');
    // try {
    //   // TODO - replace with response from FN
    //
    //   // return await this.client.requestWithType(
    //   //   'sui_getMoveFunctionArgTypes',
    //   //   [input.package, input.module, input.function],
    //   //   SuiMoveFunctionArgTypes,
    //   //   this.options.skipDataValidation
    //   // );
    //   return null;
    // } catch (err) {
    //   throw new Error(
    //     `Error fetching Move function arg types with package object ID: ${input.package}, module name: ${input.module}, function name: ${input.function}`
    //   );
    // }
  }
}
