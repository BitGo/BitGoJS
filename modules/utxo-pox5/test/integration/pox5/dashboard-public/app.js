const network = document.querySelector('#network');
const fullnodeMode = document.querySelector('#fullnodeMode');
const accountPreset = document.querySelector('#accountPreset');
const seedPhrase = document.querySelector('#seedPhrase');
const amountSats = document.querySelector('#amountSats');
const signerManager = document.querySelector('#signerManager');
const bondIndex = document.querySelector('#bondIndex');
const message = document.querySelector('#message');
const logOutput = document.querySelector('#logOutput');
const autoScroll = document.querySelector('#autoScroll');
const clearLogs = document.querySelector('#clearLogs');
const bitgoEnvironment = document.querySelector('#bitgoEnvironment');
const bitgoCoin = document.querySelector('#bitgoCoin');
const bitgoCreatePassphrase = document.querySelector('#bitgoCreatePassphrase');
const bitgoDepositPassphrase = document.querySelector('#bitgoDepositPassphrase');
const bitgoWithdrawalPassphrase = document.querySelector('#bitgoWithdrawalPassphrase');
const bitgoDepositWallet = document.querySelector('#bitgoDepositWallet');
const bitgoWithdrawalWallet = document.querySelector('#bitgoWithdrawalWallet');
const bitgoDelegation = document.querySelector('#bitgoDelegation');
const bitgoWithdrawalAmount = document.querySelector('#bitgoWithdrawalAmount');
const privateSignerManager = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP.signer-manager';

const pageNames = ['nodes', 'wallets', 'bitgo-api', 'staked-funds'];
let lastLogId = 0;
let pendingDepositOperationId;
let pendingWithdrawalOperationId;

function currentPage() {
  const page = window.location.hash.slice(2);
  return pageNames.includes(page) ? page : 'nodes';
}

function requestBody() {
  return {
    network: network.value,
    fullnodeMode: fullnodeMode.value,
    seedPhrase: accountPreset.value === 'phrase' ? seedPhrase.value : '',
    accountPreset: accountPreset.value === 'phrase' ? undefined : accountPreset.value,
    amountSats: Number(amountSats.value),
    signerManager: signerManager.value.trim() || undefined,
    bondIndex: bondIndex.value === '' ? undefined : Number(bondIndex.value),
  };
}

function show(id, value) {
  document.querySelector(`#${id}`).textContent = JSON.stringify(value, null, 2);
}

function setMessage(value) {
  message.textContent = value;
  message.classList.toggle('error', value.startsWith('Error:'));
}

function formatError(value) {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    if (value.error !== undefined) return formatError(value.error);
    try {
      return JSON.stringify(value);
    } catch {
      return 'Unserializable error object';
    }
  }
  return String(value);
}

function showError(error) {
  setMessage(`Error: ${formatError(error)}`);
}

function appendLogs(entries) {
  if (logOutput.textContent === 'Waiting for trace events...') logOutput.textContent = '';
  entries.forEach((entry) => {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const request = entry.requestId ? ` ${entry.requestId}` : '';
    const line = `[${timestamp}] [${entry.level.toUpperCase()}]${request} ${entry.message}`;
    logOutput.textContent += `${logOutput.textContent.length === 0 ? '' : '\n'}${line}`;
    if (entry.stack) logOutput.textContent += `\n${entry.stack}`;
    lastLogId = Math.max(lastLogId, entry.id);
  });
  if (autoScroll.checked) logOutput.scrollTop = logOutput.scrollHeight;
}

async function pollLogs() {
  try {
    const response = await fetch(`/api/logs?after=${lastLogId}`);
    const value = await response.json();
    if (response.ok && Array.isArray(value.entries)) appendLogs(value.entries);
  } catch {
    // The main dashboard should remain usable if the trace poll is interrupted.
  }
}

function setPage(page) {
  document.querySelectorAll('[data-page]').forEach((element) => {
    element.hidden = element.dataset.page !== page;
  });
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === page);
  });
}

async function post(path, body = requestBody()) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatError(value.error ?? value));
  return value;
}

