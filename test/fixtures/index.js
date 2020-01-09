const { networks, coins } = require('../..')

/**
 * @param {Network} network
 * @param {Network} fileName
 * @returns {Object} fixtures
 */
function getFixturesForNetwork (network, fileName) {
  if (coins.isTestnet(network)) {
    throw new Error(`mainnet and testnet fixtures must be in same directory`)
  }

  if (coins.isBitcoin(network)) {
    return require(`./${fileName}`)
  }

  return require(`./forks/${coins.getNetworkName(network)}/${fileName}`)
}

/**
 *
 * @param {Network[]} forkNetworks - networks (beside bitcoin) to load fixtures for
 * @param {string} fileName - the fixture file name
 * @param {Function} combineFunc - combinator function.
 *                                 Receives arguments (acc: Fixtures, network: Network, fixtures: Fixtures) and
 *                                 returns combined value of `acc` and `fixtures`.
 *                                 Will be called with bitcoin fixtures on first call.
 * @returns {Object}
 */
function combineFixtures (forkNetworks, fileName, combineFunc) {
  // FIXME(BG-16846): add fixtures for all coins, remove `forkNetworks`
  return forkNetworks
    .reduce(
      (acc, network) => combineFunc(acc, network, getFixturesForNetwork(network, fileName)),
      getFixturesForNetwork(networks.bitcoin, fileName)
    )
}

/**
 * @returns {Object} combined fixtures for TransactionBuilder tests
 */
function getFixturesTransactionBuilder () {
  return combineFixtures(
    [networks.dash, networks.zcash],
    'transaction_builder',
    (acc, network, fixtures) => {
      if (
        ((typeof fixtures.valid) !== 'object') ||
        !Array.isArray(fixtures.valid.multisig)
      ) {
        throw new Error(`invalid fixtures for ${coins.getNetworkName(network)}`)
      }

      acc.valid.multisig.push(...fixtures.valid.multisig)
      return acc
    }
  )
}

module.exports = {
  getFixturesTransactionBuilder
}
