import {
  AccountId,
  AddProxyArgs,
  AddProxyBatchCallArgs,
  StakeBatchCallPayee,
  StakeBatchCallPayeeAccount,
  StakeBatchCallPayeeController,
  StakeBatchCallPayeeStaked,
  StakeBatchCallPayeeStash,
  ProxyArgs,
} from './iface';

/**
 * Returns true if value is of type AccountId, false otherwise.
 *
 * @param value The object to test.
 *
 * @return true if value is of type AccountId, false otherwise.
 */
export function isAccountId(value: string | AccountId): value is AccountId {
  return value.hasOwnProperty('id');
}

/**
 * Extracts the proxy address being added from an add proxy batch call or an add proxy call.

 * @param call A batched add proxy call or an add proxy call from which to extract the proxy
 * address.
 *
 * @return the proxy address being added from an add proxy batch call or an add proxy call.
 */
export function getDelegateAddress(call: AddProxyBatchCallArgs | AddProxyArgs): string {
  if (isAccountId(call.delegate)) {
    return call.delegate.id;
  } else {
    return call.delegate;
  }
}

/**
 * Returns true if value is of type StakeBatchCallPayeeStaked, false otherwise.
 *
 * @param value The object to test.
 *
 * @return true if value is of type StakeBatchCallPayeeStaked, false otherwise.
 */
export function isStakeBatchCallPayeeStaked(value: StakeBatchCallPayee): value is StakeBatchCallPayeeStaked {
  return (value as StakeBatchCallPayeeStaked).hasOwnProperty('staked');
}

/**
 * Returns true if value is of type StakeBatchCallPayeeStash, false otherwise.
 *
 * @param value The object to test.
 *
 * @return true if value is of type StakeBatchCallPayeeStash, false otherwise.
 */
export function isStakeBatchCallPayeeStash(value: StakeBatchCallPayee): value is StakeBatchCallPayeeStash {
  return (value as StakeBatchCallPayeeStash).hasOwnProperty('stash');
}

/**
 * Returns true if value is of type StakeBatchCallPayeeController, false otherwise.
 *
 * @param value The object to test.
 *
 * @return true if value is of type StakeBatchCallPayeeController, false otherwise.
 */
export function isStakeBatchCallPayeeController(value: StakeBatchCallPayee): value is StakeBatchCallPayeeController {
  return (value as StakeBatchCallPayeeController).hasOwnProperty('controller');
}

/**
 * Returns true if value is of type StakeBatchCallPayeeAccount, false otherwise.
 *
 * @param value The object to test.
 *
 * @return true if value is of type StakeBatchCallPayeeAccount, false otherwise.
 */
export function isStakeBatchCallPayeeAccount(value: StakeBatchCallPayee): value is StakeBatchCallPayeeAccount {
  return (
    (value as StakeBatchCallPayeeAccount).account !== undefined &&
    (value as StakeBatchCallPayeeAccount).account !== null
  );
}

/**
 * Extracts the proxy address being added from ProxyArgs.

 * @param args the ProxyArgs object from which to extract the proxy address.
 *
 * @return the proxy address being added.
 */
export function getAddress(args: ProxyArgs): string {
  if (isAccountId(args.real)) {
    return args.real.id;
  } else {
    return args.real;
  }
}
