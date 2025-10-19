"use strict";

import "../core/index.js";

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

export { Archive };