function renderBitcoinTransactions(transactions) {
  const body = document.querySelector('#btcTransactions');
  body.replaceChildren();
  if (transactions.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No transactions</td></tr>';
    return;
  }
  transactions.forEach((transaction) => {
    const row = document.createElement('tr');
    [
      transaction.category,
      transaction.amountBtc,
      transaction.confirmations,
      transaction.address ?? '-',
      transaction.txid,
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    });
    body.append(row);
  });
}

function renderStacksTransactions(transactions) {
  const body = document.querySelector('#stxTransactions');
  body.replaceChildren();
  if (transactions.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No transactions</td></tr>';
    return;
  }
  transactions.forEach((transaction) => {
    const row = document.createElement('tr');
    [
      transaction.tx_type ?? '-',
      transaction.tx_status ?? '-',
      transaction.block_height ?? '-',
      transaction.fee_rate ?? '-',
      transaction.tx_id ?? '-',
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    });
    body.append(row);
  });
}

async function refreshNodes() {
  setMessage('Refreshing node and network state...');
  const value = await post('/api/status');
  show('nodeBitcoin', value.bitcoin);
  show('nodeStacks', value.stacks);
  show('nodeEndpoints', value.endpoints);
  setMessage(`Network state loaded for ${value.network} in ${value.fullnodeMode} mode.`);
}

async function refreshWallets() {
  setMessage('Refreshing BTC and STX wallets...');
  const [btc, stx] = await Promise.all([post('/api/btc-wallet'), post('/api/stx-wallet')]);
  document.querySelector('#btcAddress').textContent = btc.address;
  show('btcBalance', btc.balance);
  renderBitcoinTransactions(btc.transactions);
  document.querySelector('#stxAddress').textContent = stx.address;
  show('stxBalance', stx.account);
  renderStacksTransactions(stx.transactions);
  setMessage(
    `BTC and STX wallets loaded for ${stx.address}${
      stx.mnemonicTranslated ? ' (phrase translated to deterministic BIP39)' : ''
    }.`
  );
}

async function refreshStakedFunds() {
  setMessage('Refreshing staked funds...');
  const value = await post('/api/staked-funds');
  document.querySelector('#stakeAddress').textContent = value.address ?? 'No staker address configured';
  show('stakeMembership', value.stakes);
  setMessage(`Stake state loaded for ${value.address ?? 'the selected account'}.`);
}

function bitgoRequestBody() {
  return { environment: bitgoEnvironment.value, coin: bitgoCoin.value };
}

function renderBitGoWallets(wallets) {
  const rows = document.querySelector('#bitgoWalletRows');
  rows.replaceChildren();
  if (wallets.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">No wallets returned for this coin</td>';
    rows.append(row);
  } else {
    wallets.forEach((wallet) => {
      const row = document.createElement('tr');
      const values = [
        wallet.label,
        wallet.id,
        wallet.balanceSats,
        `${wallet.type} / ${wallet.multisigType}${wallet.isStakingWallet ? ' / staking' : ''}`,
        wallet.pairedWalletId ?? 'Not paired',
      ];
      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.append(cell);
      });
      rows.append(row);
    });
  }

  [bitgoDepositWallet, bitgoWithdrawalWallet].forEach((select) => {
    const previousValue = select.value;
    const options = wallets.filter((wallet) => !wallet.isStakingWallet && wallet.multisigType === 'onchain');
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = options.length === 0 ? 'No fixed-script wallets' : 'Select a fixed-script wallet';
    select.append(placeholder);
    options.forEach((wallet) => {
      const option = document.createElement('option');
      option.value = wallet.id;
      option.textContent = `${wallet.label} · ${wallet.id}`;
      select.append(option);
    });
    if (options.some((wallet) => wallet.id === previousValue)) select.value = previousValue;
    else if (options.length > 0) select.value = options[0].id;
  });
}

