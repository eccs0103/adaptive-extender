"use strict";

import "../core/index.js";
import { type ArchivablePrototype } from "../core/index.js";
import { Archive } from "./archive.js";

//#region Archive manager
/**
 * Manages the archiving of an object.
 */
class ArchiveManager<T extends ArchivablePrototype> {
	#prototype: T;
	#args: ConstructorParameters<T>;
	#archive: Archive;
	/**
	 * @param key The key for the archive.
	 * @param prototype The prototype of the archivable object.
	 * @param args The arguments for the constructor of the archivable object.
	 */
	constructor(key: string, prototype: T, args: ConstructorParameters<T>) {
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
	 * Reads content of the archive.
	 */
	get content(): InstanceType<T> {
		return this.#prototype.import(this.#archive.data);
	}
	/**
	 * Writes content of the archive.
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

export { ArchiveManager };
