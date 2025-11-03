"use strict";

import { Vector } from "./vector.js";

//#region Vector 1D
/**
 * Represents a 1D vector.
 */
class Vector1D extends Vector {
	//#region Properties
	#x: number;
	/**
	 * Gets the x-component of the vector.
	 */
	get x(): number {
		return this.#x;
	}
	/**
	 * Sets the x-component of the vector.
	 */
	set x(value: number) {
		this.#x = value;
	}
	//#endregion
	//#region Builders
	/**
	 * @param x The x-component of the vector.
	 */
	constructor(x: number) {
		super();
		this.#x = x;
	}
	static #patternVector1D: RegExp = /^\(\s*(\S+)\s*\)$/;
	/**
	 * Creates a new `Vector1D` from a single scalar value.
	 * @param scalar The scalar value.
	 */
	static fromScalar(scalar: number): Vector1D {
		return new Vector1D(scalar);
	}
	/**
	 * Creates a new `Vector1D` from a generic `Vector`.
	 * @param vector The source vector.
	 */
	static fromVector(vector: Vector): Vector1D {
		const metrics = vector[Symbol.iterator]();
		const metric1 = metrics.next();
		if (metric1.done) return new Vector1D(0);
		return new Vector1D(metric1.value);
	}
	/**
	 * Tries to parse a string into a `Vector1D`.
	 * @param string The string to parse.
	 * @returns A `Vector1D` instance or `null`.
	 */
	static tryParse(string: string): Vector1D | null {
		const match = Vector1D.#patternVector1D.exec(string.trim());
		if (match === null) return null;
		const [, x] = match.map(Number);
		return new Vector1D(x);
	}
	/**
	 * Parses a string into a `Vector1D`.
	 * @param string The string to parse.
	 * @throws {SyntaxError} If the string is not a valid representation of a 1D vector.
	 */
	static parse(string: string): Vector1D {
		const vector = Vector1D.tryParse(string);
		if (vector === null) throw new SyntaxError(`Invalid syntax '${string}' for 1D vector`);
		return vector;
	}
	//#endregion
	//#region Converters
	/**
	 * Gets an iterator for the components of the vector.
	 */
	*[Symbol.iterator](): IteratorObject<number, BuiltinIteratorReturn> {
		yield this.x;
	}
	//#endregion
	//#region Presets
	/**
	 * A new `Vector1D` with `NaN` as its component.
	 */
	static get newNaN(): Vector1D { return Vector1D.fromScalar(NaN); }
	/**
	 * A new `Vector1D` with zero as its component.
	 */
	static get newZero(): Vector1D { return Vector1D.fromScalar(0); }
	/**
	 * A new `Vector1D` representing the unit vector in the x-direction.
	 */
	static get newUnitX(): Vector1D { return new Vector1D(1); }
	/**
	 * A new `Vector1D` with a magnitude of 1.
	 */
	static get newUnit(): Vector1D { return Vector1D.fromScalar(1); }
	//#endregion
}
//#endregion

export { Vector1D };
