"use strict";

import "./global.js";
import "./iterator.js";
import { type PortableConstructor } from "./portable.js";

const { trunc } = Math;

//#region Array
declare global {
	export interface ArrayConstructor {
		/**
		 * Validates that the source is an array and returns it.
		 * @param source The raw data to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not an array.
		 */
		import(source: any, name: string): any[];
		/**
		 * Returns the array as-is for export purposes.
		 * @param source The array to export.
		 */
		export(source: any[]): any[];
		/**
		 * Creates a portable wrapper for array types.
		 * @param type The portable type of the array elements.
		 */
		Of<I, S>(type: PortableConstructor<I, S>): PortableConstructor<I[], S[]>;
		/**
		 * Creates an array of integers between the specified minimum and maximum values (exclusive).
		 * @param min The minimum value of the range (inclusive).
		 * @param max The maximum value of the range (exclusive).
		 */
		range(min: number, max: number): number[];
	}

	export interface Array<T> {
		/**
		 * Swaps the elements at the given indices in the array.
		 * @param index1 The index of the first element.
		 * @param index2 The index of the second element.
		 */
		swap(index1: number, index2: number): void;
		/**
		 * Resizes the array to a specified length, filling with a default value if extended.
		 * @param length The new length of the array.
		 * @param $default The value used to fill when the array grows.
		 */
		resize(length: number, $default: T): T[];
		/**
		 * Removes the first occurrence of the specified value from the array.
		 * @param value The value to remove.
		 * @returns `true` if the value was found and removed, otherwise `false`.
		 */
		remove(value: T): boolean;
	}
}

Array.import = function (source: any, name: string): any[] {
	if (!Array.isArray(source)) throw new TypeError(`Unable to import array from ${name} due its ${typename(source)} type`);
	return source;
};

Array.export = function (source: any[]): any[] {
	return source;
};

Array.Of = function <I, S>(type: PortableConstructor<I, S>): PortableConstructor<I[], S[]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Array[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `${type.name}[]`;
		},

		import(source: any, name: string): I[] {
			return Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`));
		},

		export(source: I[]): S[] {
			return source.map(item => type.export(item));
		},
	} as PortableConstructor<I[], S[]>;
};

Array.range = function (min: number, max: number): number[] {
	return Array.from(Iterator.range(min, max));
};


Array.prototype.swap = function (index1: number, index2: number): void {
	index1 = trunc(index1);
	index2 = trunc(index2);
	const temporary = this[index1];
	this[index1] = this[index2];
	this[index2] = temporary;
};

Array.prototype.resize = function <T>(this: T[], length: number, $default: T): T[] {
	while (length > this.length) this.push($default);
	this.length = length;
	return this;
};

Array.prototype.remove = function <T>(this: T[], value: T): boolean {
	const index = this.indexOf(value);
	if (index < 0) return false;
	this.splice(index, 1);
	return true;
};
//#endregion
