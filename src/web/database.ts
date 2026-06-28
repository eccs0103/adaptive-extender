"use strict";

import "../core/index.js";
import "./promise.js";

//#region Database store
/**
 * Describes the static-side factory methods of the database store.
 */
export interface DatabaseStoreConstructor {
	/**
	 * Opens a store in the database, creating it if it does not exist.
	 * @param nameDatabase The name of the database.
	 * @param nameStore The name of the store.
	 * @returns The opened store.
	 */
	open(nameDatabase: string, nameStore: string): Promise<DatabaseStore>;
	/**
	 * Suspends (deletes) a store from the database.
	 * @param nameDatabase The name of the database.
	 * @param nameStore The name of the store.
	 */
	suspend(nameDatabase: string, nameStore: string): Promise<void>;
}

/**
 * Represents a store within a database.
 */
export interface DatabaseStore {
	/**
	 * Gets the name of the store.
	 */
	get name(): string;
	/**
	 * Gets the database the store belongs to.
	 */
	get database(): Database;
	/**
	 * Inserts values into the store.
	 * @param values The values to insert.
	 * @returns The auto-generated keys of the inserted values.
	 */
	insert(...values: any[]): Promise<number[]>;
	/**
	 * Selects values from the store by keys.
	 * @param keys The keys of the values to select.
	 * @returns The selected values.
	 */
	select(...keys: number[]): Promise<any[]>;
	/**
	 * Updates values in the store by key-value pairs.
	 * @param pairs The key-value pairs to update, each as `[key, value]`.
	 */
	update(...pairs: [number, any][]): Promise<void>;
	/**
	 * Removes values from the store by keys.
	 * @param keys The keys of the values to remove.
	 */
	remove(...keys: number[]): Promise<void>;
	/**
	 * Suspends the store.
	 */
	suspend(): Promise<void>;
}
//#endregion
//#region Database
/**
 * Represents a database for storing data.
 */
export class Database {
	//#region Store
	static #Store: DatabaseStoreConstructor = class Store implements DatabaseStore {
		static #locked: boolean = true;

