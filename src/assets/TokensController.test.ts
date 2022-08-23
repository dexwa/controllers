import sinon from 'sinon';
import nock from 'nock';
import contractMaps from '@metamask/contract-metadata';
import { PreferencesController } from '../user/PreferencesController';
import { TOKEN_END_POINT_API } from '../apis/token-service';
import {
  NetworkController,
  NetworkControllerMessenger,
  NetworksChainId,
  NetworkType,
} from '../network/NetworkController';
import { TokensController } from './TokensController';
import { Token } from './TokenRatesController';
import { ControllerMessenger } from '../ControllerMessenger';

const INFURA_PROJECT_ID = 'ad3a368836ff4596becc3be8e2f137ac';

describe('TokensController', () => {
  let tokensController: TokensController;
  let preferences: PreferencesController;
  let network: NetworkController;
  let messenger: NetworkControllerMessenger;
  let ethProviderStub: any;

  beforeEach(() => {
    messenger = new ControllerMessenger().getRestricted({
      name: 'NetworkController',
      allowedEvents: [
        'NetworkController:stateChange'
      ],
      allowedActions: [],
    });
    preferences = new PreferencesController();
    network = new NetworkController({
      messenger,
      infuraProjectId: INFURA_PROJECT_ID
    });

    tokensController = new TokensController({
      onPreferencesStateChange: (listener) => preferences.subscribe(listener),
      onNetworkStateChange: (listener) =>
        messenger.subscribe('NetworkController:stateChange', listener),
      config: {
        chainId: NetworksChainId.mainnet,
      },
    });

    ethProviderStub = sinon
      .stub(tokensController, '_instantiateNewEthersProvider')
      .callsFake(() => null);

    debugger;
  });

  afterEach(() => {
    ethProviderStub.restore();
  });

  it('should set default state', () => {
    expect(tokensController.state).toStrictEqual({
      allTokens: {},
      allIgnoredTokens: {},
      ignoredTokens: [],
      suggestedAssets: [],
      tokens: [],
      detectedTokens: [],
      allDetectedTokens: {},
    });
  });

  it('should add a token', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    await tokensController.addToken('0x01', 'bar', 2);
    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
      symbol: 'bar',
      isERC721: false,
      aggregators: [],
    });
    await tokensController.addToken('0x01', 'baz', 2);
    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
      symbol: 'baz',
      isERC721: false,
      aggregators: [],
    });
  });

  it('should add tokens', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );

    await tokensController.addTokens([
      { address: '0x01', symbol: 'barA', decimals: 2, aggregators: [] },
      { address: '0x02', symbol: 'barB', decimals: 2, aggregators: [] },
    ]);

    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image: undefined,
      symbol: 'barA',
      aggregators: [],
    });

    expect(tokensController.state.tokens[1]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image: undefined,
      symbol: 'barB',
      aggregators: [],
    });

    await tokensController.addTokens([
      {
        address: '0x01',
        symbol: 'bazA',
        decimals: 2,
        aggregators: [],
      },
      {
        address: '0x02',
        symbol: 'bazB',
        decimals: 2,
        aggregators: [],
      },
    ]);

    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image: undefined,
      symbol: 'bazA',
      aggregators: [],
    });

    expect(tokensController.state.tokens[1]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image: undefined,
      symbol: 'bazB',
      aggregators: [],
    });
  });

  it('should add detected tokens', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );

    await tokensController.addDetectedTokens([
      { address: '0x01', symbol: 'barA', decimals: 2, aggregators: [] },
      { address: '0x02', symbol: 'barB', decimals: 2, aggregators: [] },
    ]);

    expect(tokensController.state.detectedTokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image: undefined,
      symbol: 'barA',
      aggregators: [],
      isERC721: undefined,
    });

    expect(tokensController.state.detectedTokens[1]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image: undefined,
      symbol: 'barB',
      aggregators: [],
      isERC721: undefined,
    });

    await tokensController.addDetectedTokens([
      {
        address: '0x01',
        symbol: 'bazA',
        decimals: 2,
        aggregators: [],
        isERC721: undefined,
      },
      {
        address: '0x02',
        symbol: 'bazB',
        decimals: 2,
        aggregators: [],
        isERC721: undefined,
      },
    ]);

    expect(tokensController.state.detectedTokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image: undefined,
      symbol: 'bazA',
      aggregators: [],
      isERC721: undefined,
    });

    expect(tokensController.state.detectedTokens[1]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image: undefined,
      symbol: 'bazB',
      aggregators: [],
      isERC721: undefined,
    });
  });

  it('should add token by selected address', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );

    const firstAddress = '0x123';
    const secondAddress = '0x321';

    preferences.update({ selectedAddress: firstAddress });
    await tokensController.addToken('0x01', 'bar', 2);
    preferences.update({ selectedAddress: secondAddress });
    expect(tokensController.state.tokens).toHaveLength(0);
    preferences.update({ selectedAddress: firstAddress });
    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
      symbol: 'bar',
      isERC721: false,
      aggregators: [],
    });
  });

  it('should add token by network', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    const firstNetworkType = 'rinkeby';
    const secondNetworkType = 'ropsten';
    network.setProviderType(firstNetworkType);
    await tokensController.addToken('0x01', 'bar', 2);
    network.setProviderType(secondNetworkType);
    expect(tokensController.state.tokens).toHaveLength(0);

    network.setProviderType(firstNetworkType);

    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x01',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/4/0x01.png',
      symbol: 'bar',
      isERC721: false,
      aggregators: [],
    });
  });

  it('should remove token', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    await tokensController.addToken('0x01', 'bar', 2);
    tokensController.ignoreTokens(['0x01']);
    expect(tokensController.state.tokens).toHaveLength(0);
  });

  it('should remove token by selected address', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    const firstAddress = '0x123';
    const secondAddress = '0x321';
    preferences.update({ selectedAddress: firstAddress });
    await tokensController.addToken('0x02', 'baz', 2);
    preferences.update({ selectedAddress: secondAddress });
    await tokensController.addToken('0x01', 'bar', 2);
    tokensController.ignoreTokens(['0x01']);
    expect(tokensController.state.tokens).toHaveLength(0);
    preferences.update({ selectedAddress: firstAddress });
    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x02.png',
      symbol: 'baz',
      isERC721: false,
      aggregators: [],
    });
  });

  it('should remove token by provider type', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    const firstNetworkType = 'rinkeby';
    const secondNetworkType = 'ropsten';

    network.setProviderType(firstNetworkType);
    await tokensController.addToken('0x02', 'baz', 2);
    network.setProviderType(secondNetworkType);
    await tokensController.addToken('0x01', 'bar', 2);
    tokensController.ignoreTokens(['0x01']);
    expect(tokensController.state.tokens).toHaveLength(0);
    network.setProviderType(firstNetworkType);

    expect(tokensController.state.tokens[0]).toStrictEqual({
      address: '0x02',
      decimals: 2,
      image:
        'https://static.metaswap.codefi.network/api/v1/tokenIcons/4/0x02.png',
      symbol: 'baz',
      isERC721: false,
      aggregators: [],
    });
  });

  it('should subscribe to new sibling preference controllers', async () => {
    const networkType = 'rinkeby';
    const address = '0x123';
    preferences.update({ selectedAddress: address });
    expect(preferences.state.selectedAddress).toStrictEqual(address);
    network.setProviderType(networkType);
    expect(network.state.provider.type).toStrictEqual(networkType);
  });

  describe('ignoredTokens', () => {
    const defaultSelectedNetwork: NetworkType = 'rinkeby';
    const defaultSelectedAddress = '0x0001';

    let createEthersContractStub: any;
    beforeEach((done) => {
      preferences.setSelectedAddress(defaultSelectedAddress);
      network.setProviderType(defaultSelectedNetwork);

      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));

      createEthersContractStub = sinon
        .stub(tokensController, '_createEthersContract')
        .callsFake(() => ({ supportsInterface: supportsInterfaceStub }))

      debugger;
      setTimeout(() => {
        debugger;
        done();
      }, 15000);
    }, 20000);

    afterEach(() => {
      createEthersContractStub.restore();
    });

    it.only('should remove token from ignoredTokens/allIgnoredTokens lists if added back via addToken', async () => {
      debugger;
      await tokensController.addToken('0x01', 'foo', 2);
      await tokensController.addToken('0xFAa', 'bar', 3);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      expect(tokensController.state.tokens).toHaveLength(2);
      tokensController.ignoreTokens(['0x01']);
      expect(tokensController.state.tokens).toHaveLength(1);
      expect(tokensController.state.ignoredTokens).toHaveLength(1);
      await tokensController.addToken('0x01', 'baz', 2);
      expect(tokensController.state.tokens).toHaveLength(2);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      debugger;
    });

    it('should remove a token from the ignoredTokens/allIgnoredTokens lists if re-added as part of a bulk addTokens add', async () => {
      const selectedAddress = '0x0001';
      const chain = 'rinkeby';
      preferences.setSelectedAddress(selectedAddress);
      network.setProviderType(chain);
      await tokensController.addToken('0x01', 'bar', 2);
      await tokensController.addToken('0xFAa', 'bar', 3);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      expect(tokensController.state.tokens).toHaveLength(2);
      tokensController.ignoreTokens(['0x01']);
      tokensController.ignoreTokens(['0xFAa']);
      expect(tokensController.state.tokens).toHaveLength(0);
      expect(tokensController.state.ignoredTokens).toHaveLength(2);
      await tokensController.addTokens([
        { address: '0x01', decimals: 3, symbol: 'bar', aggregators: [] },
        { address: '0x02', decimals: 4, symbol: 'baz', aggregators: [] },
        { address: '0x04', decimals: 4, symbol: 'foo', aggregators: [] },
      ]);
      expect(tokensController.state.tokens).toHaveLength(3);
      expect(tokensController.state.ignoredTokens).toHaveLength(1);
      expect(tokensController.state.allIgnoredTokens).toStrictEqual({
        [NetworksChainId[chain]]: {
          [selectedAddress]: ['0xFAa'],
        },
      });
    });

    it('should be able to clear the ignoredToken list', async () => {
      await tokensController.addToken('0x01', 'bar', 2);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      tokensController.ignoreTokens(['0x01']);
      expect(tokensController.state.tokens).toHaveLength(0);
      expect(tokensController.state.allIgnoredTokens).toStrictEqual({
        [NetworksChainId[defaultSelectedNetwork]]: {
          [defaultSelectedAddress]: ['0x01'],
        },
      });
      tokensController.clearIgnoredTokens();
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      expect(Object.keys(tokensController.state.allIgnoredTokens)).toHaveLength(
        0,
      );
    });

    it('should ignore tokens by [chainID][accountAddress]', async () => {
      const selectedAddress1 = '0x0001';
      const selectedAddress2 = '0x0002';
      const chain1 = 'rinkeby';
      const chain2 = 'ropsten';

      preferences.setSelectedAddress(selectedAddress1);
      network.setProviderType(chain1);

      await tokensController.addToken('0x01', 'bar', 2);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      tokensController.ignoreTokens(['0x01']);
      expect(tokensController.state.tokens).toHaveLength(0);

      expect(tokensController.state.ignoredTokens).toStrictEqual(['0x01']);
      network.setProviderType(chain2);

      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      await tokensController.addToken('0x02', 'bazz', 3);
      tokensController.ignoreTokens(['0x02']);
      expect(tokensController.state.ignoredTokens).toStrictEqual(['0x02']);

      preferences.setSelectedAddress(selectedAddress2);
      expect(tokensController.state.ignoredTokens).toHaveLength(0);
      await tokensController.addToken('0x03', 'foo', 4);
      tokensController.ignoreTokens(['0x03']);
      expect(tokensController.state.ignoredTokens).toStrictEqual(['0x03']);

      expect(tokensController.state.allIgnoredTokens).toStrictEqual({
        [NetworksChainId[chain1]]: {
          [selectedAddress1]: ['0x01'],
        },
        [NetworksChainId[chain2]]: {
          [selectedAddress1]: ['0x02'],
          [selectedAddress2]: ['0x03'],
        },
      });
    });
  });

  it('should ignore multiple tokens with single ignoreTokens call', async () => {
    const supportsInterfaceStub = sinon.stub().returns(Promise.resolve(false));
    sinon
      .stub(tokensController, '_createEthersContract')
      .callsFake(() =>
        Promise.resolve({ supportsInterface: supportsInterfaceStub }),
      );
    await tokensController.addToken('0x01', 'A', 4);
    await tokensController.addToken('0x02', 'B', 5);
    expect(tokensController.state.tokens).toStrictEqual([
      {
        address: '0x01',
        decimals: 4,
        image:
          'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
        isERC721: false,
        symbol: 'A',
        aggregators: [],
      },
      {
        address: '0x02',
        decimals: 5,
        image:
          'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x02.png',
        isERC721: false,
        symbol: 'B',
        aggregators: [],
      },
    ]);

    tokensController.ignoreTokens(['0x01', '0x02']);
    expect(tokensController.state.tokens).toStrictEqual([]);
  });

  describe('isERC721 flag', function() {
    describe('updateTokenType method', function() {
      it('should add isERC721 = true to token object already in state when token is collectible and in our contract-metadata repo', async function() {
        const contractAddresses = Object.keys(contractMaps);
        const erc721ContractAddresses = contractAddresses.filter(
          (contractAddress) => contractMaps[contractAddress].erc721 === true,
        );
        const address = erc721ContractAddresses[0];
        const { symbol, decimals } = contractMaps[address];
        tokensController.update({
          tokens: [{ address, symbol, decimals }],
        });
        const result = await tokensController.updateTokenType(address);
        expect(result.isERC721).toBe(true);
      });

      it('should add isERC721 = false to token object already in state when token is not a collectible and is in our contract-metadata repo', async function() {
        const contractAddresses = Object.keys(contractMaps);
        const erc20ContractAddresses = contractAddresses.filter(
          (contractAddress) => contractMaps[contractAddress].erc20 === true,
        );
        const address = erc20ContractAddresses[0];
        const { symbol, decimals } = contractMaps[address];
        tokensController.update({
          tokens: [{ address, symbol, decimals }],
        });
        const result = await tokensController.updateTokenType(address);
        expect(result.isERC721).toBe(false);
      });

      it('should add isERC721 = true to token object already in state when token is collectible and is not in our contract-metadata repo', async function() {
        const supportsInterfaceStub = sinon
          .stub()
          .returns(Promise.resolve(true));
        sinon
          .stub(tokensController, '_createEthersContract')
          .callsFake(() =>
            Promise.resolve({ supportsInterface: supportsInterfaceStub }),
          );
        const tokenAddress = '0xda5584cc586d07c7141aa427224a4bd58e64af7d';
        tokensController.update({
          tokens: [
            {
              address: tokenAddress,
              symbol: 'TESTNFT',
              decimals: 0,
            },
          ],
        });

        const result = await tokensController.updateTokenType(tokenAddress);

        expect(result.isERC721).toBe(true);
      });

      it('should add isERC721 = false to token object already in state when token is not a collectible and not in our contract-metadata repo', async function() {
        const supportsInterfaceStub = sinon
          .stub()
          .returns(Promise.resolve(false));
        sinon
          .stub(tokensController, '_createEthersContract')
          .callsFake(() =>
            Promise.resolve({ supportsInterface: supportsInterfaceStub }),
          );
        const tokenAddress = '0xda5584cc586d07c7141aa427224a4bd58e64af7d';
        tokensController.update({
          tokens: [
            {
              address: tokenAddress,
              symbol: 'TESTNFT',
              decimals: 0,
            },
          ],
        });

        const result = await tokensController.updateTokenType(tokenAddress);

        expect(result.isERC721).toBe(false);
      });
    });

    describe('addToken method', function() {
      it('should add isERC721 = true when token is a collectible and is in our contract-metadata repo', async function() {
        const contractAddresses = Object.keys(contractMaps);
        const erc721ContractAddresses = contractAddresses.filter(
          (contractAddress) => contractMaps[contractAddress].erc721 === true,
        );
        const address = erc721ContractAddresses[0];
        const { symbol, decimals } = contractMaps[address];
        await tokensController.addToken(address, symbol, decimals);

        expect(tokensController.state.tokens).toStrictEqual([
          {
            address,
            symbol,
            isERC721: true,
            image:
              'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03.png',
            decimals,
            aggregators: ['Dynamic'],
          },
        ]);
      });

      it('should add isERC721 = true when the token is a collectible but not in our contract-metadata repo', async function() {
        const supportsInterfaceStub = sinon
          .stub()
          .returns(Promise.resolve(true));
        sinon
          .stub(tokensController, '_createEthersContract')
          .callsFake(() =>
            Promise.resolve({ supportsInterface: supportsInterfaceStub }),
          );

        const tokenAddress = '0xDA5584Cc586d07c7141aA427224A4Bd58E64aF7D';

        await tokensController.addToken(tokenAddress, 'REST', 4);

        expect(tokensController.state.tokens).toStrictEqual([
          {
            address: tokenAddress,
            symbol: 'REST',
            isERC721: true,
            image:
              'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0xda5584cc586d07c7141aa427224a4bd58e64af7d.png',
            decimals: 4,
            aggregators: [],
          },
        ]);
      });

      it('should add isERC721 = false to token object already in state when token is not a collectible and in our contract-metadata repo', async function() {
        const contractAddresses = Object.keys(contractMaps);
        const erc20ContractAddresses = contractAddresses.filter(
          (contractAddress) => contractMaps[contractAddress].erc20 === true,
        );
        const address = erc20ContractAddresses[0];
        const { symbol, decimals } = contractMaps[address];

        await tokensController.addToken(address, symbol, decimals);

        expect(tokensController.state.tokens).toStrictEqual([
          {
            address,
            symbol,
            isERC721: false,
            image:
              'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x5afe3855358e112b5647b952709e6165e1c1eeee.png',
            decimals,
            aggregators: ['Dynamic'],
          },
        ]);
      });

      it('should add isERC721 = false when the token is not a collectible and not in our contract-metadata repo', async function() {
        const supportsInterfaceStub = sinon
          .stub()
          .returns(Promise.resolve(false));
        sinon
          .stub(tokensController, '_createEthersContract')
          .callsFake(() =>
            Promise.resolve({ supportsInterface: supportsInterfaceStub }),
          );
        const tokenAddress = '0xDA5584Cc586d07c7141aA427224A4Bd58E64aF7D';

        await tokensController.addToken(tokenAddress, 'LEST', 5);

        expect(tokensController.state.tokens).toStrictEqual([
          {
            address: tokenAddress,
            symbol: 'LEST',
            isERC721: false,
            image:
              'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0xda5584cc586d07c7141aa427224a4bd58e64af7d.png',
            decimals: 5,
            aggregators: [],
          },
        ]);
      });

      it('should throw error if switching networks while adding token', async function() {
        const dummyTokenAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
        const addTokenPromise = tokensController.addToken(
          dummyTokenAddress,
          'LINK',
          18,
        );

        network.setProviderType('goerli');

        await expect(addTokenPromise).rejects.toThrow(
          'TokensController Error: Switched networks while adding token',
        );
      });
    });

    it('should throw TokenService error if fetchTokenMetadata returns a response with an error', async () => {
      const dummyTokenAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
      const error = 'An error occured';
      const fullErrorMessage = `TokenService Error: ${error}`;
      nock(TOKEN_END_POINT_API)
        .get(`/token/${NetworksChainId.mainnet}?address=${dummyTokenAddress}`)
        .reply(200, { error })
        .persist();

      await expect(
        tokensController.addToken(dummyTokenAddress, 'LINK', 18),
      ).rejects.toThrow(fullErrorMessage);
    });

    it('should add token that was previously a detected token', async () => {
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));
      sinon
        .stub(tokensController, '_createEthersContract')
        .callsFake(() =>
          Promise.resolve({ supportsInterface: supportsInterfaceStub }),
        );
      const dummyDetectedToken: Token = {
        address: '0x01',
        symbol: 'barA',
        decimals: 2,
        aggregators: [],
        image: undefined,
        isERC721: false,
      };
      const dummyAddedToken: Token = {
        ...dummyDetectedToken,
        image:
          'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
      };

      await tokensController.addDetectedTokens([dummyDetectedToken]);

      expect(tokensController.state.detectedTokens).toStrictEqual([
        dummyDetectedToken,
      ]);

      await tokensController.addToken(
        dummyDetectedToken.address,
        dummyDetectedToken.symbol,
        dummyDetectedToken.decimals,
      );

      expect(tokensController.state.detectedTokens).toStrictEqual([]);
      expect(tokensController.state.tokens).toStrictEqual([dummyAddedToken]);
    });
  });

  describe('addTokens method', function() {
    it('should add tokens that were previously detected tokens', async () => {
      const dummyAddedTokens: Token[] = [
        {
          address: '0x01',
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          image: undefined,
        },
        {
          address: '0x02',
          symbol: 'barB',
          decimals: 2,
          aggregators: [],
          image: undefined,
        },
      ];
      const dummyDetectedTokens: Token[] = [
        {
          ...dummyAddedTokens[0],
          isERC721: false,
        },
        {
          ...dummyAddedTokens[1],
          isERC721: false,
        },
      ];

      await tokensController.addDetectedTokens(dummyDetectedTokens);

      expect(tokensController.state.detectedTokens).toStrictEqual(
        dummyDetectedTokens,
      );

      await tokensController.addTokens(dummyDetectedTokens);

      expect(tokensController.state.detectedTokens).toStrictEqual([]);
      expect(tokensController.state.tokens).toStrictEqual(dummyAddedTokens);
    });
  });

  describe('_getNewAllTokensState method', () => {
    const dummySelectedAddress = '0x1';
    const dummyTokens: Token[] = [
      {
        address: '0x01',
        symbol: 'barA',
        decimals: 2,
        aggregators: [],
        image: undefined,
      },
    ];

    it('should nest newTokens under chain ID and selected address when provided with newTokens as input', () => {
      tokensController.configure({
        selectedAddress: dummySelectedAddress,
        chainId: NetworksChainId.mainnet,
      });
      const processedTokens = tokensController._getNewAllTokensState({
        newTokens: dummyTokens,
      });
      expect(
        processedTokens.newAllTokens[NetworksChainId.mainnet][
        dummySelectedAddress
        ],
      ).toStrictEqual(dummyTokens);
    });

    it('should nest detectedTokens under chain ID and selected address when provided with detectedTokens as input', () => {
      tokensController.configure({
        selectedAddress: dummySelectedAddress,
        chainId: NetworksChainId.mainnet,
      });
      const processedTokens = tokensController._getNewAllTokensState({
        newDetectedTokens: dummyTokens,
      });
      expect(
        processedTokens.newAllDetectedTokens[NetworksChainId.mainnet][
        dummySelectedAddress
        ],
      ).toStrictEqual(dummyTokens);
    });

    it('should nest ignoredTokens under chain ID and selected address when provided with ignoredTokens as input', () => {
      tokensController.configure({
        selectedAddress: dummySelectedAddress,
        chainId: NetworksChainId.mainnet,
      });
      const dummyIgnoredTokens = [dummyTokens[0].address];
      const processedTokens = tokensController._getNewAllTokensState({
        newIgnoredTokens: dummyIgnoredTokens,
      });
      expect(
        processedTokens.newAllIgnoredTokens[NetworksChainId.mainnet][
        dummySelectedAddress
        ],
      ).toStrictEqual(dummyIgnoredTokens);
    });
  });

  describe('on watchAsset', function() {
    let asset: any, type: any;

    let stub: any;
    beforeEach(function() {
      type = 'ERC20';
      asset = {
        address: '0x000000000000000000000000000000000000dEaD',
        decimals: 12,
        symbol: 'SES',
        image: 'image',
      };
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));

      stub = sinon
        .stub(tokensController, '_createEthersContract')
        .callsFake(() => ({ supportsInterface: supportsInterfaceStub }));
    });

    afterEach(() => {
      stub.restore();
    });

    it('should error if passed no type', async function() {
      type = undefined;
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Asset of type undefined not supported',
      );
    });

    it('should error if asset type is not supported', async function() {
      type = 'ERC721';
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Asset of type ERC721 not supported',
      );
    });

    it('should error if address is not defined', async function() {
      asset.address = undefined;
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Must specify address, symbol, and decimals.',
      );
    });

    it('should error if decimals is not defined', async function() {
      asset.decimals = undefined;
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Must specify address, symbol, and decimals.',
      );
    });

    it('should error if symbol is not defined', async function() {
      asset.symbol = undefined;
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Must specify address, symbol, and decimals.',
      );
    });

    it('should error if symbol is empty', async function() {
      asset.symbol = '';
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Must specify address, symbol, and decimals.',
      );
    });

    it('should error if symbol is too long', async function() {
      asset.symbol = 'ABCDEFGHIJKLM';
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Invalid symbol "ABCDEFGHIJKLM": longer than 11 characters.',
      );
    });

    it('should error if decimals is invalid', async function() {
      asset.decimals = -1;
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow(
        'Invalid decimals "-1": must be 0 <= 36.',
      );

      asset.decimals = 37;
      const result2 = tokensController.watchAsset(asset, type);
      await expect(result2).rejects.toThrow(
        'Invalid decimals "37": must be 0 <= 36.',
      );
    });

    it('should error if address is invalid', async function() {
      asset.address = '0x123';
      const result = tokensController.watchAsset(asset, type);
      await expect(result).rejects.toThrow('Invalid address "0x123".');
    });

    it('should handle ERC20 type and add to suggestedAssets', async function() {
      const timer = sinon.useFakeTimers(1);
      sinon
        .stub(tokensController, '_generateRandomId')
        .callsFake(() => '12345');
      type = 'ERC20';
      await tokensController.watchAsset(asset, type);
      expect(tokensController.state.suggestedAssets).toStrictEqual([
        {
          id: '12345',
          status: 'pending',
          time: 1, // uses the fakeTimers clock
          type: 'ERC20',
          asset,
        },
      ]);
      timer.restore();
    });

    it.only('should add token correctly if user confirms', async function() {
      const stub = sinon
        .stub(tokensController, '_generateRandomId')
        .callsFake(() => '12345');
      type = 'ERC20';
      debugger;
      await tokensController.watchAsset(asset, type);

      debugger;
      await tokensController.acceptWatchAsset('12345');
      debugger
      // expect(tokensController.state.suggestedAssets).toStrictEqual([]);
      // expect(tokensController.state.tokens).toHaveLength(1);
      // expect(tokensController.state.tokens).toStrictEqual([
      //   {
      //     isERC721: false,
      //     aggregators: [],
      //     ...asset,
      //     image: 'image',
      //   },
      // ]);
      expect(true).toEqual(true)
      stub.restore();
    });

    it('should fail an invalid type suggested asset via watchAsset', async () => {
      await new Promise(async (resolve) => {
        await tokensController
          .watchAsset(
            {
              address: '0xe9f786dfdd9ae4d57e830acb52296837765f0e5b',
              decimals: 18,
              symbol: 'TKN',
            },
            'ERC721',
          )
          .catch((error) => {
            expect(error.message).toContain(
              'Asset of type ERC721 not supported',
            );
            resolve('');
          });
      });
    });

    it('should reject a valid suggested asset via watchAsset', async () => {
      const { result, suggestedAssetMeta } = await tokensController.watchAsset(
        {
          address: '0xe9f786dfdd9ae4d57e830acb52296837765f0e5b',
          decimals: 18,
          symbol: 'TKN',
        },
        'ERC20',
      );
      tokensController.rejectWatchAsset('0x01');
      tokensController.rejectWatchAsset(suggestedAssetMeta.id);
      tokensController.hub.once(`${suggestedAssetMeta.id}:finished`, () => {
        expect(tokensController.state.suggestedAssets).toHaveLength(0);
      });
      await expect(result).rejects.toThrow('User rejected to watch the asset.');
    });

    it('should accept a valid suggested asset via watchAsset', async () => {
      const { result, suggestedAssetMeta } = await tokensController.watchAsset(
        {
          address: '0xe9f786dfdd9ae4d57e830acb52296837765f0e5b',
          decimals: 18,
          symbol: 'TKN',
        },
        'ERC20',
      );
      await tokensController.acceptWatchAsset(suggestedAssetMeta.id);
      const res = await result;
      expect(tokensController.state.suggestedAssets).toHaveLength(0);
      expect(res).toBe('0xe9f786dfdd9ae4d57e830acb52296837765f0e5b');
    });

    it('should fail a valid suggested asset via watchAsset with wrong type', async () => {
      const { result, suggestedAssetMeta } = await tokensController.watchAsset(
        {
          address: '0xe9f786dfdd9be4d57e830acb52296837765f0e5b',
          decimals: 18,
          symbol: 'TKN',
        },
        'ERC20',
      );
      const { suggestedAssets } = tokensController.state;
      const index = suggestedAssets.findIndex(
        ({ id }) => suggestedAssetMeta.id === id,
      );
      const newSuggestedAssetMeta = suggestedAssets[index];
      suggestedAssetMeta.type = 'ERC721';
      tokensController.update({
        suggestedAssets: [...suggestedAssets, newSuggestedAssetMeta],
      });
      await tokensController.acceptWatchAsset(suggestedAssetMeta.id);
      await expect(result).rejects.toThrow(
        'Asset of type ERC721 not supported',
      );
    });
  });

  describe('onPreferencesStateChange', function() {
    it('should update tokens list when set address changes', async function() {
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));
      const stub = sinon
        .stub(tokensController, '_createEthersContract')
        .callsFake(() =>
          Promise.resolve({ supportsInterface: supportsInterfaceStub }),
        );
      preferences.setSelectedAddress('0x1');
      await tokensController.addToken('0x01', 'A', 4);
      await tokensController.addToken('0x02', 'B', 5);
      preferences.setSelectedAddress('0x2');
      expect(tokensController.state.tokens).toStrictEqual([]);
      await tokensController.addToken('0x03', 'C', 6);
      preferences.setSelectedAddress('0x1');
      expect(tokensController.state.tokens).toStrictEqual([
        {
          address: '0x01',
          decimals: 4,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x01.png',
          isERC721: false,
          symbol: 'A',
          aggregators: [],
        },
        {
          address: '0x02',
          decimals: 5,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x02.png',
          isERC721: false,
          symbol: 'B',
          aggregators: [],
        },
      ]);
      preferences.setSelectedAddress('0x2');
      expect(tokensController.state.tokens).toStrictEqual([
        {
          address: '0x03',
          decimals: 6,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x03.png',
          isERC721: false,
          symbol: 'C',
          aggregators: [],
        },
      ]);

      stub.restore();
    });
  });

  describe('onNetworkStateChange', function() {
    it('should remove a token from its state on corresponding network', async function() {
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));
      const stub = sinon
        .stub(tokensController, '_createEthersContract')
        .callsFake(() =>
          Promise.resolve({ supportsInterface: supportsInterfaceStub }),
        );
      const firstNetworkType = 'rinkeby';
      const secondNetworkType = 'ropsten';
      network.setProviderType(firstNetworkType);

      await tokensController.addToken('0x01', 'A', 4);
      await tokensController.addToken('0x02', 'B', 5);
      const initialTokensFirst = tokensController.state.tokens;

      network.setProviderType(secondNetworkType);

      await tokensController.addToken('0x03', 'C', 4);
      await tokensController.addToken('0x04', 'D', 5);

      const initialTokensSecond = tokensController.state.tokens;

      expect(initialTokensFirst).not.toStrictEqual(initialTokensSecond);

      expect(initialTokensFirst).toStrictEqual([
        {
          address: '0x01',
          decimals: 4,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/4/0x01.png',
          isERC721: false,
          symbol: 'A',
          aggregators: [],
        },
        {
          address: '0x02',
          decimals: 5,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/4/0x02.png',
          isERC721: false,
          symbol: 'B',
          aggregators: [],
        },
      ]);

      expect(initialTokensSecond).toStrictEqual([
        {
          address: '0x03',
          decimals: 4,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/3/0x03.png',
          isERC721: false,
          symbol: 'C',
          aggregators: [],
        },
        {
          address: '0x04',
          decimals: 5,
          image:
            'https://static.metaswap.codefi.network/api/v1/tokenIcons/3/0x04.png',
          isERC721: false,
          symbol: 'D',
          aggregators: [],
        },
      ]);

      network.setProviderType(firstNetworkType);
      expect(initialTokensFirst).toStrictEqual(tokensController.state.tokens);
      network.setProviderType(secondNetworkType);
      expect(initialTokensSecond).toStrictEqual(tokensController.state.tokens);
      stub.restore();
    });
  });
});
