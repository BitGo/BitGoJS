import { SendFoundCreateDataBuilder } from './sendFoundCreateDataBuilder';

export class TxCreateDataBuilderFactory {
  static getSendFound(): SendFoundCreateDataBuilder {
    return new SendFoundCreateDataBuilder();
  }
}
