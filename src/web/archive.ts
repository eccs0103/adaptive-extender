"use strict";

import "../core/index.js";
import { type PortableConstructor } from "../core/index.js";

//#region Cell
/**
 * Low-level interface for a single keyed entry in a {@link Storage} backend.
 * Handles direct serialization and retrieval of raw data.
 */
export class Cell {
	#storage: Storage;
	#key: string;

	/**
	 * @param storage The underlying storage backend.
	 * @param key Unique storage identifier.
	 * @param initial Default value written if no data exists at the specified key.
	 */
	constructor(storage: Storage, key: string, initial: unknown) {
		this.#storage = storage;
		this.#key = key;
		this.#initialize(initial);
	}

	#initialize(value: unknown): void {
		if (this.#storage.getItem(this.#key) !== null) return;
		this.data = value;
	}

	static #compress(key: string, value: unknown): string {
		try {
			return JSON.stringify(value);
		} catch {
			throw new SyntaxError(`Cell [${key}]: Serialization failed.`);
		}
	}

	static #decompress(key: string, text: string): unknown {
		try {
			return JSON.parse(text);
		} catch {
			throw new SyntaxError(`Cell [${key}]: Data corrupted.`);
		}
	}

	/**
	 * The unique identifier for this storage entry.
	 */
	get key(): string {
		return this.#key;
	}

	/**
	 * Retrieves the raw data from the underlying storage.
	 * @throws {ReferenceError} If the entry is missing from the storage.
	 * @throws {SyntaxError} If the data is corrupted and cannot be parsed.
	 */
	get data(): unknown {
		const text = this.#storage.getItem(this.#key);
		if (text === null) throw new ReferenceError(`Cell [${this.#key}]: Entry not found.`);
		return Cell.#decompress(this.#key, text);
	}

	/**
	 * Overwrites the raw data in the underlying storage.
	 * @param value The value to serialize and store.
	 * @throws {SyntaxError} If the value cannot be serialized.
	 */
	set data(value: unknown) {
		const text = Cell.#compress(this.#key, value);
		this.#storage.setItem(this.#key, text);
	}
}
//#endregion
//#region Portable cell
/**
 * Orchestrates the lifecycle and state-to-model mapping for a specific data type.
 */
export class PortableCell<M extends PortableConstructor<InstanceType<M>>> {
	#cell: Cell;
	#model: M;
	#initial: unknown;

	/**
	 * @param storage The underlying storage backend.
	 * @param key Unique storage identifier.
	 * @param model Constructor with import/export capabilities.
	 * @param instance Baseline object state for initialization and resets.
	 * @throws {TypeError} If the provided instance is incompatible with the model schema.
	 */
	constructor(storage: Storage, key: string, model: M, instance: InstanceType<M>) {
		const scheme = PortableCell.#ensureCompatibility(key, model, instance);
		this.#cell = new Cell(storage, key, scheme);
		this.#model = model;
		this.#initial = scheme;
	}

	static #ensureCompatibility<M extends PortableConstructor<InstanceType<M>, S>, S>(key: string, model: M, instance: InstanceType<M>): S {
		try {
			const scheme = model.export(instance);
			const result = model.import(scheme, key);
			if (result instanceof model) return scheme;
			throw new TypeError("Type mismatch during compatibility check.");
		} catch (reason) {
			const { message } = Error.from(reason);
			throw new TypeError(`PortableCell [${key}]: Schema validation failed: ${message}`);
		}
	}

	/**
	 * The storage identifier managed by this instance.
	 */
	get key(): string {
		return this.#cell.key;
	}

	/**
	 * Deserializes and reconstructs the model instance from the storage.
	 * @throws {SyntaxError} If storage is corrupted or data is incompatible with the current model version.
	 */
	get content(): InstanceType<M> {
		try {
			return this.#model.import(this.#cell.data, this.#cell.key);
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			throw new SyntaxError(`PortableCell [${this.#cell.key}]: Content restoration failed.`);
		}
	}

	/**
	 * Serializes the provided model instance and persists it to the storage.
	 * @param value The model instance to export and save.
	 * @throws {SyntaxError} If the instance state cannot be serialized.
	 */
	set content(value: InstanceType<M>) {
		this.#cell.data = this.#model.export(value);
	}

	/**
	 * Reverts the storage to the original state provided at construction.
	 */
	reset(): void {
		this.#cell.data = this.#initial;
	}
}
//#endregion
//#region Buffered cell
class SaveTransaction {
	#idTimeout: number;
	#resolve: (value: boolean) => void;
	#reject: (reason?: unknown) => void;

	constructor(handler: TimerHandler, delay: number | undefined, resolve: (value: boolean) => void, reject: (reason: unknown) => void) {
		this.#idTimeout = setTimeout(handler, delay);
		this.#resolve = resolve;
		this.#reject = reject;
	}

