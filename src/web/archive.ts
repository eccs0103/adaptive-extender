"use strict";

import "../core/index.js";
import { type PortableConstructor } from "../core/index.js";

//#region Archive
/**
 * Low-level interface for persistent data storage.
 * Handles direct serialization and retrieval from the platform's local storage.
 */
class Archive {
	#key: string;

	/**
	 * @param key Unique storage identifier.
	 * @param initial Default value used if no data exists at the specified key.
	 */
	constructor(key: string, initial: any) {
		this.#key = key;
		this.#initialize(initial);
	}

	#initialize(value: any): void {
		if (localStorage.getItem(this.#key) !== null) return;
		this.data = value;
	}

	static #compress(key: string, value: any): string {
		try {
			return JSON.stringify(value);
		} catch {
			throw new SyntaxError(`Archive [${key}]: Serialization failed.`);
		}
	}

	static #decompress(key: string, text: string): any {
		try {
			return JSON.parse(text);
		} catch {
			throw new SyntaxError(`Archive [${key}]: Data corrupted.`);
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
	get data(): any {
		const text = localStorage.getItem(this.#key);
		if (text === null) throw new ReferenceError(`Archive [${this.#key}]: Entry not found.`);
		return Archive.#decompress(this.#key, text);
	}

	/**
	 * Overwrites the raw data in the underlying storage.
	 * @param value The value to serialize and store.
	 * @throws {SyntaxError} If the value cannot be serialized.
	 */
	set data(value: any) {
		const text = Archive.#compress(this.#key, value);
		localStorage.setItem(this.#key, text);
	}
}
//#endregion
//#region Archive manager
/**
 * Orchestrates the lifecycle and state-to-model mapping for a specific data type.
 */
export class ArchiveManager<M extends PortableConstructor<InstanceType<M>>> {
	#archive: Archive;
	#model: M;
	#initial: unknown;

	/**
	 * @param key Unique storage identifier.
	 * @param model Constructor with import/export capabilities.
	 * @param instance Baseline object state for initialization and resets.
	 * @throws {TypeError} If the provided instance is incompatible with the model schema.
	 */
	constructor(key: string, model: M, instance: InstanceType<M>) {
		const scheme = ArchiveManager.#ensureCompatibility(key, model, instance);
		this.#archive = new Archive(key, scheme);
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
			throw new TypeError(`Archive [${key}]: Schema validation failed: ${message}`);
		}
	}

	/**
	 * The storage identifier managed by this instance.
	 */
	get key(): string {
		return this.#archive.key;
	}

	/**
	 * Deserializes and reconstructs the model instance from the storage.
	 * @throws {SyntaxError} If storage is corrupted or data is incompatible with the current model version.
	 */
	get content(): InstanceType<M> {
		try {
			return this.#model.import(this.#archive.data, this.#archive.key);
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			throw new SyntaxError(`Archive [${this.#archive.key}]: Content restoration failed.`);
		}
	}

	/**
	 * Serializes the provided model instance and persists it to the storage.
	 * @param value The model instance to export and save.
	 * @throws {SyntaxError} If the instance state cannot be serialized.
	 */
	set content(value: InstanceType<M>) {
		this.#archive.data = this.#model.export(value);
	}

	/**
	 * Reverts the storage to the original state provided at construction.
	 */
	reset(): void {
		this.#archive.data = this.#initial;
	}
}
//#endregion
//#region Archive repository
/**
 * A high-level repository providing buffered access to persistent data with auto-save management.
 */
export class ArchiveRepository<M extends PortableConstructor<InstanceType<M>>> {
	#manager: ArchiveManager<M>;
	#content: InstanceType<M>;
	#idSaveTimeout: number = NaN;

	/**
	 * @param key Unique storage identifier.
	 * @param model Constructor for state transformation.
	 * @param instance Initial state template.
	 */
	constructor(key: string, model: M, instance: InstanceType<M>) {
		this.#manager = new ArchiveManager(key, model, instance);
		this.#content = this.#manager.content;
		this.#initializeUnloadHandler();
	}

	#initializeUnloadHandler(): void {
		window.addEventListener("beforeunload", (event) => {
			if (Number.isNaN(this.#idSaveTimeout)) return;
			event.returnValue = "Pending changes are being saved.";
			event.preventDefault();
		});
	}

	/**
	 * The unique storage identifier.
	 */
	get key(): string {
		return this.#manager.key;
	}

	/**
	 * Retrieves the in-memory instance of the content.
	 * Modifications to this object are not persisted automatically. You must call {@linkcode save}.
	 */
	get content(): InstanceType<M> {
		return this.#content;
	}

	#handler(): void {
		try {
			this.#manager.content = this.#content;
		} finally {
			this.#idSaveTimeout = NaN;
		}
	}

	/**
	 * Schedules an immediate save operation for the current content.
	 * Any pending delayed saves are overridden.
	 */
	save(): void;
	/**
	 * Schedules a save operation to be executed after the specified delay.
	 * Useful for debouncing frequent updates.
	 * @param delay The delay in milliseconds before saving.
	 */
	save(delay: number): void;
	save(delay?: number): void {
		if (!Number.isNaN(this.#idSaveTimeout)) clearTimeout(this.#idSaveTimeout);
		this.#idSaveTimeout = setTimeout(this.#handler.bind(this), delay);
	}

	/**
	 * Cancels any scheduled save operations.
	 */
	abort(): void {
		if (Number.isNaN(this.#idSaveTimeout)) return;
		clearTimeout(this.#idSaveTimeout);
		this.#idSaveTimeout = NaN;
	}

	/**
	 * Discards current changes, clears pending saves, and reverts to the initial state.
	 */
	reset(): void {
		this.abort();
		this.#manager.reset();
		this.#content = this.#manager.content;
	}
}
//#endregion
