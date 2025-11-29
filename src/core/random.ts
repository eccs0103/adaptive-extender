"use strict";

const { random, trunc } = Math;

//#region Random
/**
 * Provides utility methods for generating random values.
 */
export class Random {
	static #global: Random = new Random();
	/**
	 * Gets the global shared random generator instance.
	 */
	static get global(): Random {
		return Random.#global;
	}
	/**
	 * Generates a random boolean with a 50% probability of being `true`.
	 * @returns A random boolean value.
	 */
	boolean(): boolean;
	/**
	 * Generates a random boolean with the given probability of being `true`.
	 * @param factor Probability of returning `true` [0 – 1].
	 * @returns A random boolean value.
	 * @throws {Error} If `factor` is not a finite number.
	 * @throws {RangeError} If `factor` is outside the range.
	 */
	boolean(factor: number): boolean;
	boolean(factor: number = 0.5): boolean {
		if (!Number.isFinite(factor)) throw new Error(`The factor ${factor} must be a finite number`);
		if (0 > factor || factor > 1) throw new RangeError(`The factor ${factor} is out of range [0 - 1]`);
		return random() < factor;
	}
	#number(min: number, max: number): number {
		return random() * (max - min) + min;
	}
	/**
	 * Generates a random floating-point number between the smallest and largest possible number.
	 * @returns A random floating-point number.
	 */
	number(): number;
	/**
	 * Generates a random floating-point number between 0 and the specified maximum.
	 * @param max The maximum value (exclusive).
	 * @returns A random floating-point number.
	 */
	number(max: number): number;
	/**
	 * Generates a random floating-point number between the specified minimum and maximum.
	 * @param min The minimum value (inclusive).
	 * @param max The maximum value (exclusive).
	 * @returns A random floating-point number.
	 */
	number(min: number, max: number): number;
	number(arg1?: number, arg2?: number): number {
		if (arg1 === undefined) return this.#number(-Number.MAX_VALUE, Number.MAX_VALUE);
		if (arg2 === undefined) return this.#number(0, arg1);
		return this.#number(arg1, arg2);
	}
	#integer(min: number, max: number): number {
		return trunc(this.#number(min, max + 1));
	}
	/**
	 * Generates a random integer between the minimum safe integer and the maximum safe integer.
	 * @returns A random integer value.
	 */
	integer(): number;
	/**
	 * Generates a random integer between 0 and the specified maximum.
	 * @param max The maximum value (inclusive).
	 * @returns A random integer value.
	 */
	integer(max: number): number;
	/**
	 * Generates a random integer between the specified minimum and maximum.
	 * @param min The minimum value (inclusive).
	 * @param max The maximum value (inclusive).
	 * @returns A random integer value.
	 */
	integer(min: number, max: number): number;
	integer(arg1?: number, arg2?: number): number {
		if (arg1 === undefined) return this.#integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
		if (arg2 === undefined) return this.#integer(0, arg1);
		return this.#integer(arg1, arg2);
	}
	/**
	 * Selects a random item from a non-empty array.
	 * @param array The array to pick from.
	 * @returns A random element from the array.
	 * @throws {Error} If the array is empty.
	 */
	item<T>(array: readonly T[]): T {
		if (array.length < 1) throw new Error(`Array must have at least 1 item`);
		return array[this.#integer(0, array.length - 1)];
	}
	/**
	 * Creates a shuffled range of numbers between `min` and `max`.
	 * @param min Minimum value (inclusive).
	 * @param max Maximum value (inclusive).
	 * @returns An array of shuffled numbers in the specified range.
	 */
	range(min: number, max: number): number[] {
		const array = Array.range(min, max);
		this.shuffle(array);
		return array;
	}
	/**
	 * Returns all elements of the array in random order.
	 * @param array The source array.
	 * @returns A shuffled copy of the array.
	 */
	subarray<T>(array: readonly T[]): T[];
	/**
	 * Returns a random subset of the given size from the array.
	 * @param array The source array.
	 * @param count The number of elements to select.
	 * @returns A shuffled array containing the selected elements.
	 * @throws {Error} If `count` is not an integer.
	 * @throws {RangeError} If `count` is outside the valid range.
	 */
	subarray<T>(array: readonly T[], count: number): T[];
	subarray<T>(array: readonly T[], count: number = array.length): T[] {
		if (!Number.isInteger(count)) throw new Error(`The count ${count} must be a finite integer number`);
		if (0 > count || count > array.length) throw new RangeError(`The count ${count} is out of range [0 - ${array.length}]`);
		const clone = Array.from(array);
		const subarray = [];
		for (let index = 0; index < count; index++) {
			subarray.push(...clone.splice(this.#integer(0, clone.length - 1), 1));
		}
		return subarray;
	}
	/**
	 * Randomly shuffles the order of elements in an array in place.
	 * @param array The array to shuffle.
	 */
	shuffle<T>(array: T[]): void {
		for (let index = 0; index < array.length - 1; index++) {
			const pair = this.#integer(index, array.length - 1);
			if (pair === index) continue;
			array.swap(index, pair);
		}
	}
	/**
	 * Selects a random key from a map based on assigned weights.
	 * @param cases A map of items to their respective weights.
	 * @returns A randomly selected item based on weights.
	 * @throws {Error} If the map is empty.
	 * @throws {Error} If no item can be selected.
	 */
	case<T>(cases: Readonly<Map<T, number>>): T {
		if (1 > cases.size) throw new Error(`The cases must have at least 1 item`);
		const summary = Array.from(cases).reduce((previous, [, weight]) => previous + weight, 0);
		const random = this.#number(0, summary);
		let begin = 0;
		for (const [item, weight] of cases) {
			const end = begin + weight;
			if (begin <= random && random < end) return item;
			begin = end;
		}
		throw new Error(`Unable to select element with value ${random}`);
	};
}
//#endregion
