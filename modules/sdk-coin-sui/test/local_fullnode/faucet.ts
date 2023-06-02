import axios from 'axios';

export class Faucet {
  constructor(public url: string) {}

  async getCoins(address: string, amount: number): Promise<void> {
    await axios.post(this.url + '/gas', { FixedAmountRequest: { recipient: address } });
  }
}
