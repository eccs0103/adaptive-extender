"use strict";

import "./global.js";
import { type Promisable } from "./promise.js";

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
		/**
		 * Creates an array from an async iterable or iterable object.
		 * @param iterable An async iterable or iterable object to convert to an array.
		 */
		fromAsync<T>(iterable: AsyncIterable<T> | Iterable<T>): Promise<T[]>;
		/**
		 * Creates an array from an async iterable or iterable object.
		 * @param iterable An async iterable or iterable object to convert to an array.
		 * @param mapper A mapping function to call on every element of the array.
		 * @param context Value of 'this' used to invoke the mapper.
		 */
		fromAsync<T, U>(iterable: AsyncIterable<T> | Iterable<T>, mapper: (value: T, key: number) => U | PromiseLike<U>, context?: unknown): Promise<U[]>;
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
	}
}

Array.import = function (source: any, name: string): any[] {
	if (!Array.isArray(source)) throw new TypeError(`Unable to import array from ${name} due its ${typename(source)} type`);
	return source;
};

Array.export = function (source: any[]): any[] {
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

Array.fromAsync = async function <T, U>(iterable: AsyncIterable<T> | Iterable<T>, mapper?: (value: T, key: number) => Promisable<U>, context?: unknown): Promise<(T | U)[]> {
	const array: (T | U)[] = [];
	let index = 0;
	for await (const element of iterable) {
		if (mapper === undefined) {
			array.push(element);
			index++;
			continue;
		}
		if (context === undefined) {
			array.push(await mapper(element, index));
			index++;
			continue;
		}
		array.push(await mapper.call(context, element, index));
		index++;
	}
	return array;
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
//#endregion

Array.from;
