"use strict";

//#region Vector
/**
 * Represents an abstract vector, an ordered collection of numbers.
 */
export abstract class Vector implements Iterable<number, BuiltinIteratorReturn, unknown> {
	//#region Builders
	/**
	 * @throws {TypeError} If this constructor is called directly.
	 */
	constructor() {
		if (new.target === Vector) throw new TypeError("Unable to create an instance of an abstract class");
	}
	//#endregion
	//#region LInQ
	/**
	 * Projects each element of a vector into a new form.
	 * @param callback A transform function to apply to each element.
	 */
	*map<U>(callback: (value: number, index: number) => U): IteratorObject<U, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) yield callback(metric, index++);
	}
	/**
	 * Filters a sequence of values based on a predicate.
	 * @param predicate A function to test each element for a condition.
	 * @returns An iterator for a sequence of values that satisfy the condition.
	 */
	filter<S extends number>(predicate: (value: number, index: number) => value is S): IteratorObject<S, BuiltinIteratorReturn>;
	/**
	 * Filters a sequence of values based on a predicate.
	 * @param predicate A function to test each element for a condition.
	 * @returns An iterator for a sequence of values that satisfy the condition.
	 */
	filter(predicate: (value: number, index: number) => unknown): IteratorObject<number, BuiltinIteratorReturn>;
	*filter(predicate: (value: number, index: number) => unknown): IteratorObject<number, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) {
			if (predicate(metric, index++)) yield metric;
		}
	}
	/**
	 * Projects each element of a sequence to an iterable and flattens the resulting sequences into one sequence.
	 * @param callback A transform function to apply to each element.
	 */
	*flatMap<U>(callback: (value: number, index: number) => Iterable<U>): IteratorObject<U, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) yield* callback(metric, index++);
	}
	/**
	 * Applies an accumulator function over a sequence.
	 * @param callback An accumulator function to be invoked on each element.
	 * @returns The final accumulator value.
	 * @throws {TypeError} If the vector is empty and no initial value is provided.
	 */
	reduce(callback: (accumulator: number, value: number, index: number) => number): number;
	/**
	 * Applies an accumulator function over a sequence.
	 * @param callback An accumulator function to be invoked on each element.
	 * @param initial The initial accumulator value.
	 * @returns The final accumulator value.
	 */
	reduce(callback: (accumulator: number, value: number, index: number) => number, initial: number): number;
	/**
	 * Applies an accumulator function over a sequence.
	 * @template U
	 * @param callback An accumulator function to be invoked on each element.
	 * @param initial The initial accumulator value.
	 * @returns The final accumulator value.
	 */
	reduce<U>(callback: (accumulator: U, value: number, index: number) => U, initial: U): U;
	reduce<U>(callback: (accumulator: U, value: number, index: number) => U, initial?: U): U {
		let index = 0;
		let accumulator = initial;
		const iterator = this[Symbol.iterator]();
		if (accumulator === undefined) {
			const result1 = iterator.next();
			if (result1.done) throw new TypeError("Reduce of empty vector with no initial value");
			accumulator = result1.value as U;
		}
		for (const value of iterator) {
			accumulator = callback(accumulator, value, index++);
		}
		return accumulator;
	}
	/**
	 * Performs the specified action for each element in a vector.
	 * @param callback An action to perform on each element.
	 */
	forEach(callback: (value: number, index: number) => void): void {
		let index = 0;
		for (const metric of this) callback(metric, index++);
	}
	/**
	 * Determines whether any element of a vector satisfies a condition.
	 * @param predicate A function to test each element for a condition.
	 */
	some(predicate: (value: number, index: number) => unknown): boolean {
		let index = 0;
		for (const metric of this) {
			if (predicate(metric, index++)) return true;
		}
		return false;
	}
	/**
	 * Determines whether all elements of a vector satisfy a condition.
	 * @param predicate A function to test each element for a condition.
	 */
	every(predicate: (value: number, index: number) => unknown): boolean {
		let index = 0;
		for (const metric of this) {
			if (!predicate(metric, index++)) return false;
		}
		return true;
	}
	/**
	 * Returns the first element in the sequence that satisfies a specified condition.
	 * @param predicate A function to test each element for a condition.
	 * @returns The first element in the sequence that passes the test in the specified predicate. Returns `undefined` if no such element is found.
	 */
	find<S extends number>(predicate: (value: number, index: number) => value is S): S | undefined;
	/**
	 * Returns the first element in the sequence that satisfies a specified condition.
	 * @param predicate A function to test each element for a condition.
	 * @returns The first element in the sequence that passes the test in the specified predicate. Returns `undefined` if no such element is found.
	 */
	find(predicate: (value: number, index: number) => unknown): number | undefined;
	find(predicate: (value: number, index: number) => unknown): number | undefined {
		let index = 0;
		for (const metric of this) {
			if (predicate(metric, index++)) return metric;
		}
		return undefined;
	}
	//#endregion
	//#region Validators
	/**
	 * Checks if all components of the vector are `NaN`.
	 * @param vector The vector to check.
	 */
	static isNaN(vector: Vector): boolean {
		return vector.every(Number.isNaN);
	}
	/**
	 * Checks if all components of the vector are finite numbers.
	 * @param vector The vector to check.
	 */
	static isFinite(vector: Vector): boolean {
		return vector.every(Number.isFinite);
	}
	/**
	 * Checks if all components of the vector are integers.
	 * @param vector The vector to check.
	 */
	static isInteger(vector: Vector): boolean {
		return vector.every(Number.isInteger);
	}
	/**
	 * Checks if all components of the vector are safe integers.
	 * @param vector The vector to check.
	 */
	static isSafeInteger(vector: Vector): boolean {
		return vector.every(Number.isSafeInteger);
	}
	/**
	 * Returns a fallback value if all components of the vector are `NaN`.
	 * @param value The fallback value.
	 * @returns The original vector or the fallback value.
	 */
	insteadNaN<T>(value: T): this | T {
		if (Vector.isNaN(this)) return value;
		return this;
	}
	/**
	 * Returns a fallback value if any component of the vector is not a finite number.
	 * @param value The fallback value.
	 * @returns The original vector or the fallback value.
	 */
	insteadInfinity<T>(value: T): this | T {
		if (!Vector.isFinite(this)) return value;
		return this;
	}
	/**
	 * Returns a fallback value if all components of the vector are zero.
	 * @param value The fallback value.
	 * @returns The original vector or the fallback value.
	 */
	insteadZero<T>(value: T): this | T {
		if (this.every(metric => metric === 0)) return value;
		return this;
	}
	//#endregion
	//#region Converters
	/**
	 * Gets an iterator for the components of the vector.
	 */
	*[Symbol.iterator](): IteratorObject<number, BuiltinIteratorReturn> {
	}
	/**
	 * Formats the vector using fixed-point notation.
	 * @returns A string representation of the vector.
	 */
	toFixed(): string;
	/**
	 * Formats the vector using fixed-point notation.
	 * @param digits The number of digits to appear after the decimal point.
	 * @returns A string representation of the vector.
	 */
	toFixed(digits: number): string;
	toFixed(digits?: number): string {
		let result = "(";
		let first = true;
		for (const metric of this) {
			if (!first) result += ", ";
			result += metric.toFixed(digits);
			if (first) first = false;
		}
		result += ")";
		return result;
	}
	/**
	 * Formats the vector using exponential notation.
	 * @returns A string representation of the vector.
	 */
	toExponential(): string;
	/**
	 * Formats the vector using exponential notation.
	 * @param digits The number of digits to appear after the decimal point.
	 * @returns A string representation of the vector.
	 */
	toExponential(digits: number): string;
	toExponential(digits?: number): string {
		let result = "(";
		let first = true;
		for (const metric of this) {
			if (!first) result += ", ";
			result += metric.toExponential(digits);
			if (first) first = false;
		}
		result += ")";
		return result;
	}
	/**
	 * Formats the vector to a specified precision.
	 * @returns A string representation of the vector.
	 */
	toPrecision(): string;
	/**
	 * Formats the vector to a specified precision.
	 * @param precision The number of significant digits.
	 * @returns A string representation of the vector.
	 */
	toPrecision(precision: number): string;
	toPrecision(precision?: number): string {
		let result = "(";
		let first = true;
		for (const metric of this) {
			if (!first) result += ", ";
			result += metric.toPrecision(precision);
			if (first) first = false;
		}
		result += ")";
		return result;
	}
	/**
	 * Returns a string representation of the vector.
	 * @returns A string representation of the vector.
	 */
	toString(): string;
	/**
	 * Returns a string representation of the vector.
	 * @param radix An integer in the range 2 through 36 specifying the base to use for representing numeric values.
	 * @returns A string representation of the vector.
	 */
	toString(radix: number): string;
	toString(radix?: number): string {
		let result = "(";
		let first = true;
		for (const metric of this) {
			if (!first) result += ", ";
			result += metric.toString(radix);
			if (first) first = false;
		}
		result += ")";
		return result;
	}
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: string): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @param options An object with some or all of the following properties: `localeMatcher`, `style`, `currency`, `currencyDisplay`, `useGrouping`, `minimumIntegerDigits`, `minimumFractionDigits`, `maximumFractionDigits`, `minimumSignificantDigits`, `maximumSignificantDigits`.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: string, options: Intl.NumberFormatOptions): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: string[]): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @param options An object with some or all of the following properties: `localeMatcher`, `style`, `currency`, `currencyDisplay`, `useGrouping`, `minimumIntegerDigits`, `minimumFractionDigits`, `maximumFractionDigits`, `minimumSignificantDigits`, `maximumSignificantDigits`.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: string[], options: Intl.NumberFormatOptions): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: Intl.LocalesArgument): string;
	/**
	 * Converts the vector to a string by using the current or specified locale.
	 * @param locales A string with a BCP 47 language tag, or an array of such strings.
	 * @param options An object with some or all of the following properties: `localeMatcher`, `style`, `currency`, `currencyDisplay`, `useGrouping`, `minimumIntegerDigits`, `minimumFractionDigits`, `maximumFractionDigits`, `minimumSignificantDigits`, `maximumSignificantDigits`.
	 * @returns A string representation of the vector.
	 */
	toLocaleString(locales: Intl.LocalesArgument, options: Intl.NumberFormatOptions): string;
	toLocaleString(locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): string {
		let result = "(";
		let first = true;
		for (const metric of this) {
			if (!first) result += ", ";
			result += metric.toLocaleString(locales, options);
			if (first) first = false;
		}
		result += ")";
		return result;
	}
	//#endregion
}
//#endregion
