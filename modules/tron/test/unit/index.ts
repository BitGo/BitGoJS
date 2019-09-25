import TronWeb = require('tronweb');

describe('Tron library', function() {
  it('should be able to create via constructor', () => {
    const tronWeb = new TronWeb({ fullHost: 'http://localhost:38124', privateKey: '19f47c22e6ea1206829f779190bce3a1d42265a9896988050b7be29eb72e60d3' });
  });
});