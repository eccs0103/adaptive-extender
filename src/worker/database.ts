"use strict";

import "../core/index.js";
import { type PortableConstructor } from "../core/index.js";
import "./promise.js";

//#region Record store
/**
 * Asynchronous keyed collection backed by an object store of an IndexedDB database.
 * Values are kept by structured clone, so plain objects, dates, binary data, blobs and files are stored as they are.
 * The connection opens on first use, a missing store is created, and the connection steps aside when another context upgrades the database.
 */
export class RecordStore {
	static #attempts: number = 3;
	#factory: IDBFactory;
	#database: string;
	#name: string;
	#connection: Promise<IDBDatabase> | null = null;

	/**
	 * @param factory The IndexedDB factory that opens the database.
	 * @param database The name of the database.
	 * @param name The name of the object store.
	 */
	constructor(factory: IDBFactory, database: string, name: string) {
		this.#factory = factory;
		this.#database = database;
		this.#name = name;
	}

	/**
	 * The name of the database that holds the store.
	 */
	get database(): string { return this.#database; }

	/**
	 * The name of the object store.
	 */
	get name(): string { return this.#name; }

	static async #settle<T>(request: IDBRequest<T>): Promise<T> {
		return await Promise.withSignal<T>((signal, resolve, reject) => {
			request.addEventListener("success", event => resolve(request.result), { signal });
			request.addEventListener("error", event => reject(request.error), { signal });
		});
	}

	static #failure(transaction: IDBTransaction): DOMException {
		const { error } = transaction;
		if (error !== null) return error;
		return new DOMException("The transaction was aborted.", "AbortError");
	}

	static async #commit(transaction: IDBTransaction): Promise<void> {
		await Promise.withSignal((signal, resolve, reject) => {
			transaction.addEventListener("complete", event => resolve(), { signal });
			transaction.addEventListener("abort", event => reject(RecordStore.#failure(transaction)), { signal });
		});
	}

	#begin(version: number | null): IDBOpenDBRequest {
		const factory = this.#factory;
		const database = this.#database;
		if (version === null) return factory.open(database);
		return factory.open(database, version);
	}

