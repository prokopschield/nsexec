import { blake2sHex } from 'blakets';
import connect from 'nodesite.eu-core';
import type { Socket } from 'socket.io-client';

const socket = connect();

export interface DirMap {
	[filename: string]: string | DirMap;
}

export class nsblob {
	public static cache = new Map<string, Buffer>();
	public static cache_keys = Array<string>();
	public static cache_get(hash: string): Buffer | undefined {
		const obj = nsblob.cache.get(hash);
		if (!obj) return;
		nsblob.cache_keys.push(hash);
		return obj;
	}
	public static cache_put(
		hash: string,
		obj: Buffer,
		low_priority: boolean = false
	) {
		cache_size.set(nsblob.cache, nsblob.cache_size + obj.length);
		nsblob.cache.set(hash, obj);
		low_priority
			? nsblob.cache_keys.unshift(hash)
			: nsblob.cache_keys.push(hash);
	}
	public static get cache_size(): number {
		return cache_size.get(nsblob.cache) || 0;
	}
	public static hashmap = new Map<string, string>();

	public static promise_map = new Map<string, Promise<string>>();

	public static async store(
		data: Buffer | string,
		file?: string
	): Promise<string> {
		data ||= '';

		const blake = blake2sHex(data);

		const prehash = nsblob.hashmap.get(blake);
		if (prehash) return prehash;

		const prepromise = nsblob.promise_map.get(blake);
		if (prepromise) {
			return await prepromise;
		}

		const promise = new Promise<string>((resolve, reject) => {
			socket.emit('blake2hash', blake).once(blake, (hash?: string) => {
				if (hash) {
					nsblob.hashmap.set(blake, hash);
					return resolve(hash);
				} else {
					const ref = `b_${blake}`;
					socket
						.emit('blob2hash', ref, data)
						.once(ref, (hash: string) => {
							socket
								.emit('hash2blake', hash)
								.once(hash, (newblake: string) => {
									if (blake === newblake) {
										nsblob.hashmap.set(blake, hash);
										return resolve(hash);
									} else {
										return reject(
											`nsblob: checksum mismatch`
										);
									}
								});
						});
				}
			});
		});

		nsblob.promise_map.set(blake, promise);
		return promise;
	}
	public static async fetch(desc: string): Promise<Buffer> {
		const from_cache = nsblob.cache_get(desc);
		if (from_cache) {
			return Buffer.from(from_cache);
		}
		return new Promise((resolve) => {
			socket.emit('request_blob', desc);
			socket.once(desc, (blob: Buffer) => {
				nsblob.cache_put(desc, Buffer.from(blob));
				return resolve(Buffer.from(blob));
			});
		});
	}
	public static get socket(): Socket {
		return socket;
	}
}

const cache_size = new WeakMap<typeof nsblob.cache, number>([
	[nsblob.cache, 0],
]);

export default nsblob;
module.exports = nsblob;

Object.assign(nsblob, {
	default: nsblob,
	nsblob,
});
