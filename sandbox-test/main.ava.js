import anyTest from 'ava';
import { Worker } from 'near-workspaces';
import { setDefaultResultOrder } from 'dns'; setDefaultResultOrder('ipv4first'); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

test('returns the NFT metadata', async (t) => {
  const { contract } = t.context.accounts;
  const metadata = await contract.view('nft_metadata', {});
  t.is(metadata.spec, 'nft-1.0.0');
  t.is(metadata.name, 'My NFT');
  t.is(metadata.symbol, 'NFT');
});

test('mints and retrieves an NFT', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // Mint a new NFT
  const tokenId = 'token-1';
  await root.call(contract, 'nft_mint', {
    token_id: tokenId,
    receiver_id: root.accountId,
    metadata: {
      title: 'Test NFT',
      description: 'Test NFT Description',
      media: 'https://example.com/nft.png',
      copies: 1
    }
  }, { attachedDeposit: '10000000000000000000000' }); // 0.01 NEAR

  // Retrieve the token
  const token = await contract.view('nft_token', { token_id: tokenId });
  t.is(token.token_id, tokenId);
  t.is(token.owner_id, root.accountId);
  t.is(token.metadata.title, 'Test NFT');
});

test('returns total supply', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // Initially should be 0
  let totalSupply = await contract.view('nft_total_supply', {});
  t.is(totalSupply, '0');
  
  // Mint a token
  await root.call(contract, 'nft_mint', {
    token_id: 'token-2',
    receiver_id: root.accountId,
    metadata: {
      title: 'Test NFT 2',
      description: 'Test NFT Description 2',
      media: 'https://example.com/nft2.png',
      copies: 1
    }
  }, { attachedDeposit: '10000000000000000000000' }); // 0.01 NEAR
  
  // Now should be 1
  totalSupply = await contract.view('nft_total_supply', {});
  t.is(totalSupply, '1');
});

test('transfers an NFT', async (t) => {
  const { root, contract } = t.context.accounts;
  const alice = await root.createSubAccount('alice');
  
  // Mint a token to root
  const tokenId = 'token-3';
  await root.call(contract, 'nft_mint', {
    token_id: tokenId,
    receiver_id: root.accountId,
    metadata: {
      title: 'Transfer Test NFT',
      description: 'NFT for transfer testing',
      media: 'https://example.com/nft3.png'
    }
  }, { attachedDeposit: '10000000000000000000000' }); // 0.01 NEAR
  
  // Transfer to alice
  await root.call(contract, 'nft_transfer', {
    receiver_id: alice.accountId,
    token_id: tokenId,
    memo: 'Transfer to Alice'
  }, { attachedDeposit: '1' }); // 1 yoctoNEAR
  
  // Verify ownership change
  const token = await contract.view('nft_token', { token_id: tokenId });
  t.is(token.owner_id, alice.accountId);
});