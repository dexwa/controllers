import * as util from '../src/util';
import { mock } from 'fetch-mock';

const { BN } = require('ethereumjs-util');
const SOME_API = 'https://someapi.com';

describe('util', () => {
	it('BNToHex', () => {
		expect(util.BNToHex(new BN('1337'))).toBe('0x539');
	});

	it('fractionBN', () => {
		expect(util.fractionBN(new BN('1337'), 9, 10).toNumber()).toBe(1203);
	});

	it('getBuyURL', () => {
		/* tslint:disable:max-line-length */
		expect(util.getBuyURL(undefined, 'foo', 1337)).toBe(
			'https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=1337&address=foo&crypto_currency=ETH'
		);
		expect(util.getBuyURL('1', 'foo', 1337)).toBe(
			'https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=1337&address=foo&crypto_currency=ETH'
		);
		expect(util.getBuyURL('3')).toBe('https://faucet.metamask.io/');
		expect(util.getBuyURL('4')).toBe('https://www.rinkeby.io/');
		expect(util.getBuyURL('5')).toBe('https://goerli-faucet.slock.it/');
		expect(util.getBuyURL('42')).toBe('https://github.com/kovan-testnet/faucet');
	});

	it('hexToBN', () => {
		expect(util.hexToBN('0x1337').toNumber()).toBe(4919);
	});

	it('normalizeTransaction', () => {
		const normalized = util.normalizeTransaction({
			data: 'data',
			from: 'FROM',
			gas: 'gas',
			gasPrice: 'gasPrice',
			nonce: 'nonce',
			to: 'TO',
			value: 'value'
		});
		expect(normalized).toEqual({
			data: '0xdata',
			from: '0xfrom',
			gas: '0xgas',
			gasPrice: '0xgasPrice',
			nonce: '0xnonce',
			to: '0xto',
			value: '0xvalue'
		});
	});

	describe('safelyExecute', () => {
		it('should swallow errors', async () => {
			await util.safelyExecute(() => {
				throw new Error('ahh');
			});
		});

		it('should call retry function', () => {
			return new Promise((resolve) => {
				util.safelyExecute(
					() => {
						throw new Error('ahh');
					},
					false,
					resolve
				);
			});
		});
	});

	describe('validateTransaction', () => {
		it('should throw if no from address', () => {
			expect(() => util.validateTransaction({} as any)).toThrow();
		});

		it('should throw if non-string from address', () => {
			expect(() => util.validateTransaction({ from: 1337 } as any)).toThrow();
		});

		it('should throw if invalid from address', () => {
			expect(() => util.validateTransaction({ from: '1337' } as any)).toThrow();
		});

		it('should throw if no data', () => {
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x'
				} as any)
			).toThrow();
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow();
		});

		it('should delete data', () => {
			const transaction = {
				data: 'foo',
				from: '0x3244e191f1b4903970224322180f1fbbc415696b',
				to: '0x'
			};
			util.validateTransaction(transaction);
			expect(transaction.to).toBe(undefined);
		});

		it('should throw if invalid to address', () => {
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '1337'
				} as any)
			).toThrow();
		});

		it('should throw if value is invalid', () => {
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x3244e191f1b4903970224322180f1fbbc415696b',
					value: '133-7'
				} as any)
			).toThrow();
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x3244e191f1b4903970224322180f1fbbc415696b',
					value: '133.7'
				} as any)
			).toThrow();
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x3244e191f1b4903970224322180f1fbbc415696b',
					value: 'hello'
				} as any)
			).toThrow();
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x3244e191f1b4903970224322180f1fbbc415696b',
					value: 'one million dollar$'
				} as any)
			).toThrow();
			expect(() =>
				util.validateTransaction({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b',
					to: '0x3244e191f1b4903970224322180f1fbbc415696b',
					value: '1'
				} as any)
			).not.toThrow();
		});
	});

	it('normalizeMessageData', () => {
		const firstNormalized = util.normalizeMessageData(
			'879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
		);
		const secondNormalized = util.normalizeMessageData('somedata');
		expect(firstNormalized).toEqual('0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0');
		expect(secondNormalized).toEqual('0x736f6d6564617461');
	});

	it('messageHexToString', () => {
		const str = util.hexToText('68656c6c6f207468657265');
		expect(str).toEqual('hello there');
	});

	describe('validatePersonalSignMessageData', () => {
		it('should throw if no from address', () => {
			expect(() =>
				util.validatePersonalSignMessageData({
					data: '0x879a05'
				} as any)
			).toThrow();
		});

		it('should throw if invalid from address', () => {
			expect(() =>
				util.validatePersonalSignMessageData({
					data: '0x879a05',
					from: '3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow();
		});

		it('should throw if invalid type from address', () => {
			expect(() =>
				util.validatePersonalSignMessageData({
					data: '0x879a05',
					from: 123
				} as any)
			).toThrow();
		});

		it('should throw if no data', () => {
			expect(() =>
				util.validatePersonalSignMessageData({
					data: '0x879a05'
				} as any)
			).toThrow();
		});

		it('should throw if invalid tyoe data', () => {
			expect(() =>
				util.validatePersonalSignMessageData({
					data: 123,
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow();
		});
	});

	describe('validateTypedMessageDataV1', () => {
		it('should throw if no from address legacy', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: []
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if invalid from address', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: [],
					from: '3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if invalid type from address', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: [],
					from: 123
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if incorrect data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: '0x879a05',
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid message "data":');
		});

		it('should throw if no data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: '0x879a05',
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid message "data":');
		});

		it('should throw if invalid type data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV1({
					data: [],
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Expected EIP712 typed data.');
		});
	});

	describe('validateTypedMessageDataV3', () => {
		const dataTyped =
			'{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Person":[{"name":"name","type":"string"},{"name":"wallet","type":"address"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person"},{"name":"contents","type":"string"}]},"primaryType":"Mail","domain":{"name":"Ether Mail","version":"1","chainId":1,"verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},"message":{"from":{"name":"Cow","wallet":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},"to":{"name":"Bob","wallet":"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},"contents":"Hello, Bob!"}}';
		it('should throw if no from address', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: '0x879a05'
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if invalid from address', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: '0x879a05',
					from: '3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if invalid type from address', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: '0x879a05',
					from: 123
				} as any)
			).toThrow('Invalid "from" address:');
		});

		it('should throw if array data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: [],
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid message "data":');
		});

		it('should throw if no array data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Invalid message "data":');
		});

		it('should throw if no json valid data', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: 'uh oh',
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Data must be passed as a valid JSON string.');
		});

		it('should throw if data not in typed message schema', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: '{"greetings":"I am Alice"}',
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).toThrow('Data must conform to EIP-712 schema.');
		});

		it('should not throw if data is correct', () => {
			expect(() =>
				util.validateTypedSignMessageDataV3({
					data: dataTyped,
					from: '0x3244e191f1b4903970224322180f1fbbc415696b'
				} as any)
			).not.toThrow();
		});

		it('should not throw if data is correct', () => {
			const toSmartContract1 = util.isSmartContractCode('');
			const toSmartContract2 = util.isSmartContractCode('0x');
			const toSmartContract3 = util.isSmartContractCode('0x0');
			const toSmartContract4 = util.isSmartContractCode('0x01234');
			expect(toSmartContract1).toBe(false);
			expect(toSmartContract2).toBe(false);
			expect(toSmartContract3).toBe(false);
			expect(toSmartContract4).toBe(true);
		});
	});

	describe('validateTokenToWatch', () => {
		it('should throw if undefined token atrributes', () => {
			expect(() =>
				util.validateTokenToWatch({
					address: undefined,
					decimals: 0,
					symbol: 'TKN'
				} as any)
			).toThrow('Cannot suggest token without address, symbol, and decimals');
			expect(() =>
				util.validateTokenToWatch({
					address: '0x1',
					decimals: 0,
					symbol: undefined
				} as any)
			).toThrow('Cannot suggest token without address, symbol, and decimals');
			expect(() =>
				util.validateTokenToWatch({
					address: '0x1',
					decimals: undefined,
					symbol: 'TKN'
				} as any)
			).toThrow('Cannot suggest token without address, symbol, and decimals');
		});

		it('should throw if symbol is more than 6 characters long', () => {
			expect(() =>
				util.validateTokenToWatch({
					address: '0xe9f786dfdd9be4d57e830acb52296837765f0e5b',
					decimals: 0,
					symbol: 'TKNTKNTKN'
				} as any)
			).toThrow('Invalid symbol TKNTKNTKN more than six characters');
		});

		it('should throw if invalid decimals', () => {
			expect(() =>
				util.validateTokenToWatch({
					address: '0xe9f786dfdd9be4d57e830acb52296837765f0e5b',
					decimals: 0,
					symbol: 'TKN'
				} as any)
			).not.toThrow();
			expect(() =>
				util.validateTokenToWatch({
					address: '0xe9f786dfdd9be4d57e830acb52296837765f0e5b',
					decimals: 38,
					symbol: 'TKN'
				} as any)
			).toThrow('Invalid decimals 38 must be at least 0, and not over 36');
			expect(() =>
				util.validateTokenToWatch({
					address: '0xe9f786dfdd9be4d57e830acb52296837765f0e5b',
					decimals: -1,
					symbol: 'TKN'
				} as any)
			).toThrow('Invalid decimals -1 must be at least 0, and not over 36');
		});

		it('should throw if invalid address', () => {
			expect(() =>
				util.validateTokenToWatch({
					address: '0xe9',
					decimals: 0,
					symbol: 'TKN'
				} as any)
			).toThrow('Invalid address 0xe9');
		});
	});

	describe('timeoutFetch', () => {
		const delay = (time: number) => {
			return new Promise((resolve) => {
				setTimeout(resolve, time);
			});
		};
		mock(SOME_API, () => {
			return delay(300).then(() => {
				return JSON.stringify({});
			});
		});

		it('should fetch first if response is faster than timeout', async () => {
			const res = await util.timeoutFetch(SOME_API);
			const parsed = await res.json();
			expect(parsed).toEqual({});
		});

		it('should fetch first if response is faster than timeout', async () => {
			let error;
			try {
				await util.timeoutFetch(SOME_API, {}, 100);
			} catch (e) {
				error = e;
			}
			expect(error.message).toBe('timeout');
		});
	});
});
