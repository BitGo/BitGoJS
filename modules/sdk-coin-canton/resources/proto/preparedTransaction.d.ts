declare module '../../resources/proto/preparedTransaction.js' {
  import { MessageType } from '@protobuf-ts/runtime';
  import { PreparedTransaction as IPreparedTransaction } from '../../src/lib/iface';

  export const PreparedTransaction: MessageType<IPreparedTransaction>;
}

export {};