function resetBitGoPreviews() {
  pendingDepositOperationId = undefined;
  pendingWithdrawalOperationId = undefined;
  document.querySelector('#bitgoDepositReview').textContent = 'No deposit prepared';
  document.querySelector('#bitgoWithdrawalReview').textContent = 'No withdrawal prepared';
  document.querySelector('[data-bitgo-action="send-deposit"]').disabled = true;
  document.querySelector('[data-bitgo-action="send-withdrawal"]').disabled = true;
  bitgoDepositPassphrase.value = '';
  bitgoWithdrawalPassphrase.value = '';
  bitgoDelegation.replaceChildren();
  bitgoWithdrawalAmount.value = '';
}

async function refreshBitGo() {
  setMessage('Checking BitGo API authentication...');
  const body = bitgoRequestBody();
  const status = await post('/api/bitgo/status', { environment: body.environment });
  document.querySelector('#bitgoConnectionStatus').textContent = JSON.stringify(status, null, 2);
  if (!status.authenticated) {
    renderBitGoWallets([]);
    setMessage(
      status.configured
        ? `BitGo ${status.environment} authentication failed.`
        : `${status.tokenVariable} is not set in the dashboard process environment.`
    );
    return;
  }
  const result = await post('/api/bitgo/wallets', body);
  renderBitGoWallets(result.wallets);
  if (bitgoWithdrawalWallet.value) await refreshBitGoDelegations();
  setMessage(`Authenticated with BitGo ${status.environment}; loaded ${result.wallets.length} ${body.coin} wallets.`);
}

async function refreshBitGoDelegations() {
  const walletId = bitgoWithdrawalWallet.value;
  if (!walletId) {
    bitgoDelegation.replaceChildren();
    bitgoWithdrawalAmount.value = '';
    return;
  }
  const result = await post('/api/bitgo/delegations', { ...bitgoRequestBody(), walletId });
  bitgoDelegation.replaceChildren();
  const delegations = result.delegations.filter((delegation) => delegation.status === 'ACTIVE');
  if (delegations.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No active delegations';
    bitgoDelegation.append(option);
    bitgoWithdrawalAmount.value = '';
    return;
  }
  delegations.forEach((delegation) => {
    const option = document.createElement('option');
    option.value = delegation.id;
    option.dataset.amountSats = delegation.amountSats;
    option.textContent = `${delegation.id} · ${delegation.amountSats} sats`;
    bitgoDelegation.append(option);
  });
  bitgoWithdrawalAmount.value = bitgoDelegation.selectedOptions[0].dataset.amountSats;
}

function reviewConfirmation(review) {
  const outputs = review.outputs
    .map((output) => `${output.outputType}: ${output.amountSats} sats → ${output.address}`)
    .join('\n');
  const maturity =
    review.unlockHeight === undefined
      ? ''
      : `\nTimelock unlock height: ${review.unlockHeight}\nCurrent block height: ${review.currentBlockHeight}`;
  return `Amount: ${review.amountSats} sats\nFee: ${review.feeSats} sats${maturity}\nOutputs:\n${outputs}`;
}

async function createBitGoWallet() {
  if (!window.confirm(`Create a hot on-chain wallet on ${bitgoEnvironment.value} for ${bitgoCoin.value}?`)) return;
  const button = document.querySelector('[data-bitgo-action="create-wallet"]');
  const walletPassphrase = bitgoCreatePassphrase.value;
  button.disabled = true;
  try {
    const result = await post('/api/bitgo/wallets/create', {
      ...bitgoRequestBody(),
      label: document.querySelector('#bitgoWalletLabel').value,
      walletPassphrase,
    });
    document.querySelector('#bitgoCreateResult').textContent = JSON.stringify(result.wallet, null, 2);
    setMessage(`Created BitGo wallet ${result.wallet.id}.`);
    try {
      await refreshBitGo();
    } catch (error) {
      setMessage(`Created BitGo wallet ${result.wallet.id}; wallet refresh failed: ${formatError(error)}`);
    }
  } finally {
    bitgoCreatePassphrase.value = '';
    button.disabled = false;
  }
}