	async #request(version: number | null): Promise<IDBDatabase> {
		const name = this.#name;
		const request = this.#begin(version);
		request.addEventListener("upgradeneeded", (event) => {
			const { result } = request;
			if (result.objectStoreNames.contains(name)) return;
			result.createObjectStore(name);
		});
		return await RecordStore.#settle(request);
	}

	#watch(connection: IDBDatabase): IDBDatabase {
		const release = (): void => {
			connection.close();
			this.#connection = null;
		};
		connection.addEventListener("versionchange", release, { once: true });
		connection.addEventListener("close", release, { once: true });
		return connection;
	}

	// A missing store needs a version upgrade; another context may win the same version first, so the upgrade is retried
	async #establish(): Promise<IDBDatabase> {
		const name = this.#name;
		for (let attempt = 1; ; attempt++) {
			const connection = await this.#request(null);
			if (connection.objectStoreNames.contains(name)) return this.#watch(connection);
			const { version } = connection;
			connection.close();
			try {
				return this.#watch(await this.#request(version + 1));
			} catch (reason) {
				if (!(reason instanceof DOMException) || reason.name !== "VersionError" || attempt >= RecordStore.#attempts) throw reason;
			}
		}
	}

	async #connect(): Promise<IDBDatabase> {
		const connection = this.#connection;
		if (connection !== null) return await connection;
		const pending = this.#establish();
		this.#connection = pending;
		try {
			return await pending;
		} catch (reason) {
			this.#connection = null;
			throw reason;
		}
	}

	async #open(mode: IDBTransactionMode): Promise<IDBObjectStore> {
		const name = this.#name;
		const connection = await this.#connect();
		try {
			return connection.transaction(name, mode).objectStore(name);
		} catch (reason) {
			if (!(reason instanceof DOMException) || reason.name !== "InvalidStateError") throw reason;
			this.#connection = null;
			const connection2 = await this.#connect();
			return connection2.transaction(name, mode).objectStore(name);
		}
	}

	/**
	 * Reads the value stored under the key.
	 * @param key The key of the record.
	 * @returns The stored value, or `null` when no record exists under the key.
	 */
	async get(key: IDBValidKey): Promise<unknown | null> {
		const store = await this.#open("readonly");
		const value = await RecordStore.#settle(store.get(key));
		if (value === undefined) return null;
		return value;
	}

	/**
	 * Checks whether a record exists under the key, which tells a stored `null` apart from a missing record.
	 * @param key The key of the record.
	 */
	async has(key: IDBValidKey): Promise<boolean> {
		const store = await this.#open("readonly");
		return await RecordStore.#settle(store.count(key)) > 0;
	}

	/**
	 * Reads every key of the store in key order.
	 */
	async keys(): Promise<IDBValidKey[]> {
		const store = await this.#open("readonly");
		return await RecordStore.#settle(store.getAllKeys());
	}

	/**
	 * Reads every value of the store in key order.
	 */
	async values(): Promise<unknown[]> {
		const store = await this.#open("readonly");
		return await RecordStore.#settle(store.getAll());
	}

	/**
	 * Reads every record of the store in key order, keys and values from one transaction.
	 */
	async entries(): Promise<Map<IDBValidKey, unknown>> {
		const store = await this.#open("readonly");
		const [keys, values] = await Promise.all([RecordStore.#settle(store.getAllKeys()), RecordStore.#settle(store.getAll())]);
		return new Map(keys.map((key, index) => [key, values[index]]));
	}

	/**
	 * Counts the records of the store.
	 */
	async count(): Promise<number> {
		const store = await this.#open("readonly");
		return await RecordStore.#settle(store.count());
	}

	/**
	 * Writes the value under the key, replacing any existing record.
	 * Resolves once the write is committed, and rejects when it is not, for example when the storage quota is exceeded.
	 * @param key The key of the record.
	 * @param value The value to store, which must be structured-cloneable.
	 */
	async set(key: IDBValidKey, value: unknown): Promise<void> {
		const store = await this.#open("readwrite");
		store.put(value, key);
		await RecordStore.#commit(store.transaction);
	}

	/**
	 * Writes every record in one transaction: either all of them are committed or none is.
	 * @param entries The records to store, by key.
	 */
	async setAll(entries: ReadonlyMap<IDBValidKey, unknown>): Promise<void> {
		const store = await this.#open("readwrite");
		const { transaction } = store;
		try {
			for (const [key, value] of entries) {
				store.put(value, key);
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		await RecordStore.#commit(transaction);
	}

	/**
	 * Removes the record under the key, if any.
	 * @param key The key of the record.
	 */
	async delete(key: IDBValidKey): Promise<void> {
		const store = await this.#open("readwrite");
		store.delete(key);
		await RecordStore.#commit(store.transaction);
	}

	/**
	 * Removes every listed record in one transaction.
	 * @param keys The keys of the records.
	 */
	async deleteAll(keys: Iterable<IDBValidKey>): Promise<void> {
		const store = await this.#open("readwrite");
		const { transaction } = store;
		try {
			for (const key of keys) {
				store.delete(key);
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		await RecordStore.#commit(transaction);
	}

	/**
	 * Removes every record of the store.
	 */
	async clear(): Promise<void> {
		const store = await this.#open("readwrite");
		store.clear();
		await RecordStore.#commit(store.transaction);
	}
}
//#endregion
//#region Portable store
/**
 * Asynchronous keyed collection of model instances, stored through the model's import and export.
 */
export class PortableStore<M extends PortableConstructor<InstanceType<M>>> {
	#store: RecordStore;
	#model: M;

	/**
	 * @param store The raw store that holds the exported records.
	 * @param model Constructor with import/export capabilities.
	 */
	constructor(store: RecordStore, model: M) {
		this.#store = store;
		this.#model = model;
	}

	/**
	 * The name of the database that holds the store.
	 */
	get database(): string { return this.#store.database; }

	/**
	 * The name of the object store.
	 */
	get name(): string { return this.#store.name; }

	#restore(value: unknown): InstanceType<M> {
		const { database, name } = this.#store;
		try {
			return this.#model.import(value, `${database}/${name}`);
		} catch (reason) {
			if (!(reason instanceof TypeError)) throw reason;
			throw new SyntaxError(`PortableStore [${database}/${name}]: Content restoration failed.`, { cause: reason });
		}
	}

	/**
	 * Reads and restores the instance stored under the key.
	 * @param key The key of the record.
	 * @returns The restored instance, or `null` when no record exists under the key.
	 * @throws {SyntaxError} If the record is incompatible with the model.
	 */
	async get(key: IDBValidKey): Promise<InstanceType<M> | null> {
		const value = await this.#store.get(key);
		if (value === null) return null;
		return this.#restore(value);
	}

	/**
	 * Checks whether a record exists under the key.
	 * @param key The key of the record.
	 */
	async has(key: IDBValidKey): Promise<boolean> {
		return await this.#store.has(key);
	}

	/**
	 * Reads every key of the store in key order.
	 */
	async keys(): Promise<IDBValidKey[]> {
		return await this.#store.keys();
	}

	/**
	 * Reads and restores every instance of the store in key order.
	 * @throws {SyntaxError} If a record is incompatible with the model.
	 */
	async values(): Promise<InstanceType<M>[]> {
		const values = await this.#store.values();
		return values.map(value => this.#restore(value));
	}

	/**
	 * Reads and restores every record of the store in key order.
	 * @throws {SyntaxError} If a record is incompatible with the model.
	 */
	async entries(): Promise<Map<IDBValidKey, InstanceType<M>>> {
		const entries = await this.#store.entries();
		return new Map(Array.from(entries, ([key, value]) => [key, this.#restore(value)]));
	}

	/**
	 * Counts the records of the store.
	 */
	async count(): Promise<number> {
		return await this.#store.count();
	}

	/**
	 * Exports the instance and writes it under the key, replacing any existing record.
	 * @param key The key of the record.
	 * @param instance The model instance to store.
	 */
	async set(key: IDBValidKey, instance: InstanceType<M>): Promise<void> {
		await this.#store.set(key, this.#model.export(instance));
	}

	/**
	 * Exports and writes every instance in one transaction: either all of them are committed or none is.
	 * @param entries The instances to store, by key.
	 */
	async setAll(entries: ReadonlyMap<IDBValidKey, InstanceType<M>>): Promise<void> {
		const model = this.#model;
		await this.#store.setAll(new Map(Array.from(entries, ([key, instance]) => [key, model.export(instance)])));
	}

	/**
	 * Removes the record under the key, if any.
	 * @param key The key of the record.
	 */
	async delete(key: IDBValidKey): Promise<void> {
		await this.#store.delete(key);
	}

	/**
	 * Removes every listed record in one transaction.
	 * @param keys The keys of the records.
	 */
	async deleteAll(keys: Iterable<IDBValidKey>): Promise<void> {
		await this.#store.deleteAll(keys);
	}

	/**
	 * Removes every record of the store.
	 */
	async clear(): Promise<void> {
		await this.#store.clear();
	}
}
//#endregion
//#region IndexedDB
declare global {
	interface IDBFactory {
		/**
		 * Opens a raw keyed store in a database of this factory, creating the database and the store on first use.
		 * @param database The name of the database.
		 * @param store The name of the object store.
		 */
		openStore(database: string, store: string): RecordStore;
		/**
		 * Opens a model-bound keyed store in a database of this factory, creating the database and the store on first use.
		 * @param database The name of the database.
		 * @param store The name of the object store.
		 * @param model Constructor with import/export capabilities.
		 */
		openPortableStore<M extends PortableConstructor<InstanceType<M>>>(database: string, store: string, model: M): PortableStore<M>;
	}
}

IDBFactory.prototype.openStore = function (database: string, store: string): RecordStore {
	return new RecordStore(this, database, store);
};

IDBFactory.prototype.openPortableStore = function <M extends PortableConstructor<InstanceType<M>>>(database: string, store: string, model: M): PortableStore<M> {
	return new PortableStore(new RecordStore(this, database, store), model);
};
//#endregion
