"use strict";

import "./global.js";

//#region String
declare global {
	export interface StringConstructor {
		/**
		 * Imports a string from a source.
		 * @param source The source value to import.
		 * @param name The name of the source value.
		 * @returns The imported string value.
		 * @throws {TypeError} If the source is not a string.
		 */
		import(source: any, name: string): string;
		/**
		 * A constant empty string.
		 */
		empty: string;
		/**
		 * Checks if a string is empty.
		 * @returns True if empty.
		 */
		isEmpty(text: string): boolean;
		/**
		 * Checks if a string contains only whitespace characters.
		 * @returns True if empty or only whitespace.
		 */
		isWhitespace(text: string): boolean;
	}

	export interface String {
		/**
		 * Returns the current string unless it is empty, replacing it with the provided value.
		 * @returns Original string or fallback.
		 */
		insteadEmpty<T>(value: T): string | T;
		/**
		 * Returns the current string unless it consists only of whitespace, replacing it with the provided value.
		 * @returns Original string or fallback.
		 */
		insteadWhitespace<T>(value: T): string | T;
		/**
		 * Converts the string to title case, where the first letter of each word is capitalized.
		 */
		toTitleCase(): string;
		/**
		 * Converts the string to title case using the default locale.
		 */
		toLocalTitleCase(): string;
		/**
		 * Converts the string to title case using a single locale string.
		 */
		toLocalTitleCase(locales: string): string;
		/**
		 * Converts the string to title case using an array of locale strings.
		 */
		toLocalTitleCase(locales: string[]): string;
		/**
		 * Converts the string to title case using any Intl.LocalesArgument.
		 */
		toLocalTitleCase(locales: Intl.LocalesArgument): string;
	}
}

String.import = function (source: any, name: string): string {
	if (typeof (source) !== "string") throw new TypeError(`Unable to import string from ${name} due its ${typename(source)} type`);
	return source.valueOf();
};

Object.defineProperty(String, "empty", {
	value: "",
	writable: false,
});

String.isEmpty = function (text: string): boolean {
	return (text.length === 0);
};

String.isWhitespace = function (text: string): boolean {
	return String.isEmpty(text.trimStart());
};

String.prototype.insteadEmpty = function <T>(value: T): string | T {
	const current = this.valueOf();
	if (String.isEmpty(current)) return value;
	return current;
};

String.prototype.insteadWhitespace = function <T>(value: T): string | T {
	const current = this.valueOf();
	if (String.isWhitespace(current)) return value;
	return current;
};

const patternWordsFirstLetter = /\b\w/g;

String.prototype.toTitleCase = function (): string {
	return this.toLowerCase().replace(patternWordsFirstLetter, char => char.toUpperCase());
};

String.prototype.toLocalTitleCase = function (locales?: Intl.LocalesArgument | string | string[]): string {
	return this.toLocaleLowerCase(locales).replace(patternWordsFirstLetter, char => char.toLocaleUpperCase(locales));
};
//#endregion
