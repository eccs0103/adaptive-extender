"use strict";

import "./global.js";
import { Casing } from "./casing.js";

//#region String
declare global {
	export interface StringConstructor {
		/**
		 * Validates and imports a string value from a raw source.
		 * @param source The raw value to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not a string.
		 */
		import(source: any, name: string): string;
		/**
		 * Returns the primitive string value for export.
		 * @param source The string to export.
		 */
		export(source: string): string;
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
		/**
		 * Converts the string to lowerCamelCase by tokenizing words and capitalizing each after the first.
		 * @example `"hello-world"` → `"helloWorld"`
		 */
		toCamelCase(): string;
		/**
		 * Converts the string to UpperCamelCase (PascalCase) by tokenizing words and capitalizing each.
		 * @example `"hello-world"` → `"HelloWorld"`
		 */
		toPascalCase(): string;
		/**
		 * Converts the string to lower_snake_case by tokenizing words and joining with underscores.
		 * @example `"helloWorld"` → `"hello_world"`
		 */
		toSnakeCase(): string;
		/**
		 * Converts the string to UPPER_SNAKE_CASE by tokenizing words and joining with underscores in uppercase.
		 * @example `"helloWorld"` → `"HELLO_WORLD"`
		 */
		toUpperSnakeCase(): string;
		/**
		 * Converts the string to lower-kebab-case by tokenizing words and joining with hyphens.
		 * @example `"helloWorld"` → `"hello-world"`
		 */
		toKebabCase(): string;
		/**
		 * Converts the string to UPPER-KEBAB-CASE by tokenizing words and joining with hyphens in uppercase.
		 * @example `"helloWorld"` → `"HELLO-WORLD"`
		 */
		toUpperKebabCase(): string;
		/**
		 * Converts the string to Sentence case — first word capitalized, remaining lowercase.
		 * @example `"HELLO_WORLD"` → `"Hello world"`
		 */
		toSentenceCase(): string;
	}
}

String.import = function (source: any, name: string): string {
	if (typeof (source) !== "string") throw new TypeError(`Unable to import string from ${name} due its ${typename(source)} type`);
	return source.valueOf();
};

String.export = function (source: string): string {
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

String.prototype.toCamelCase = function (): string {
	return Casing.camel.convert(this.valueOf());
};

String.prototype.toPascalCase = function (): string {
	return Casing.pascal.convert(this.valueOf());
};

String.prototype.toSnakeCase = function (): string {
	return Casing.snake.convert(this.valueOf());
};

String.prototype.toUpperSnakeCase = function (): string {
	return Casing.upperSnake.convert(this.valueOf());
};

String.prototype.toKebabCase = function (): string {
	return Casing.kebab.convert(this.valueOf());
};

String.prototype.toUpperKebabCase = function (): string {
	return Casing.upperKebab.convert(this.valueOf());
};

String.prototype.toSentenceCase = function (): string {
	return Casing.sentence.convert(this.valueOf());
};
//#endregion