async function prepareBitGoDeposit() {
  const button = document.querySelector('[data-bitgo-action="prepare-deposit"]');
  button.disabled = true;
  pendingDepositOperationId = undefined;
  document.querySelector('[data-bitgo-action="send-deposit"]').disabled = true;
  try {
    const result = await post('/api/bitgo/deposits/prepare', {
      ...bitgoRequestBody(),
      walletId: bitgoDepositWallet.value,
      amountSats: document.querySelector('#bitgoDepositAmount').value,
      signerManager: document.querySelector('#bitgoSignerManager').value,
      bondIndex: document.querySelector('#bitgoBondIndex').value,
      numCycles: document.querySelector('#bitgoNumCycles').value || undefined,
      startBurnHt: document.querySelector('#bitgoStartBurnHt').value || undefined,
    });
    pendingDepositOperationId = result.operationId;
    document.querySelector('#bitgoDepositReview').textContent = JSON.stringify(result, null, 2);
    document.querySelector('[data-bitgo-action="send-deposit"]').disabled = false;
    setMessage(
      `Deposit prepared; paired staking wallet ${result.pairedWalletId} is linked. Review the outputs before signing.`
    );
  } finally {
    button.disabled = false;
  }
}

async function sendBitGoDeposit() {
  if (!pendingDepositOperationId) throw new Error('Prepare a deposit before signing');
  const review = JSON.parse(document.querySelector('#bitgoDepositReview').textContent).review;
  if (!window.confirm(`Submit this PoX-5 deposit to ${bitgoEnvironment.value}?\n\n${reviewConfirmation(review)}`))
    return;
  const walletPassphrase = bitgoDepositPassphrase.value;
  const button = document.querySelector('[data-bitgo-action="send-deposit"]');
  button.disabled = true;
  try {
    const result = await post('/api/bitgo/deposits/send', {
      ...bitgoRequestBody(),
      operationId: pendingDepositOperationId,
      walletPassphrase,
    });
    document.querySelector('#bitgoDepositReview').textContent = JSON.stringify(result, null, 2);
    pendingDepositOperationId = undefined;
    try {
      await refreshBitGo();
    } catch (error) {
      setMessage(`Deposit submitted; wallet refresh failed: ${formatError(error)}`);
    }
    document.querySelector('#bitgoDepositReview').textContent = JSON.stringify(result, null, 2);
    setMessage(`Deposit submitted; staking request ${result.requestId} is ${result.status}.`);
  } finally {
    bitgoDepositPassphrase.value = '';
    button.disabled = pendingDepositOperationId === undefined;
  }
}

async function prepareBitGoWithdrawal() {
  const button = document.querySelector('[data-bitgo-action="prepare-withdrawal"]');
  button.disabled = true;
  pendingWithdrawalOperationId = undefined;
  document.querySelector('[data-bitgo-action="send-withdrawal"]').disabled = true;
  try {
    const result = await post('/api/bitgo/withdrawals/prepare', {
      ...bitgoRequestBody(),
      walletId: bitgoWithdrawalWallet.value,
      delegationId: bitgoDelegation.value,
      amountSats: bitgoWithdrawalAmount.value,
    });
    pendingWithdrawalOperationId = result.operationId;
    document.querySelector('#bitgoWithdrawalReview').textContent = JSON.stringify(result, null, 2);
    document.querySelector('[data-bitgo-action="send-withdrawal"]').disabled = false;
    setMessage('Withdrawal prepared. Review the recovery outputs and fee before signing.');
  } finally {
    button.disabled = false;
  }
}

async function sendBitGoWithdrawal() {
  if (!pendingWithdrawalOperationId) throw new Error('Prepare a withdrawal before signing');
  const review = JSON.parse(document.querySelector('#bitgoWithdrawalReview').textContent).review;
  if (
    !window.confirm(
      `Submit this post-timelock withdrawal to ${bitgoEnvironment.value}?\n\n${reviewConfirmation(review)}`
    )
  )
    return;
  const walletPassphrase = bitgoWithdrawalPassphrase.value;
  const button = document.querySelector('[data-bitgo-action="send-withdrawal"]');
  button.disabled = true;
  try {
    const result = await post('/api/bitgo/withdrawals/send', {
      ...bitgoRequestBody(),
      operationId: pendingWithdrawalOperationId,
      walletPassphrase,
    });
    document.querySelector('#bitgoWithdrawalReview').textContent = JSON.stringify(result, null, 2);
    pendingWithdrawalOperationId = undefined;
    try {
      await refreshBitGo();
    } catch (error) {
      setMessage(`Withdrawal submitted; wallet refresh failed: ${formatError(error)}`);
    }
    document.querySelector('#bitgoWithdrawalReview').textContent = JSON.stringify(result, null, 2);
    setMessage(`Withdrawal submitted; staking request ${result.requestId} is ${result.status}.`);
  } finally {
    bitgoWithdrawalPassphrase.value = '';
    button.disabled = pendingWithdrawalOperationId === undefined;
  }
}

