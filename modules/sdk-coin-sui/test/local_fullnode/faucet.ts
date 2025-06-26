import axios from 'axios';

export class Faucet {
  public url: string;
  constructor(url: string) {
    this.url = url;
  }

  async getCoins(address: string, amount: number): Promise<void> {
    await axios.post(this.url + '/gas', { FixedAmountRequest: { recipient: address } });
  }
}
