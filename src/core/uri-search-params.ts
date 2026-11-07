"use strict";

import { URISyntax } from "./uri-syntax.js";

//#region URI search params
/**
 * Represents the callback invoked by {@link URISearchParams.forEach} for each parameter.
 */
export interface URISearchParamsCallback {
	(value: string, key: string, parent: URISearchParams): void;
}

/**
 * Represents an ordered list of query parameters, mirroring the platform `URLSearchParams`.
 * Parsing and serialization follow the `application/x-www-form-urlencoded` format (`+` stands for a space), which is an HTML convention, not part of RFC 3986.
 */
export class URISearchParams {
	#entries: [string, string][] = [];

	/**
	 * Creates an empty parameter list.
	 */
	constructor();
	/**
	 * Parses a query string; a leading `?` is ignored.
	 */
	constructor(init: string);
	/**
	 * Creates a parameter list from name-value pairs.
	 * @throws {TypeError} If a pair does not hold exactly two items.
	 */
	constructor(init: Iterable<readonly [string, string]>);
	/**
	 * Creates a parameter list from the own enumerable properties of a record.
	 */
	constructor(init: Readonly<Record<string, string>>);
	constructor(init: string | Iterable<readonly [string, string]> | Readonly<Record<string, string>> = "") {
		if (typeof init === "string") {
			this.#read(init);
			return;
		}
		if (Symbol.iterator in init) {
			this.#readPairs(init);
			return;
		}
		for (const [name, value] of Object.entries(init)) {
			this.#push(name, value);
		}
	}

	#push(name: string, value: string): void {
		this.#entries.push([name.toWellFormed(), value.toWellFormed()]);
	}

	#read(text: string): void {
		const entries = this.#entries;
		const query = text.startsWith("?") ? text.slice(1) : text;
		for (const part of query.split("&")) {
			if (part === "") continue;
			const equals = part.indexOf("=");
			const name = equals < 0 ? part : part.slice(0, equals);
			const value = equals < 0 ? "" : part.slice(equals + 1);
			entries.push([URISyntax.decode(name), URISyntax.decode(value)]);
		}
	}

	#readPairs(pairs: Iterable<readonly [string, string]>): void {
		for (const pair of pairs) {
			if (pair.length !== 2) throw new TypeError(`Unable to read a parameter from a pair of ${pair.length} items`);
			const [name, value] = pair;
			this.#push(name, value);
		}
	}

	/**
	 * Gets the number of parameters.
	 */
	get size(): number {
		return this.#entries.length;
	}

	/**
	 * Appends a parameter.
	 */
	append(name: string, value: string): void {
		this.#push(name, value);
	}

	/**
	 * Removes every parameter with the given name.
	 */
	delete(name: string): void;
	/**
	 * Removes every parameter with the given name and value.
	 */
	delete(name: string, value: string): void;
	delete(name: string, value?: string): void {
		const key = name.toWellFormed();
		const text = value?.toWellFormed();
		this.#entries = this.#entries.filter(([name2, value2]) => name2 !== key || (text !== undefined && value2 !== text));
	}

	/**
	 * Gets the value of the first parameter with the given name.
	 * @returns The value, or null if there is no such parameter.
	 */
	get(name: string): string | null {
		const key = name.toWellFormed();
		const entry = this.#entries.find(([name2]) => name2 === key);
		if (entry === undefined) return null;
		return entry[1];
	}

	/**
	 * Gets the values of every parameter with the given name, in order.
	 */
	getAll(name: string): string[] {
		const key = name.toWellFormed();
		const values: string[] = [];
		for (const [name2, value] of this.#entries) {
			if (name2 === key) values.push(value);
		}
		return values;
	}

	/**
	 * Checks whether a parameter with the given name exists.
	 */
	has(name: string): boolean;
	/**
	 * Checks whether a parameter with the given name and value exists.
	 */
	has(name: string, value: string): boolean;
	has(name: string, value?: string): boolean {
		const key = name.toWellFormed();
		const text = value?.toWellFormed();
		return this.#entries.some(([name2, value2]) => name2 === key && (text === undefined || value2 === text));
	}

	/**
	 * Sets the value of the first parameter with the given name and removes the others, or appends the parameter if none exists.
	 */
	set(name: string, value: string): void {
		const key = name.toWellFormed();
		const text = value.toWellFormed();
		const entries = this.#entries;
		const index = entries.findIndex(([name2]) => name2 === key);
		if (index < 0) {
			entries.push([key, text]);
			return;
		}
		entries[index] = [key, text];
		this.#entries = entries.filter(([name2], position) => position <= index || name2 !== key);
	}

	/**
	 * Sorts the parameters by name in code unit order; parameters with equal names keep their relative order.
	 */
	sort(): void {
		this.#entries.sort(([name], [name2]) => {
			if (name < name2) return -1;
			if (name > name2) return 1;
			return 0;
		});
	}

	/**
	 * Calls the callback for each parameter, in order.
	 */
	forEach(callback: URISearchParamsCallback): void {
		for (const [name, value] of this.#entries) {
			callback(value, name, this);
		}
	}

	/**
	 * Returns an iterator over the name-value pairs.
	 */
	*entries(): IteratorObject<[string, string], BuiltinIteratorReturn> {
		for (const [name, value] of this.#entries) {
			yield [name, value];
		}
	}

	/**
	 * Returns an iterator over the names.
	 */
	*keys(): IteratorObject<string, BuiltinIteratorReturn> {
		for (const [name] of this.#entries) {
			yield name;
		}
	}

	/**
	 * Returns an iterator over the values.
	 */
	*values(): IteratorObject<string, BuiltinIteratorReturn> {
		for (const [, value] of this.#entries) {
			yield value;
		}
	}

	/**
	 * Returns an iterator over the name-value pairs.
	 */
	[Symbol.iterator](): IteratorObject<[string, string], BuiltinIteratorReturn> {
		return this.entries();
	}

	/**
	 * Returns the parameters as an `application/x-www-form-urlencoded` string, without a leading `?`.
	 */
	toString(): string {
		let result = "";
		for (const [name, value] of this.#entries) {
			if (result !== "") result += "&";
			result += `${URISyntax.encode(name)}=${URISyntax.encode(value)}`;
		}
		return result;
	}
}
//#endregion
