# @bitgo/sdk-test Package

This package refactors the old TestBitGo and some utilities in bitgo module and allows us to move the coin test cases to their own coin packages a little more easily and efficiently.

There is an exported function `decorate` from the package that decorates the class passed into it and returns an instance similar to the old TestBitGo.

After calling `decorate` function, we should declare TestBitGoStatics in order to access static members in the test package i.e TEST_WALLET1_PASSCODE, TEST_WALLET1_ADDRESS, and etc.

## How to use the sdk-test package with BitGo class

```typescript
import { decorate, TestableBG } from '@bitgo/sdk-test';
import { BitGo } from '<path_to_BitGo_in_bitgo_module>';

const bitgo = decorate(BitGo, { env: 'custom' });
const TestBitGoStatics: TestableBG = BitGo as unknown as Testable;

// Then bitgo could be used as usual in the old test cases.
```

## How to use the sdk-test package with BitGoAPI for coin specific package testing

```typescript
import { decorate, TestableBG } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Talgo } from '<path_to_Talgo_class>';
import { AlgoToken } from '<path_to_AlgoToken_class>';

const bitgo = decorate(BitGoAPI, { env: 'custom' });
const TestBitGoStatics: TestableBG = BitGoAPI as unknown as Testable;

// to register a coin with the new factory
bitgo.register('talgo', Talgo.createInstance);
const talgo = bitgo.coin('talgo');
```
