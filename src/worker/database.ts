"use strict";

import "../core/index.js";
import { type PortableConstructor } from "../core/index.js";
import "./promise.js";

//#region Connection
class Connection {
	static #attempts: number = 3;
	#factory: IDBFactory;
	#name: string;
	#tables: Set<string> = new Set();
	#connection: Promise<IDBDatabase> | null = null;

	constructor(factory: IDBFactory, name: string) {
		this.#factory = factory;
		this.#name = name;
	}

	get name(): string { return this.#name; }

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

	register(table: string): void {
		this.#tables.add(table);
	}

	#complete(connection: IDBDatabase): boolean {
		for (const table of this.#tables) {
			if (!connection.objectStoreNames.contains(table)) return false;
		}
		return true;
	}

	async #upgrade(request: IDBOpenDBRequest): Promise<IDBDatabase> {
		const tables = this.#tables;
		request.addEventListener("upgradeneeded", (event) => {
			const { result } = request;
			for (const table of tables) {
				if (result.objectStoreNames.contains(table)) continue;
				result.createObjectStore(table);
			}
		});
		return await Connection.settle(request);
	}

	#release(connection: IDBDatabase): void {
		connection.close();
		this.#connection = null;
	}

	#watch(connection: IDBDatabase): IDBDatabase {
		const release =  this.#release.bind(this, connection);
		connection.addEventListener("versionchange", release, { once: true });
		connection.addEventListener("close", release, { once: true });
		return connection;
	}

	// A missing table needs a version upgrade; another context may win the same version first, so the upgrade is retried
	async #establish(): Promise<IDBDatabase> {
		const factory = this.#factory;
		const name = this.#name;
		for (let attempt = 1; ; attempt++) {
			const connection = await this.#upgrade(factory.open(name));
			if (this.#complete(connection)) return this.#watch(connection);
			const { version } = connection;
			connection.close();
			try {
				return this.#watch(await this.#upgrade(factory.open(name, version + 1)));
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
		throw new TypeError(`Database [${this.#name}]: Table '${store.name}' uses in-line or generated keys.`);
	}

	async open(table: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
		const connection = await this.#connect();
		try {
			return this.#inspect(connection.transaction(table, mode).objectStore(table));
		} catch (reason) {
			if (!(reason instanceof DOMException) || (reason.name !== "InvalidStateError" && reason.name !== "NotFoundError")) throw reason;
			this.#release(connection);
			const connection2 = await this.#connect();
			return this.#inspect(connection2.transaction(table, mode).objectStore(table));
		}
	}
}
//#endregion
//#region Table
/**
 * A table of a {@link Database}: rows of one model, identified by the primary key property of the model.
 * Rows are stored through the model's export and restored through its import.
 */
export interface Table<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>> {
	/**
	 * The name of the table.
	 */
	get name(): string;
	/**
	 * Reads every row of the table in primary key order.
	 * @throws {SyntaxError} If a stored row is incompatible with the model.
	 */
	select(): Promise<InstanceType<M>[]>;
	/**
	 * Reads the row with the primary key.
	 * @param key The primary key of the row.
	 * @returns The row, or `null` when the table has no row with the key.
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
	 * @throws {ReferenceError} If the table has no row with the primary key.
	 */
	update(row: InstanceType<M>): Promise<void>;
	/**
	 * Replaces existing rows in one transaction: either all of them are replaced or none is.
	 * @param rows The new states of the rows.
	 * @throws {TypeError} If a primary key is not a string, a finite number or a valid date.
	 * @throws {ReferenceError} If the table has no row with one of the primary keys.
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
	 * Counts the rows of the table.
	 */
	count(): Promise<number>;
}

class StoreTable<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>> implements Table<M, K> {
	#connection: Connection;
	#name: string;
	#model: M;
	#key: K;

	constructor(connection: Connection, name: string, model: M, key: K) {
		this.#connection = connection;
		this.#name = name;
		this.#model = model;
		this.#key = key;
	}

	get name(): string { return this.#name; }

	#path(): string {
		return `${this.#connection.name}/${this.#name}`;
	}

	#validate(value: unknown): IDBValidKey {
		if (typeof value === "string") return value;
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
		throw new TypeError(`Table [${this.#path()}]: Primary key ${String(value)} must be a string, a finite number or a valid date.`);
	}

	static #single(value: unknown): boolean {
		return typeof value === "string" || typeof value === "number" || value instanceof Date;
	}

	#keys(keys: InstanceType<M>[K] | Iterable<InstanceType<M>[K]>): IDBValidKey[] {
		if (StoreTable.#single(keys)) return [this.#validate(keys)];
		return Array.from<InstanceType<M>[K], IDBValidKey>(keys as Iterable<InstanceType<M>[K]>, key => this.#validate(key));
	}

	#rows(rows: InstanceType<M> | Iterable<InstanceType<M>>): InstanceType<M>[] {
		if (rows instanceof this.#model) return [rows];
		return Array.from(rows as Iterable<InstanceType<M>>);
	}

	#records(rows: InstanceType<M> | Iterable<InstanceType<M>>): [IDBValidKey, unknown][] {
		const model = this.#model;
		const key = this.#key;
		return this.#rows(rows).map(row => [this.#validate(row[key]), model.export(row)]);
	}

	#restore(value: unknown): InstanceType<M> {
		const path = this.#path();
		try {
			return this.#model.import(value, path);
		} catch (reason) {
			if (!(reason instanceof TypeError)) throw reason;
			throw new SyntaxError(`Table [${path}]: Row restoration failed.`, { cause: reason });
		}
	}

	async #open(mode: IDBTransactionMode): Promise<IDBObjectStore> {
		return await this.#connection.open(this.#name, mode);
	}

	async select(): Promise<InstanceType<M>[]>;
	async select(key: InstanceType<M>[K]): Promise<InstanceType<M> | null>;
	async select(key?: InstanceType<M>[K]): Promise<InstanceType<M>[] | InstanceType<M> | null> {
		if (key === undefined) {
			const store = await this.#open("readonly");
			const values = await Connection.settle(store.getAll());
			return values.map(value => this.#restore(value));
		}
		const validated = this.#validate(key);
		const store = await this.#open("readonly");
		const value = await Connection.settle(store.get(validated));
		if (value === undefined) return null;
		return this.#restore(value);
	}

	async insert(row: InstanceType<M>): Promise<void>;
	async insert(rows: Iterable<InstanceType<M>>): Promise<void>;
	async insert(rows: InstanceType<M> | Iterable<InstanceType<M>>): Promise<void> {
		const records = this.#records(rows);
		const store = await this.#open("readwrite");
		const { transaction } = store;
		try {
			for (const [key, value] of records) {
				store.add(value, key);
			}
		} catch (reason) {
			transaction.abort();
			throw reason;
		}
		await Connection.commit(transaction);
	}

	async update(row: InstanceType<M>): Promise<void>;
	async update(rows: Iterable<InstanceType<M>>): Promise<void>;
	async update(rows: InstanceType<M> | Iterable<InstanceType<M>>): Promise<void> {
		const records = this.#records(rows);
		const store = await this.#open("readwrite");
		const { transaction } = store;
		const missing: IDBValidKey[] = [];
		try {
			for (const [key, value] of records) {
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
			throw new ReferenceError(`Table [${this.#path()}]: Row ${String(missing[0])} not found.`, { cause: reason });
		}
	}

	async delete(key: InstanceType<M>[K]): Promise<void>;
	async delete(keys: Iterable<InstanceType<M>[K]>): Promise<void>;
	async delete(keys: InstanceType<M>[K] | Iterable<InstanceType<M>[K]>): Promise<void> {
		const validated = this.#keys(keys);
		const store = await this.#open("readwrite");
		const { transaction } = store;
		for (const key of validated) {
			store.delete(key);
		}
		await Connection.commit(transaction);
	}

	async count(): Promise<number> {
		const store = await this.#open("readonly");
		return await Connection.settle(store.count());
	}
}
//#endregion
//#region Database
/**
 * An IndexedDB database seen as a set of tables, opened through {@link IDBFactory.openDatabase}.
 * The connection opens on first use, missing tables are created, and the connection steps aside when another context upgrades the database.
 */
export interface Database {
	/**
	 * The name of the database.
	 */
	get name(): string;
	/**
	 * Opens a table of the database, creating it on first use.
	 * @param name The name of the table.
	 * @param model The model of the rows, with import/export capabilities.
	 * @param key The property of the model that holds the primary key of a row.
	 */
	openTable<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>>(name: string, model: M, key: K): Table<M, K>;
}

class IndexedDatabase implements Database {
	#connection: Connection;

	constructor(factory: IDBFactory, name: string) {
		this.#connection = new Connection(factory, name);
	}

	get name(): string { return this.#connection.name; }

	openTable<M extends PortableConstructor<InstanceType<M>>, K extends keyof InstanceType<M>>(name: string, model: M, key: K): Table<M, K> {
		const connection = this.#connection;
		connection.register(name);
		return new StoreTable(connection, name, model, key);
	}
}
//#endregion
//#region IndexedDB
declare global {
	interface IDBFactory {
		/**
		 * Opens a database of this factory as a set of tables; the connection itself opens on first use.
		 * @param name The name of the database.
		 */
		openDatabase(name: string): Database;
	}
}

IDBFactory.prototype.openDatabase = function (name: string): Database {
	return new IndexedDatabase(this, name);
};
//#endregion
