"use strict";

import "../core/index.js";
import { type PortableConstructor, type KeysOf } from "../core/index.js";
import "./promise.js";

//#region Connection
class Connection {
	static #attempts: number = 3;
	#factory: IDBFactory;
	#database: string;
	#store: string;
	#path: string;
	#connection: Promise<IDBDatabase> | null = null;

	constructor(factory: IDBFactory, database: string, store: string) {
		this.#factory = factory;
		this.#database = database;
		this.#store = store;
		this.#path = `${database}/${store}`;
	}

	get path(): string { return this.#path; }

	static async settle<T>(request: IDBRequest<T>): Promise<T> {
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

	static async commit(transaction: IDBTransaction): Promise<void> {
		await Promise.withSignal((signal, resolve, reject) => {
			transaction.addEventListener("complete", event => resolve(), { signal });
			transaction.addEventListener("abort", event => reject(Connection.#failure(transaction)), { signal });
		});
	}

	async #upgrade(request: IDBOpenDBRequest): Promise<IDBDatabase> {
		const store = this.#store;
		request.addEventListener("upgradeneeded", (event) => {
			const { result } = request;
			if (result.objectStoreNames.contains(store)) return;
			result.createObjectStore(store);
		});
		return await Connection.settle(request);
	}

	#release(connection: IDBDatabase): void {
		connection.close();
		this.#connection = null;
	}

	#watch(connection: IDBDatabase): IDBDatabase {
		const release = this.#release.bind(this, connection);
		connection.addEventListener("versionchange", release, { once: true });
		connection.addEventListener("close", release, { once: true });
		return connection;
	}

	// A missing store needs a version upgrade; another context may win the same version first, so the upgrade is retried
	async #establish(): Promise<IDBDatabase> {
		const factory = this.#factory;
		const database = this.#database;
		const store = this.#store;
		for (let attempt = 1; ; attempt++) {
			const connection = await this.#upgrade(factory.open(database));
			if (connection.objectStoreNames.contains(store)) return this.#watch(connection);
			const { version } = connection;
			connection.close();
			try {
				return this.#watch(await this.#upgrade(factory.open(database, version + 1)));
			} catch (reason) {
				if (!(reason instanceof DOMException) || reason.name !== "VersionError" || attempt >= Connection.#attempts) throw reason;
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

	#inspect(store: IDBObjectStore): IDBObjectStore {
		if (store.keyPath === null && !store.autoIncrement) return store;
		throw new TypeError(`Store [${this.#path}]: The store uses in-line or generated keys.`);
	}

	async open(mode: IDBTransactionMode): Promise<IDBObjectStore> {
		const store = this.#store;
		const connection = await this.#connect();
		try {
			return this.#inspect(connection.transaction(store, mode).objectStore(store));
		} catch (reason) {
			if (!(reason instanceof DOMException) || (reason.name !== "InvalidStateError" && reason.name !== "NotFoundError")) throw reason;
			this.#release(connection);
			const connection2 = await this.#connect();
			return this.#inspect(connection2.transaction(store, mode).objectStore(store));
		}
	}
}
//#endregion
//#region Records
class Records {
	#connection: Connection;

	constructor(connection: Connection) {
		this.#connection = connection;
	}

	get path(): string { return this.#connection.path; }

	static isList(value: unknown): value is Iterable<unknown> {
		if (typeof value !== "object" || value === null || value instanceof Date) return false;
		return Symbol.iterator in value;
	}

	static isKey(value: unknown): value is IDBValidKey {
		if (typeof value === "string") return true;
		if (typeof value === "number") return Number.isFinite(value);
		return value instanceof Date && !Number.isNaN(value.getTime());
	}

	validate(value: unknown): IDBValidKey {
		if (Records.isKey(value)) return value;
		throw new TypeError(`Store [${this.#connection.path}]: Key ${String(value)} must be a string, a finite number or a valid date.`);
	}

	async get(key: IDBValidKey): Promise<unknown> {
		const store = await this.#connection.open("readonly");
		const value = await Connection.settle(store.get(key));
		if (value === undefined) return null;
		return value;
	}

	async values(): Promise<unknown[]> {
		const store = await this.#connection.open("readonly");
		return await Connection.settle(store.getAll());
	}

	async entries(): Promise<IteratorObject<readonly [IDBValidKey, unknown], void>> {
		const store = await this.#connection.open("readonly");
		const [keys, values] = await Promise.all([Connection.settle(store.getAllKeys()), Connection.settle(store.getAll())]);
		return Iterator.zip(keys, values);
	}

	async insert(entries: Iterable<readonly [IDBValidKey, unknown]>): Promise<void> {
		const store = await this.#connection.open("readwrite");
		const { transaction } = store;
		try {
			for (const [key, value] of entries) {
				store.add(value, key);
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		await Connection.commit(transaction);
	}

	async update(entries: Iterable<readonly [IDBValidKey, unknown]>): Promise<void> {
		const store = await this.#connection.open("readwrite");
		const { transaction } = store;
		const missing: IDBValidKey[] = [];
		try {
			for (const [key, value] of entries) {
				const request = store.count(key);
				request.addEventListener("success", (event) => {
					if (request.result > 0) {
						store.put(value, key);
						return;
					}
					missing.push(key);
					transaction.abort();
				});
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		try {
			await Connection.commit(transaction);
		} catch (reason) {
			if (missing.length === 0) throw reason;
			throw new ReferenceError(`Store [${this.path}]: Record ${String(missing[0])} not found.`, { cause: reason });
		}
	}

	async delete(keys: Iterable<IDBValidKey>): Promise<void> {
		const store = await this.#connection.open("readwrite");
		const { transaction } = store;
		try {
			for (const key of keys) {
				store.delete(key);
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		await Connection.commit(transaction);
	}

	async count(): Promise<number> {
		const store = await this.#connection.open("readonly");
		return await Connection.settle(store.count());
	}
}
//#endregion
//#region Store
/**
 * An IndexedDB object store of raw values under keys of type `K`, opened through {@link IDBFactory.openStore}.
 * Values are kept by structured clone, so plain objects, dates, binary data, blobs and files are stored as they are.
 * The connection opens on first use, a missing store is created, and the connection steps aside when another context upgrades the database.
 */
export interface Store<K = string> {
	/**
	 * Reads every record of the store in key order, as `[key, value]` pairs.
	 * Keys are trusted to be of type `K`; records under keys that are not strings, finite numbers or valid dates are not listed.
	 */
	select(): Promise<(readonly [K, unknown])[]>;
	/**
	 * Reads the value under the key.
	 * @param key The key of the record.
	 * @returns The value, or `null` when the store has no record under the key.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 */
	select(key: K): Promise<unknown>;
	/**
	 * Adds a new record.
	 * Rejects with a `ConstraintError` when a record under the key exists.
	 * @param key The key of the record.
	 * @param value The value to store, which must be structured-cloneable.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 */
	insert(key: K, value: unknown): Promise<void>;
	/**
	 * Adds new records in one transaction: either all of them are added or none is.
	 * Rejects with a `ConstraintError` when a record under one of the keys exists.
	 * @param entries The records to add, as `[key, value]` pairs.
	 * @throws {TypeError} If a key is not a string, a finite number or a valid date.
	 */
	insert(entries: Iterable<readonly [K, unknown]>): Promise<void>;
	/**
	 * Replaces the value of the existing record under the key.
	 * @param key The key of the record.
	 * @param value The new value, which must be structured-cloneable.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 * @throws {ReferenceError} If the store has no record under the key.
	 */
	update(key: K, value: unknown): Promise<void>;
	/**
	 * Replaces existing records in one transaction: either all of them are replaced or none is.
	 * @param entries The new values, as `[key, value]` pairs.
	 * @throws {TypeError} If a key is not a string, a finite number or a valid date.
	 * @throws {ReferenceError} If the store has no record under one of the keys.
	 */
	update(entries: Iterable<readonly [K, unknown]>): Promise<void>;
	/**
	 * Removes the record under the key, if any.
	 * @param key The key of the record.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 */
	delete(key: K): Promise<void>;
	/**
	 * Removes the records under the keys in one transaction.
	 * @param keys The keys of the records.
	 * @throws {TypeError} If a key is not a string, a finite number or a valid date.
	 */
	delete(keys: Iterable<K>): Promise<void>;
	/**
	 * Counts the records of the store.
	 */
	count(): Promise<number>;
}

class KeyStore<K extends IDBValidKey> implements Store<K> {
	#records: Records;

	constructor(records: Records) {
		this.#records = records;
	}

	#isEntry(entry: readonly [IDBValidKey, unknown]): entry is readonly [K, unknown] {
		return Records.isKey(entry[0]);
	}

	#isBatch(keys: K | Iterable<readonly [K, unknown]>): keys is Iterable<readonly [K, unknown]> {
		return Records.isList(keys);
	}

	#isList(keys: K | Iterable<K>): keys is Iterable<K> {
		return Records.isList(keys);
	}

	*#entries(keys: K | Iterable<readonly [K, unknown]>, value: unknown): Generator<readonly [IDBValidKey, unknown]> {
		const records = this.#records;
		if (!this.#isBatch(keys)) {
			yield [records.validate(keys), value];
			return;
		}
		for (const [key, item] of keys) {
			yield [records.validate(key), item];
		}
	}

	*#keys(keys: K | Iterable<K>): Generator<IDBValidKey> {
		const records = this.#records;
		if (!this.#isList(keys)) {
			yield records.validate(keys);
			return;
		}
		for (const key of keys) {
			yield records.validate(key);
		}
	}

	async select(): Promise<(readonly [K, unknown])[]>;
	async select(key: K): Promise<unknown>;
	async select(key?: K): Promise<unknown> {
		const records = this.#records;
		if (key !== undefined) return await records.get(records.validate(key));
		const entries = await records.entries();
		return entries.filter(entry => this.#isEntry(entry)).toArray();
	}

	async insert(key: K, value: unknown): Promise<void>;
	async insert(entries: Iterable<readonly [K, unknown]>): Promise<void>;
	async insert(keys: K | Iterable<readonly [K, unknown]>, value?: unknown): Promise<void> {
		await this.#records.insert(this.#entries(keys, value));
	}

	async update(key: K, value: unknown): Promise<void>;
	async update(entries: Iterable<readonly [K, unknown]>): Promise<void>;
	async update(keys: K | Iterable<readonly [K, unknown]>, value?: unknown): Promise<void> {
		await this.#records.update(this.#entries(keys, value));
	}

	async delete(key: K): Promise<void>;
	async delete(keys: Iterable<K>): Promise<void>;
	async delete(keys: K | Iterable<K>): Promise<void> {
		await this.#records.delete(this.#keys(keys));
	}

	async count(): Promise<number> {
		return await this.#records.count();
	}
}
//#endregion
//#region Portable store
/**
 * An IndexedDB object store of model rows, identified by the primary key property of the model, opened through {@link IDBFactory.openPortableStore}.
 * Rows are stored through the model's export and restored through its import.
 * The connection opens on first use, a missing store is created, and the connection steps aside when another context upgrades the database.
 */
export interface PortableStore<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>> {
	/**
	 * Reads every row of the store in primary key order.
	 * @throws {SyntaxError} If a stored row is incompatible with the model.
	 */
	select(): Promise<InstanceType<M>[]>;
	/**
	 * Reads the row with the primary key.
	 * @param key The primary key of the row.
	 * @returns The row, or `null` when the store has no row with the key.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 * @throws {SyntaxError} If the stored row is incompatible with the model.
	 */
	select(key: InstanceType<M>[K]): Promise<InstanceType<M> | null>;
	/**
	 * Adds a new row.
	 * Rejects with a `ConstraintError` when a row with the same primary key exists.
	 * @param row The row to add.
	 * @throws {TypeError} If the primary key is not a string, a finite number or a valid date.
	 */
	insert(row: InstanceType<M>): Promise<void>;
	/**
	 * Adds new rows in one transaction: either all of them are added or none is.
	 * Rejects with a `ConstraintError` when a row with the same primary key exists.
	 * @param rows The rows to add.
	 * @throws {TypeError} If a primary key is not a string, a finite number or a valid date.
	 */
	insert(rows: Iterable<InstanceType<M>>): Promise<void>;
	/**
	 * Replaces the existing row with the same primary key.
	 * @param row The new state of the row.
	 * @throws {TypeError} If the primary key is not a string, a finite number or a valid date.
	 * @throws {ReferenceError} If the store has no row with the primary key.
	 */
	update(row: InstanceType<M>): Promise<void>;
	/**
	 * Replaces existing rows in one transaction: either all of them are replaced or none is.
	 * @param rows The new states of the rows.
	 * @throws {TypeError} If a primary key is not a string, a finite number or a valid date.
	 * @throws {ReferenceError} If the store has no row with one of the primary keys.
	 */
	update(rows: Iterable<InstanceType<M>>): Promise<void>;
	/**
	 * Removes the row with the primary key, if any.
	 * @param key The primary key of the row.
	 * @throws {TypeError} If the key is not a string, a finite number or a valid date.
	 */
	delete(key: InstanceType<M>[K]): Promise<void>;
	/**
	 * Removes the rows with the primary keys in one transaction.
	 * @param keys The primary keys of the rows.
	 * @throws {TypeError} If a key is not a string, a finite number or a valid date.
	 */
	delete(keys: Iterable<InstanceType<M>[K]>): Promise<void>;
	/**
	 * Counts the rows of the store.
	 */
	count(): Promise<number>;
}

class ModelStore<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>> implements PortableStore<M, K> {
	#records: Records;
	#model: M;
	#key: K;

	constructor(records: Records, model: M, key: K) {
		this.#records = records;
		this.#model = model;
		this.#key = key;
	}

	#isBatch(rows: InstanceType<M> | Iterable<InstanceType<M>>): rows is Iterable<InstanceType<M>> {
		return !(rows instanceof this.#model);
	}

	*#entries(rows: InstanceType<M> | Iterable<InstanceType<M>>): Generator<readonly [IDBValidKey, unknown]> {
		const records = this.#records;
		const model = this.#model;
		const key = this.#key;
		if (!this.#isBatch(rows)) {
			yield [records.validate(rows[key]), model.export(rows)];
			return;
		}
		for (const row of rows) {
			yield [records.validate(row[key]), model.export(row)];
		}
	}

	*#keys(keys: InstanceType<M>[K] | Iterable<InstanceType<M>[K]>): Generator<IDBValidKey> {
		const records = this.#records;
		if (!Records.isList(keys)) {
			yield records.validate(keys);
			return;
		}
		for (const key of keys) {
			yield records.validate(key);
		}
	}

	#restore(value: unknown, path: string): InstanceType<M> {
		try {
			return this.#model.import(value, path);
		} catch (reason) {
			if (!(reason instanceof TypeError)) throw reason;
			throw new SyntaxError(`Store [${path}]: Row restoration failed.`, { cause: reason });
		}
	}

	async select(): Promise<InstanceType<M>[]>;
	async select(key: InstanceType<M>[K]): Promise<InstanceType<M> | null>;
	async select(key?: InstanceType<M>[K]): Promise<InstanceType<M>[] | InstanceType<M> | null> {
		const records = this.#records;
		const { path } = records;
		if (key === undefined) {
			const values = await records.values();
			return values.map(value => this.#restore(value, path));
		}
		const value = await records.get(records.validate(key));
		if (value === null) return null;
		return this.#restore(value, path);
	}

	async insert(row: InstanceType<M>): Promise<void>;
	async insert(rows: Iterable<InstanceType<M>>): Promise<void>;
	async insert(rows: InstanceType<M> | Iterable<InstanceType<M>>): Promise<void> {
		await this.#records.insert(this.#entries(rows));
	}

	async update(row: InstanceType<M>): Promise<void>;
	async update(rows: Iterable<InstanceType<M>>): Promise<void>;
	async update(rows: InstanceType<M> | Iterable<InstanceType<M>>): Promise<void> {
		await this.#records.update(this.#entries(rows));
	}

	async delete(key: InstanceType<M>[K]): Promise<void>;
	async delete(keys: Iterable<InstanceType<M>[K]>): Promise<void>;
	async delete(keys: InstanceType<M>[K] | Iterable<InstanceType<M>[K]>): Promise<void> {
		await this.#records.delete(this.#keys(keys));
	}

	async count(): Promise<number> {
		return await this.#records.count();
	}
}
//#endregion
//#region IndexedDB
declare global {
	interface IDBFactory {
		/**
		 * Opens an object store of raw values under keys of type `K` (default `string`), creating the database and the store on first use.
		 * @param database The name of the database.
		 * @param store The name of the object store.
		 */
		openStore<K extends string>(database: string, store: string): Store<K>;
		openStore<K extends number>(database: string, store: string): Store<K>;
		openStore<K extends Date>(database: string, store: string): Store<K>;
		/**
		 * Opens an object store of model rows, creating the database and the store on first use.
		 * @param database The name of the database.
		 * @param store The name of the object store.
		 * @param model The model of the rows, with import/export capabilities.
		 * @param key The property of the model that holds the primary key of a row.
		 */
		openPortableStore<M extends PortableConstructor<InstanceType<M>>, K extends KeysOf<InstanceType<M>, string>>(database: string, store: string, model: M, key: K): PortableStore<M, K>;
		openPortableStore<M extends PortableConstructor<InstanceType<M>>, K extends KeysOf<InstanceType<M>, number>>(database: string, store: string, model: M, key: K): PortableStore<M, K>;
		openPortableStore<M extends PortableConstructor<InstanceType<M>>, K extends KeysOf<InstanceType<M>, Date>>(database: string, store: string, model: M, key: K): PortableStore<M, K>;
	}
}

IDBFactory.prototype.openStore = function <K extends IDBValidKey>(database: string, store: string): Store<K> {
	const connection = new Connection(this, database, store);
	const records = new Records(connection);
	return new KeyStore<K>(records);
};

IDBFactory.prototype.openPortableStore = function <M extends PortableConstructor<InstanceType<M>>, K extends (keyof InstanceType<M>)>(database: string, store: string, model: M, key: K): PortableStore<M, K> {
	const connection = new Connection(this, database, store);
	const records = new Records(connection);
	return new ModelStore(records, model, key);
};
//#endregion
