"use strict";

import { type Vector } from "./vector.js";
import { Vector2D } from "./vector-2.js";

//#region Vector 3D
/**
 * Represents a 3D vector.
 */
export class Vector3D extends Vector2D {
	//#region Properties
	#z: number;
	/**
	 * Gets the z-component of the vector.
	 */
	get z(): number {
		return this.#z;
	}
	/**
	 * Sets the z-component of the vector.
	 */
	set z(value: number) {
		this.#z = value;
	}
	//#endregion
	//#region Builders
	static #patternVector3D: RegExp = /^\(\s*([^\s,()]+)\s*,\s*([^\s,()]+)\s*,\s*([^\s,()]+)\s*\)$/;
	/**
	 * @param x The x-component of the vector.
	 * @param y The y-component of the vector.
	 * @param z The z-component of the vector.
	 */
	constructor(x: number, y: number, z: number) {
		super(x, y);
		this.#z = z;
	}
	/**
	 * Creates a new `Vector3D` from a single scalar value.
	 * @param scalar The scalar value.
	 */
	static fromScalar(scalar: number): Vector3D {
		return new Vector3D(scalar, scalar, scalar);
	}
	/**
	 * Creates a new `Vector3D` from a generic `Vector`.
	 * @param vector The source vector.
	 */
	static fromVector(vector: Vector): Vector3D {
		const metrics = vector[Symbol.iterator]();
		const metric1 = metrics.next();
		if (metric1.done) return new Vector3D(0, 0, 0);
		const metric2 = metrics.next();
		if (metric2.done) return new Vector3D(metric1.value, 0, 0);
		const metric3 = metrics.next();
		if (metric3.done) return new Vector3D(metric1.value, metric2.value, 0);
		return new Vector3D(metric1.value, metric2.value, metric3.value);
	}
	/**
	 * Tries to parse a string into a `Vector3D`.
	 * @param string The string to parse.
	 * @returns A `Vector3D` instance or `null`.
	 */
	static tryParse(string: string): Vector3D | null {
		const match = Vector3D.#patternVector3D.exec(string.trim());
		if (match === null) return null;
		const [, x, y, z] = match.map(Number);
		return new Vector3D(x, y, z);
	}
	/**
	 * Parses a string into a `Vector3D`.
	 * @param string The string to parse.
	 * @throws {SyntaxError} If the string is not a valid representation of a 3D vector.
	 */
	static parse(string: string): Vector3D {
		const vector = Vector3D.tryParse(string);
		if (vector === null) throw new SyntaxError(`Invalid syntax '${string}' for 3D vector`);
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
		yield this.z;
	}
	//#endregion
	//#region Presets
	/**
	 * A new `Vector3D` with `NaN` as its components.
	 */
	static get newNaN(): Vector3D { return Vector3D.fromScalar(NaN); }
	/**
	 * A new `Vector3D` with zero as its components.
	 */
	static get newZero(): Vector3D { return Vector3D.fromScalar(0); }
	/**
	 * A new `Vector3D` representing the unit vector in the x-direction.
	 */
	static get newUnitX(): Vector3D { return new Vector3D(1, 0, 0); }
	/**
	 * A new `Vector3D` representing the unit vector in the y-direction.
	 */
	static get newUnitY(): Vector3D { return new Vector3D(0, 1, 0); }
	/**
	 * A new `Vector3D` representing the unit vector in the z-direction.
	 */
	static get newUnitZ(): Vector3D { return new Vector3D(0, 0, 1); }
	/**
	 * A new `Vector3D` with a magnitude of 1 in all directions.
	 */
	static get newUnit(): Vector3D { return Vector3D.fromScalar(1); }
	//#endregion
}
//#endregion
