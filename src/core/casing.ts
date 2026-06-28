"use strict";

//#region Casing
/**
 * Converts a string between identifier casing styles via universal word tokenization.
 * One instance = one formatting strategy. Use the static preset getters to obtain a casing.
 */
export class Casing {
	static #pattern: RegExp = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|\d+/g;
	static #camel: Casing = new Casing(Casing.#toLower, Casing.#toCapital, "");
	static #pascal: Casing = new Casing(Casing.#toCapital, Casing.#toCapital, "");
	static #snake: Casing = new Casing(Casing.#toLower, Casing.#toLower, "_");
	static #upperSnake: Casing = new Casing(Casing.#toUpper, Casing.#toUpper, "_");
	static #kebab: Casing = new Casing(Casing.#toLower, Casing.#toLower, "-");
	static #upperKebab: Casing = new Casing(Casing.#toUpper, Casing.#toUpper, "-");
	static #lower: Casing = new Casing(Casing.#toLower, Casing.#toLower, " ");
	static #upper: Casing = new Casing(Casing.#toUpper, Casing.#toUpper, " ");
	static #title: Casing = new Casing(Casing.#toCapital, Casing.#toCapital, " ");
	static #sentence: Casing = new Casing(Casing.#toCapital, Casing.#toLower, " ");

	#first: (word: string) => string;
	#rest: (word: string) => string;
	#separator: string;

	constructor(first: (word: string) => string, rest: (word: string) => string, separator: string) {
		this.#first = first;
		this.#rest = rest;
		this.#separator = separator;
	}

	/**
	 * Splits any identifier or phrase into its constituent words.
	 * Handles camelCase, PascalCase, UPPER_SNAKE, kebab-case, spaces, dots, and acronym runs.
	 * @param text The source string to tokenize.
	 */
	static words(text: string): string[] {
		const matches = text.match(Casing.#pattern);
		if (matches === null) return [];
		return matches;
	}

	/**
	 * Formats pre-tokenized words using this casing's strategy.
	 * @param words The array of words to format.
	 */
	format(words: string[]): string {
		if (words.length === 0) return "";
		let result = this.#first(words[0]);
		for (let index = 1; index < words.length; index++) {
			result += this.#separator + this.#rest(words[index]);
		}
		return result;
	}

	/**
	 * Converts a string from any recognized casing to this casing.
	 * @param text The source string.
	 */
	convert(text: string): string {
		return this.format(Casing.words(text));
	}

	static #toLower(word: string): string {
		return word.toLowerCase();
	}

	static #toUpper(word: string): string {
		return word.toUpperCase();
	}

	static #toCapital(word: string): string {
		if (word.length === 0) return word;
		return word[0].toUpperCase() + word.slice(1).toLowerCase();
	}

	/**
	 * lowerCamelCase — first word lowercase, subsequent words capitalized, no separator.
	 * @example `"helloWorld"`
	 */
	static get camel(): Casing { return Casing.#camel; }
	/**
	 * UpperCamelCase (PascalCase) — every word capitalized, no separator.
	 * @example `"HelloWorld"`
	 */
	static get pascal(): Casing { return Casing.#pascal; }
	/**
	 * lower_snake_case — all lowercase, underscore separator.
	 * @example `"hello_world"`
	 */
	static get snake(): Casing { return Casing.#snake; }
	/**
	 * UPPER_SNAKE_CASE (CONSTANT_CASE) — all uppercase, underscore separator.
	 * @example `"HELLO_WORLD"`
	 */
	static get upperSnake(): Casing { return Casing.#upperSnake; }
	/**
	 * lower-kebab-case — all lowercase, hyphen separator.
	 * @example `"hello-world"`
	 */
	static get kebab(): Casing { return Casing.#kebab; }
	/**
	 * UPPER-KEBAB-CASE (TRAIN-CASE) — all uppercase, hyphen separator.
	 * @example `"HELLO-WORLD"`
	 */
	static get upperKebab(): Casing { return Casing.#upperKebab; }
	/**
	 * lower case — all lowercase, space separator.
	 * @example `"hello world"`
	 */
	static get lower(): Casing { return Casing.#lower; }
	/**
	 * UPPER CASE — all uppercase, space separator.
	 * @example `"HELLO WORLD"`
	 */
	static get upper(): Casing { return Casing.#upper; }
	/**
	 * Title Case — every word capitalized, space separator.
	 * @example `"Hello World"`
	 */
	static get title(): Casing { return Casing.#title; }
	/**
	 * Sentence case — first word capitalized, remaining lowercase, space separator.
	 * @example `"Hello world"`
	 */
	static get sentence(): Casing { return Casing.#sentence; }
}
//#endregion