const bitgoActions = {
  'create-wallet': createBitGoWallet,
  'prepare-deposit': prepareBitGoDeposit,
  'send-deposit': sendBitGoDeposit,
  'prepare-withdrawal': prepareBitGoWithdrawal,
  'send-withdrawal': sendBitGoWithdrawal,
};

async function refresh(page = currentPage()) {
  setPage(page);
  if (page === 'nodes') return refreshNodes();
  if (page === 'wallets') return refreshWallets();
  if (page === 'bitgo-api') return refreshBitGo();
  return refreshStakedFunds();
}

async function action(name) {
  setMessage(`${name} in progress...`);
  const value = await post(`/api/actions/${name}`);
  setMessage(value.message);
  await refresh(currentPage());
}

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => action(button.dataset.action).catch(showError));
});
document.querySelectorAll('[data-refresh]').forEach((button) => {
  button.addEventListener('click', () => refresh(button.dataset.refresh).catch(showError));
});
document.querySelectorAll('[data-bitgo-action]').forEach((button) => {
  button.addEventListener('click', () => bitgoActions[button.dataset.bitgoAction]().catch(showError));
});
window.addEventListener('hashchange', () => refresh().catch(showError));
network.addEventListener('change', () => refresh().catch(showError));
fullnodeMode.addEventListener('change', () => refresh().catch(showError));
signerManager.addEventListener('input', () => {
  signerManager.dataset.edited = 'true';
});
network.addEventListener('change', () => {
  if (signerManager.dataset.edited === 'true') return;
  signerManager.value = network.value === 'tbtcstxprivate1' ? privateSignerManager : '';
});
bitgoEnvironment.addEventListener('change', () => {
  resetBitGoPreviews();
  if (currentPage() === 'bitgo-api') refresh().catch(showError);
});
bitgoCoin.addEventListener('change', () => {
  resetBitGoPreviews();
  if (currentPage() === 'bitgo-api') refresh().catch(showError);
});
bitgoWithdrawalWallet.addEventListener('change', () => refreshBitGoDelegations().catch(showError));
bitgoDelegation.addEventListener('change', () => {
  bitgoWithdrawalAmount.value = bitgoDelegation.selectedOptions[0]?.dataset.amountSats ?? '';
});
document.querySelector('#bitgoCoin').addEventListener('change', () => {
  const signerManagerInput = document.querySelector('#bitgoSignerManager');
  if (signerManagerInput.dataset.edited !== 'true') {
    signerManagerInput.value = bitgoCoin.value === 'tbtcstxprivate1' ? privateSignerManager : '';
  }
});
seedPhrase.addEventListener('change', () => {
  if (currentPage() === 'wallets') refresh().catch(showError);
});
accountPreset.addEventListener('change', () => {
  seedPhrase.disabled = accountPreset.value !== 'phrase';
  if (currentPage() === 'wallets') refresh().catch(showError);
});
seedPhrase.disabled = accountPreset.value !== 'phrase';
document.querySelector('#bitgoSignerManager').value = bitgoCoin.value === 'tbtcstxprivate1' ? privateSignerManager : '';
document.querySelector('#bitgoSignerManager').addEventListener('input', (event) => {
  event.currentTarget.dataset.edited = 'true';
});
refresh().catch(showError);
clearLogs.addEventListener('click', () => {
  logOutput.textContent = '';
});
pollLogs();
window.setInterval(pollLogs, 750);
