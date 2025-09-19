"use strict";

//#region Vector
/**
 * @abstract
 */
class Vector implements Iterable<number, BuiltinIteratorReturn, unknown> {
	//#region Builders
	constructor() {
		if (new.target === Vector) throw new TypeError("Unable to create an instance of an abstract class");
	}
	//#endregion
	//#region LInQ
	*map<U>(callback: (value: number, index: number) => U): IteratorObject<U, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) yield callback(metric, index++);
	}
	filter<S extends number>(predicate: (value: number, index: number) => value is S): IteratorObject<S, BuiltinIteratorReturn>;
	filter(predicate: (value: number, index: number) => unknown): IteratorObject<number, BuiltinIteratorReturn>;
	*filter(predicate: (value: number, index: number) => unknown): IteratorObject<number, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) {
			if (predicate(metric, index++)) yield metric;
		}
	}
	*flatMap<U>(callback: (value: number, index: number) => Iterable<U>): IteratorObject<U, BuiltinIteratorReturn> {
		let index = 0;
		for (const metric of this) yield* callback(metric, index++);
	}
	reduce(callback: (accumulator: number, value: number, index: number) => number): number;
	reduce(callback: (accumulator: number, value: number, index: number) => number, initial: number): number;
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
	forEach(callback: (value: number, index: number) => void): void {
		let index = 0;
		for (const metric of this) callback(metric, index++);
	}
	some(predicate: (value: number, index: number) => unknown): boolean {
		let index = 0;
		for (const metric of this) {
			if (predicate(metric, index++)) return true;
		}
		return false;
	}
	every(predicate: (value: number, index: number) => unknown): boolean {
		let index = 0;
		for (const metric of this) {
			if (!predicate(metric, index++)) return false;
		}
		return true;
	}
	find<S extends number>(predicate: (value: number, index: number) => value is S): S | undefined;
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
	static isNaN(vector: Vector): boolean {
		return vector.every(Number.isNaN);
	}
	static isFinite(vector: Vector): boolean {
		return vector.every(Number.isFinite);
	}
	static isInteger(vector: Vector): boolean {
		return vector.every(Number.isInteger);
	}
	static isSafeInteger(vector: Vector): boolean {
		return vector.every(Number.isSafeInteger);
	}
	insteadNaN<T>(value: T): this | T {
		if (Vector.isNaN(this)) return value;
		return this;
	}
	insteadInfinity<T>(value: T): this | T {
		if (!Vector.isFinite(this)) return value;
		return this;
	}
	insteadZero<T>(value: T): this | T {
		if (this.every(metric => metric === 0)) return value;
		return this;
	}
	//#endregion
	//#region Converters
	*[Symbol.iterator](): IteratorObject<number, BuiltinIteratorReturn> {
	}
	toFixed(): string;
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
	toExponential(): string;
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
	toPrecision(): string;
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
	toString(): string;
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
	toLocaleString(): string;
	toLocaleString(locales: string): string;
	toLocaleString(locales: string, options: Intl.NumberFormatOptions): string;
	toLocaleString(locales: string[]): string;
	toLocaleString(locales: string[], options: Intl.NumberFormatOptions): string;
	toLocaleString(locales: Intl.LocalesArgument): string;
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

export { Vector };
