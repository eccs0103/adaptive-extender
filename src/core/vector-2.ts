"use strict";

import { type Vector } from "./vector.js";
import { Vector1D } from "./vector-1.js";

//#region Vector 2D
/**
 * Represents a 2D vector.
 */
class Vector2D extends Vector1D {
	//#region Properties
	#y: number;
	/**
	 * Gets the y-component of the vector.
	 */
	get y(): number {
		return this.#y;
	}
	/**
	 * Sets the y-component of the vector.
	 */
	set y(value: number) {
		this.#y = value;
	}
	//#endregion
	//#region Builders
	/**
	 * @param x The x-component of the vector.
	 * @param y The y-component of the vector.
	 */
	constructor(x: number, y: number) {
		super(x);
		this.#y = y;
	}
	static #patternVector2D: RegExp = /^\(\s*(\S+)\s*,\s*(\S+)\s*\)$/;
	/**
	 * Creates a new `Vector2D` from a single scalar value.
	 * @param scalar The scalar value.
	 */
	static fromScalar(scalar: number): Vector2D {
		return new Vector2D(scalar, scalar);
	}
	/**
	 * Creates a new `Vector2D` from a generic `Vector`.
	 * @param vector The source vector.
	 */
	static fromVector(vector: Vector): Vector2D {
		const metrics = vector[Symbol.iterator]();
		const metric1 = metrics.next();
		if (metric1.done) return new Vector2D(0, 0);
		const metric2 = metrics.next();
		if (metric2.done) return new Vector2D(metric1.value, 0);
		return new Vector2D(metric1.value, metric2.value);
	}
	/**
	 * Tries to parse a string into a `Vector2D`.
	 * @param string The string to parse.
	 * @returns A `Vector2D` instance or `null`.
	 */
	static tryParse(string: string): Vector2D | null {
		const match = Vector2D.#patternVector2D.exec(string.trim());
		if (match === null) return null;
		const [, x, y] = match.map(Number);
		return new Vector2D(x, y);
	}
	/**
	 * Parses a string into a `Vector2D`.
	 * @param string The string to parse.
	 * @throws {SyntaxError} If the string is not a valid representation of a 2D vector.
	 */
	static parse(string: string): Vector2D {
		const vector = Vector2D.tryParse(string);
		if (vector === null) throw new SyntaxError(`Invalid syntax '${string}' for 2D vector`);
		return vector;
	}
	//#endregion
	//#region Converters
	/**
	 * Gets an iterator for the components of the vector.
	 */
	*[Symbol.iterator](): IteratorObject<number, BuiltinIteratorReturn> {
		yield this.x;
		yield this.y;
	}
	//#endregion
	//#region Presets
	/**
	 * A new `Vector2D` with `NaN` as its components.
	 */
	static get newNaN(): Vector2D { return Vector2D.fromScalar(NaN); }
	/**
	 * A new `Vector2D` with zero as its components.
	 */
	static get newZero(): Vector2D { return Vector2D.fromScalar(0); }
	/**
	 * A new `Vector2D` representing the unit vector in the x-direction.
	 */
	static get newUnitX(): Vector2D { return new Vector2D(1, 0); }
	/**
	 * A new `Vector2D` representing the unit vector in the y-direction.
	 */
	static get newUnitY(): Vector2D { return new Vector2D(0, 1); }
	/**
	 * A new `Vector2D` with a magnitude of 1 in all directions.
	 */
	static get newUnit(): Vector2D { return Vector2D.fromScalar(1); }
	//#endregion
}
//#endregion

export { Vector2D };