		static async #newStore(nameDatabase: string, nameStore: string): Promise<Store> {
			const database = await Database.#newDatabase(nameDatabase);
			Store.#locked = false;
			const store = new Store();
			Store.#locked = true;
			store.#name = nameStore;
			store.#database = database;
			return store;
		}

		static async open(nameDatabase: string, nameStore: string): Promise<DatabaseStore> {
			const store = await Store.#newStore(nameDatabase, nameStore);
			const { database } = store;
			if (!(await database.#openDatabaseWith(idb => idb.objectStoreNames.contains(nameStore)))) {
				await database.#upgradeDatabaseWith(idb => idb.createObjectStore(nameStore, { autoIncrement: true }));
			}
			return store;
		}

		static async suspend(nameDatabase: string, nameStore: string): Promise<void> {
			const database = await Database.#newDatabase(nameDatabase);
			if (await database.#openDatabaseWith(idb => idb.objectStoreNames.contains(nameStore))) {
				await database.#upgradeDatabaseWith(idb => idb.deleteObjectStore(nameStore));
			}
		}

		/**
		 * @throws {TypeError} If the constructor is called directly.
		 */
		constructor() {
			if (Store.#locked) throw new TypeError("Illegal constructor");
		}

		#name: string;
		get name(): string {
			return this.#name;
		}

		#database: Database;
		get database(): Database {
			return this.#database;
		}

		#openStoreWith<T>(action: (store: IDBObjectStore) => T | PromiseLike<T>): Promise<T> {
			return this.#database.#openDatabaseWith(async (idb) => {
				const store = idb.transaction([this.#name], "readwrite").objectStore(this.#name);
				const result = await action(store);
				store.transaction.commit();
				return result;
			});
		}

		insert(...values: any[]): Promise<number[]> {
			return this.#openStoreWith(async (store) => {
				const keys: number[] = [];
				for (const value of values) {
					keys.push(Number(await Database.#resolve(store.add(value))));
				}
				return keys;
			});
		}

		select(...keys: number[]): Promise<any[]> {
			return this.#openStoreWith(async (store) => {
				const values: any[] = [];
				for (const key of keys) {
					values.push(await Database.#resolve(store.get(Number(key))));
				}
				return values;
			});
		}

		update(...pairs: [number, any][]): Promise<void> {
			return this.#openStoreWith(async (store) => {
				for (const [key, value] of pairs) {
					await Database.#resolve(store.put(value, key));
				}
			});
		}

		remove(...keys: number[]): Promise<void> {
			return this.#openStoreWith(async (store) => {
				for (const key of keys) {
					await Database.#resolve(store.delete(Number(key)));
				}
			});
		}

		suspend(): Promise<void> {
			return Database.Store.suspend(this.#database.name, this.#name);
		}
	};

	/**
	 * Provides factory methods for opening and suspending stores.
	 */
	static get Store(): DatabaseStoreConstructor {
		return Database.#Store;
	}
	//#endregion

	static #resolve<T>(request: IDBRequest<T>): Promise<T> {
		return Promise.withSignal((signal, resolve, reject) => {
			request.addEventListener("success", () => resolve(request.result), { signal });
			request.addEventListener("error", () => reject(request.error), { signal });
		});
	}

	static #locked: boolean = true;

	static async #newDatabase(nameDatabase: string): Promise<Database> {
		Database.#locked = false;
		const database = new Database();
		Database.#locked = true;
		database.#name = nameDatabase;
		database.#version = await Database.#getVersion(nameDatabase);
		return database;
	}

	static async #getVersion(nameDatabase: string): Promise<number> {
		for (const { name, version } of await indexedDB.databases()) {
			if (name === nameDatabase && version !== undefined) return version;
		}
		return 0;
	}

	/**
	 * Opens an existing database, creating it if it does not exist.
	 * @param nameDatabase The name of the database.
	 * @returns The opened database.
	 */
	static async open(nameDatabase: string): Promise<Database> {
		const database = await Database.#newDatabase(nameDatabase);
		await database.#openDatabaseWith(idb => idb);
		return database;
	}

	/**
	 * Suspends (deletes) a database.
	 * @param nameDatabase The name of the database.
	 */
	static suspend(nameDatabase: string): Promise<void> {
		return Promise.withSignal((signal, resolve, reject) => {
			const request = indexedDB.deleteDatabase(nameDatabase);
			request.addEventListener("success", () => resolve(), { signal });
			request.addEventListener("error", () => reject(request.error), { signal });
		});
	}

	/**
	 * Gets a list of all database names.
	 */
	static get databases(): Promise<readonly string[]> {
		return (async () => {
			const list: string[] = [];
			for (const { name } of await indexedDB.databases()) {
				if (name === undefined) continue;
				list.push(name);
			}
			return Object.freeze(list);
		})();
	}

	/**
	 * @throws {TypeError} If the constructor is called directly.
	 */
	constructor() {
		if (Database.#locked) throw new TypeError("Illegal constructor");
	}

	#name: string;
	/**
	 * Gets the name of the database.
	 */
	get name(): string { return this.#name; }

	#version: number;

	#upgradeDatabaseWith<T>(action: (idb: IDBDatabase) => T): Promise<T> {
		return Promise.withSignal((signal, resolve, reject) => {
			const request = indexedDB.open(this.#name, ++this.#version);
			let result!: T;
			request.addEventListener("upgradeneeded", () => {
				result = action(request.result);
			}, { signal });
			request.addEventListener("success", () => {
				request.result.close();
				resolve(result);
			}, { signal });
			request.addEventListener("blocked", () => reject(new Error(`Database '${this.#name}' upgrade was blocked`)), { signal });
			request.addEventListener("error", () => reject(request.error), { signal });
		});
	}

	#openDatabaseWith<T>(action: (idb: IDBDatabase) => T | PromiseLike<T>): Promise<T> {
		return Promise.withSignal((signal, resolve, reject) => {
			const request = indexedDB.open(this.#name);
			request.addEventListener("success", async () => {
				const idb = request.result;
				this.#version = idb.version;
				const result = await action(idb);
				idb.close();
				resolve(result);
			}, { signal });
			request.addEventListener("error", () => reject(request.error), { signal });
		});
	}

	/**
	 * Gets a list of all store names in the database.
	 */
	get stores(): Promise<readonly string[]> {
		return this.#openDatabaseWith(idb => Object.freeze(Array.from(idb.objectStoreNames)));
	}

	/**
	 * Suspends the database.
	 */
	suspend(): Promise<void> {
		return Database.suspend(this.#name);
	}
}
//#endregion