	cancel(): void {
		clearTimeout(this.#idTimeout);
		this.#resolve(false);
	}

	settle(callback: () => void): void {
		try {
			callback();
			this.#resolve(true);
		} catch (reason) {
			this.#reject(Error.from(reason));
		}
	}
}

/**
 * A high-level cell providing buffered access to persistent data with auto-save management.
 */
export class BufferedCell<M extends PortableConstructor<InstanceType<M>>> {
	#cell: PortableCell<M>;
	#content: InstanceType<M>;
	#transaction: SaveTransaction | null = null;

	/**
	 * @param storage The underlying storage backend.
	 * @param key Unique storage identifier.
	 * @param model Constructor for state transformation.
	 * @param instance Initial state template.
	 */
	constructor(storage: Storage, key: string, model: M, instance: InstanceType<M>) {
		this.#cell = new PortableCell(storage, key, model, instance);
		this.#content = this.#cell.content;
		this.#initializeUnloadHandler();
	}

	#initializeUnloadHandler(): void {
		window.addEventListener("beforeunload", (event) => {
			if (this.#transaction === null) return;
			event.returnValue = "Pending changes are being saved.";
			event.preventDefault();
		});
	}

	/**
	 * The unique storage identifier.
	 */
	get key(): string {
		return this.#cell.key;
	}

	/**
	 * Retrieves the in-memory instance of the content.
	 * Modifications to this object are not persisted automatically. You must call {@linkcode save}.
	 */
	get content(): InstanceType<M> {
		return this.#content;
	}

	#handler(): void {
		const transaction = this.#transaction;
		this.#transaction = null;
		transaction?.settle(() => {
			this.#cell.content = this.#content;
		});
	}

	/**
	 * Schedules an immediate save operation for the current content.
	 * Any pending delayed saves are cancelled.
	 * @returns A promise that resolves `true` when the save completes, `false` if cancelled (superseded or aborted), or rejects if serialization fails.
	 */
	async save(): Promise<boolean>;
	/**
	 * Schedules a save operation to be executed after the specified delay.
	 * Useful for debouncing frequent updates. Any existing pending save is cancelled.
	 * @param delay The delay in milliseconds before saving.
	 * @returns A promise that resolves `true` when the save completes, `false` if cancelled (superseded or aborted), or rejects if serialization fails.
	 */
	async save(delay: number): Promise<boolean>;
	async save(delay?: number): Promise<boolean> {
		const transaction = this.#transaction;
		transaction?.cancel();
		return await new Promise((resolve, reject) => {
			this.#transaction = new SaveTransaction(this.#handler.bind(this), delay, resolve, reject);
		});
	}

	/**
	 * Cancels any scheduled save operations.
	 * Any pending {@linkcode save} promise resolves to `false`.
	 */
	abort(): void {
		const transaction = this.#transaction;
		transaction?.cancel();
		this.#transaction = null;
	}

	/**
	 * Discards current changes, clears pending saves, and reverts to the initial state.
	 */
	reset(): void {
		this.abort();
		const cell = this.#cell;
		cell.reset();
		this.#content = cell.content;
	}
}
//#endregion
//#region Storage
declare global {
	interface Storage {
		/**
		 * Opens a raw keyed entry backed by this storage.
		 * @param key Unique storage identifier.
		 * @param initial Default value written if no data exists at the specified key.
		 */
		openCell(key: string, initial: unknown): Cell;
		/**
		 * Opens a typed, model-bound entry backed by this storage.
		 * @param key Unique storage identifier.
		 * @param model Constructor with import/export capabilities.
		 * @param instance Baseline object state for initialization and resets.
		 * @throws {TypeError} If the instance is incompatible with the model schema.
		 */
		openPortableCell<M extends PortableConstructor<InstanceType<M>>>(key: string, model: M, instance: InstanceType<M>): PortableCell<M>;
		/**
		 * Opens a buffered, model-bound entry backed by this storage with auto-save management.
		 * @param key Unique storage identifier.
		 * @param model Constructor for state transformation.
		 * @param instance Initial state template.
		 */
		openBufferedCell<M extends PortableConstructor<InstanceType<M>>>(key: string, model: M, instance: InstanceType<M>): BufferedCell<M>;
	}
}

Storage.prototype.openCell = function (key: string, initial: unknown): Cell {
	return new Cell(this, key, initial);
};

Storage.prototype.openPortableCell = function <M extends PortableConstructor<InstanceType<M>>>(key: string, model: M, instance: InstanceType<M>): PortableCell<M> {
	return new PortableCell(this, key, model, instance);
};

Storage.prototype.openBufferedCell = function <M extends PortableConstructor<InstanceType<M>>>(key: string, model: M, instance: InstanceType<M>): BufferedCell<M> {
	return new BufferedCell(this, key, model, instance);
};
//#endregion
