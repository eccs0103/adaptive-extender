"use strict";

import "./global.js";

const { trunc } = Math;

//#region Array
declare global {
	export interface ArrayConstructor {
		/**
		 * Imports an array from a source.
		 * @param source The source to import from.
		 * @param name The name of the source.
		 * @returns The imported array.
		 * @throws {TypeError} If the source is not an array.
		 */
		import(source: any, name?: string): any[];
		/**
		 * Creates an array of integers between the specified minimum and maximum values (exclusive).
		 * @param min The minimum value of the range (inclusive).
		 * @param max The maximum value of the range (exclusive).
		 */
		range(min: number, max: number): number[];
		/**
		 * Combines elements from multiple iterables into tuples.
		 * Iteration stops when the shortest iterable is exhausted.
		 * @returns An iterator yielding tuples.
		 */
		zip<T extends unknown[]>(...iterables: { [K in keyof T]: Iterable<T[K]> }): IteratorObject<T, void>;
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
		 * @param _default The value used to fill when the array grows.
		 */
		resize(length: number, _default: T): T[];
	}
}

Array.import = function (source: any, name: string = "[source]"): any[] {
	if (!Array.isArray(source)) throw new TypeError(`Unable to import array from ${name} due its ${typename(source)} type`);
	return source;
};

Array.range = function (min: number, max: number): number[] {
	min = trunc(min);
	max = trunc(max);
	const array: number[] = [];
	for (let index = 0; index < max - min; index++) {
		array.push(index + min);
	}
	return array;
};

Array.zip = function*<T extends unknown[]>(...iterables: { [K in keyof T]: Iterable<T[K]> }): IteratorObject<T, void> {
	const iterators = iterables.map(iterable => iterable[Symbol.iterator]());
	while (true) {
		const results = iterators.map(iterator => iterator.next());
		if (results.some(result => result.done)) break;
		yield results.map(result => result.value) as T;
	}
};

Array.prototype.swap = function (index1: number, index2: number): void {
	index1 = trunc(index1);
	index2 = trunc(index2);
	const temporary = this[index1];
	this[index1] = this[index2];
	this[index2] = temporary;
};

Array.prototype.resize = function <T>(this: T[], length: number, _default: T): T[] {
	while (length > this.length) this.push(_default);
	this.length = length;
	return this;
};
//#endregion
