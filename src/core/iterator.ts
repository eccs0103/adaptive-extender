"use strict";

const { trunc } = Math;

//#region Iterator
declare global {
	export interface IteratorConstructor {
		/**
		 * Creates a lazy iterator of integers in the range [min, max).
		 * @param min The minimum value (inclusive).
		 * @param max The maximum value (exclusive).
		 */
		range(min: number, max: number): IteratorObject<number, void>;
		/**
		 * Combines elements from multiple iterables into tuples.
		 * Iteration stops when the shortest iterable is exhausted.
		 * @returns An iterator yielding tuples.
		 */
		zip<T extends unknown[]>(...iterables: { [K in keyof T]: Iterable<T[K]> }): IteratorObject<T, void>;
	}
}

Iterator.range = function* (min: number, max: number): IteratorObject<number, void> {
	min = trunc(min);
	max = trunc(max);
	for (let index = min; index < max; index++) yield index;
};

Iterator.zip = function*<T extends unknown[]>(...iterables: { [K in keyof T]: Iterable<T[K]> }): IteratorObject<T, void> {
	const iterators = iterables.map(iterable => iterable[Symbol.iterator]());
	while (true) {
		const results = iterators.map(iterator => iterator.next());
		if (results.some(result => result.done)) break;
		yield results.map(result => result.value) as T;
	}
};
//#endregion
