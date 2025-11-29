"use strict";

import "../core/index.js";
import { type ArchivablePrototype } from "../core/index.js";

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
/**
 * Manages the archiving of an object.
 */
export class ArchiveManager<T extends ArchivablePrototype> {
	#prototype: T;
	#args: ConstructorParameters<T>;
	#archive: Archive;
	/**
	 * @param key The key for the archive.
	 * @param prototype The prototype of the archivable object.
	 * @param args The arguments for the constructor of the archivable object.
	 */
	constructor(key: string, prototype: T, ...args: ConstructorParameters<T>) {
		this.#prototype = prototype;
		this.#args = args;
		this.#archive = ArchiveManager.#newArchive(key, prototype, args);
	}
	static #newInstance<T extends ArchivablePrototype>(prototype: T, args: ConstructorParameters<T>): InstanceType<T> {
		return Reflect.construct<ConstructorParameters<T>, InstanceType<T>>(prototype, args);
	}
	static #newArchive<T extends ArchivablePrototype>(key: string, prototype: T, args: ConstructorParameters<T>): Archive {
		const instance = ArchiveManager.#newInstance(prototype, args);
		return new Archive(key, prototype.export(instance));
	}
	/**
	 * Key of the archive.
	 */
	get key(): string {
		return this.#archive.key;
	}
	/**
	 * Reads content of the archive.
	 * @throws {ReferenceError} If the archive is missing from the local storage.
	 * @throws {SyntaxError} If the archive is corrupted.
	 */
	get content(): InstanceType<T> {
		try {
			return this.#prototype.import(this.#archive.data);
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			throw new SyntaxError(`Archive at key '${this.#archive.key}' is corrupted`);
		}
	}
	/**
	 * Writes content of the archive.
	 * @throws {SyntaxError} If the value could not be processed.
	 */
	set content(value: InstanceType<T>) {
		this.#archive.data = this.#prototype.export(value);
	}
	/**
	 * Resets the content of the archive to a new instance.
	 */
	reset(): void {
		this.content = ArchiveManager.#newInstance(this.#prototype, this.#args);
	}
}
//#endregion
//#region Archive repository
/**
 * Provides a repository pattern for managing an archivable object with saving.
 */
export class ArchiveRepository<T extends ArchivablePrototype> {
	#manager: ArchiveManager<T>;
	#content: InstanceType<T>;
	#idSaveTimeout: number = NaN;
	/**
	 * @param key The key for the archive.
	 * @param prototype The prototype of the archivable object.
	 * @param args The arguments for the constructor of the archivable object.
	 */
	constructor(key: string, prototype: T, ...args: ConstructorParameters<T>) {
		this.#manager = new ArchiveManager(key, prototype, ...args);
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
