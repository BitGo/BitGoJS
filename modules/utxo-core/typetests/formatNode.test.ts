import { expect } from 'tstyche';

import { MiniscriptNode } from '../src/descriptor';

{
  expect({ pk: 1 }).type.not.toBeAssignableTo<MiniscriptNode>();
  expect({ pk: 'lol' }).type.toBeAssignableTo<MiniscriptNode>();
  expect({ 'a:pk': 'lol' }).type.toBeAssignableTo<MiniscriptNode>();
}
