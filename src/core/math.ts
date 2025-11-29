"use strict";

const { PI, trunc, pow } = Math;

//#region Number
declare global {
	export interface Number {
		/**
		 * Clamps a value between a minimum and maximum.
		 * @param min The minimum value.
		 * @param max The maximum value.
		 * @returns The clamped value.
		 */
		clamp(min: number, max: number): number;
		/**
		 * Maps the number from a source range into the normalized range [0, 1].
		 * @param min1 The minimum value of the source range.
		 * @param max1 The maximum value of the source range.
		 * @throws {Error} When the source range has equal bounds.
		 */
		lerp(min1: number, max1: number): number;
		/**
		 * Maps the number from a source range into a target range.
		 * @param min1 The minimum value of the source range.
		 * @param max1 The maximum value of the source range.
		 * @param min2 The minimum value of the target range.
		 * @param max2 The maximum value of the target range.
		 * @throws {Error} When the source or target ranges have equal bounds.
		 */
		lerp(min1: number, max1: number, min2: number, max2: number): number;
		/**
		 * Wraps the number into the range [0, length).
		 * @param length The length of the range.
		 * @throws {RangeError} When the length is zero.
		 */
		mod(length: number): number;
		/**
		 * Wraps the number into the range [start, start + length).
		 * @param start The start of the range.
		 * @param length The length of the range.
		 * @throws {RangeError} When the length is zero.
		 */
		mod(start: number, length: number): number;
	}
}

Number.prototype.clamp = function (min: number, max: number): number {
	let result = this.valueOf();
	if (result < min) return min;
	if (result > max) return max;
	return result;
};

function lerp(value: number, min1: number, max1: number, min2: number, max2: number): number {
	if (min1 === max1) throw new Error("Minimum and maximum of the original range cant be equal");
	if (min2 === max2) throw new Error("Minimum and maximum of the target range cant be equal");
	return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
}

Number.prototype.lerp = function (min1: number, max1: number, min2?: number, max2?: number): number {
	if (min2 === undefined || max2 === undefined) return lerp(this.valueOf(), min1, max1, 0, 1);
	return lerp(this.valueOf(), min1, max1, min2, max2);
};

function mod(value: number, start: number, length: number): number {
	if (length === 0) throw new RangeError("Length must not be zero");
	return ((value - start) % length + length) % length + start;
}

Number.prototype.mod = function (arg1: number, arg2?: number): number {
	if (arg2 === undefined) return mod(this.valueOf(), 0, arg1);
	return mod(this.valueOf(), arg1, arg2);
};
//#endregion
//#region Math
declare global {
	export interface Math {
		/**
		 * Splits a number into its integer and fractional parts.
		 * @param x The number to be split.
		 * @returns A tuple where the first element is the integer part and the second element is the fractional part.
		 * ```ts
		 * const [integer, fractional] = Math.split(x);
		 * ```
		 */
		split(x: number): [number, number];
		/**
		 * Calculates the square of a number.
		 * @param x The number to square.
		 */
		sqpw(x: number): number;
		/**
		 * Converts radians to degrees.
		 * @param radians The angle in radians.
		 */
		toDegrees(radians: number): number;
		/**
		 * Converts degrees to radians.
		 * @param degrees The angle in degrees.
		 */
		toRadians(degrees: number): number;
		/**
		 * Calculates the arithmetic mean of the given numbers.
		 * @param values The numbers to calculate the mean from.
		 */
		meanArithmetic(...values: number[]): number;
		/**
		 * Calculates the geometric mean of the given numbers.
		 * @param values The numbers to calculate the mean from.
		 */
		meanGeometric(...values: number[]): number;
		/**
		 * Calculates the harmonic mean of the given numbers.
		 * @param values The numbers to calculate the mean from.
		 */
		meanHarmonic(...values: number[]): number;
	}
}

Math.split = function (x: number): [number, number] {
	const integer = trunc(x);
	return [integer, (x - integer)];
};

Math.sqpw = function (x: number): number {
	return x * x;
};

const toDegreeFactor = 180 / PI;
Math.toDegrees = function (radians: number): number {
	return radians * toDegreeFactor;
};

const toRadianFactor = PI / 180;
Math.toRadians = function (degrees: number): number {
	return degrees * toRadianFactor;
};

Math.meanArithmetic = function (...values: number[]): number {
	let summary = 0;
	for (let index = 0; index < values.length; index++) {
		summary += values[index];
	}
	return summary / values.length;
};

Math.meanGeometric = function (...values: number[]): number {
	let product = 1;
	for (let index = 0; index < values.length; index++) {
		product *= values[index];
	}
	return pow(product, 1 / values.length);
};

Math.meanHarmonic = function (...values: number[]): number {
	let summary = 0;
	for (let index = 0; index < values.length; index++) {
		const value = values[index];
		if (value === 0) return NaN;
		summary += 1 / value;
	}
	return values.length / summary;
};
//#endregion
