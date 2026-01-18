"use strict";

import "../core/index.js";
import { type PortableConstructor } from "../core/index.js";

//#region Archive
/**
 * Represents a data archive stored in the local storage.
 */
class Archive {
	#key: string;
	/**
	 * @param key The key to use for the local storage.
	 * @param initial The initial value to set if the archive is empty.
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
			throw new SyntaxError(`Archive at key '${key}' could not process the value`);
		}
	}
	static #decompress(key: string, text: string): any {
		try {
			return JSON.parse(text);
		} catch {
			throw new SyntaxError(`Archive at key '${key}' is corrupted`);
		}
	}
	/**
	 * The key used in the local storage.
	 */
	get key(): string {
		return this.#key;
	}
	/**
	 * The data stored in the archive.
	 * @throws {ReferenceError} If the archive is missing from the local storage.
	 * @throws {SyntaxError} If the archive is corrupted.
	 */
	get data(): any {
		const text = localStorage.getItem(this.#key);
		if (text === null) throw new ReferenceError(`Archive at key '${this.#key}' is missing`);
		return Archive.#decompress(this.#key, text);
	}
	/**
	 * The data stored in the archive.
	 * @throws {SyntaxError} If the value could not be processed.
	 */
	set data(value: any) {
		const text = Archive.#compress(this.#key, value);
		localStorage.setItem(this.#key, text);
	}
}
//#endregion
//#region Archive manager
export class ArchiveManager<M extends PortableConstructor<InstanceType<M>>> {
	#archive: Archive;
	#model: M;
	#initial: unknown;

	constructor(key: string, model: M, instance: InstanceType<M>) {
		const initial = ArchiveManager.ensureCompatibility(key, model, instance);
		this.#archive = new Archive(key, initial);
		this.#model = model;
		this.#initial = initial;
	}

	static ensureCompatibility<M extends PortableConstructor<InstanceType<M>, S>, S>(key: string, model: M, instance: InstanceType<M>): S {
		const scheme = model.export(instance);
		const result = model.import(scheme, key);
		if (!(result instanceof model)) throw new TypeError();
		return scheme;
	}

	get key(): string {
		return this.#archive.key;
	}

	get content(): InstanceType<M> {
		try {
			return this.#model.import(this.#archive.data, this.#archive.key);
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			throw new SyntaxError(`Archive at key '${this.#archive.key}' is corrupted`);
		}
	}

	set content(value: InstanceType<M>) {
		this.#archive.data = this.#model.export(value);
	}

	reset(): void {
		this.#archive.data = this.#initial;
	}
}
//#endregion
//#region Archive repository
/**
 * Provides a repository pattern for managing an archivable object with saving.
 */
export class ArchiveRepository<T extends PortableConstructor> {
	#manager: ArchiveManager<T>;
	#content: InstanceType<T>;
	#idSaveTimeout: number = NaN;
	/**
	 * @param key The key for the archive.
	 * @param constructor The constructor of the archivable object.
	 * @param args The arguments for the constructor of the archivable object.
	 */
	constructor(key: string, constructor: T, ...args: ConstructorParameters<T>) {
		this.#manager = new ArchiveManager(key, constructor, ...args);
		this.#content = this.#manager.content;
		window.addEventListener("beforeunload", (event) => {
			if (Number.isNaN(this.#idSaveTimeout)) return;
			event.returnValue = "Archive saving is in process. Do you want to interrupt?";
			event.preventDefault();
		});
	}
	/**
	 * Key of the archive.
	 */
	get key(): string {
		return this.#manager.key;
	}
	/**
	 * The content of the archive.
	 */
	get content(): InstanceType<T> {
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
	 * Schedules a instant save of the content.
	 */
	save(): void;
	/**
	 * Schedules a save of the content after a specified delay in milliseconds.
	 */
	save(delay: number): void;
	save(delay?: number): void {
		if (!Number.isNaN(this.#idSaveTimeout)) clearTimeout(this.#idSaveTimeout);
		this.#idSaveTimeout = setTimeout(this.#handler.bind(this), delay);
	}
	/**
	 * Aborts any pending save operations.
	 */
	abort(): void {
		if (Number.isNaN(this.#idSaveTimeout)) return;
		clearTimeout(this.#idSaveTimeout);
		this.#idSaveTimeout = NaN;
	}
	/**
	 * Resets the content of the archive to a new instance.
	 */
	reset(): void {
		this.#manager.reset();
		this.#content = this.#manager.content;
	}
}
//#endregion
