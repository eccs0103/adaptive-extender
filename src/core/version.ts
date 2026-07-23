"use strict";

import "./global.js";

const { trunc } = Math;

//#region Version
/**
 * Represents a semantic version with major, minor, and patch components.
 */
export class Version {
	static #pattern: RegExp = /^(\d+)\.(\d+)\.(\d+)$/;

	#major: number;
	#minor: number;
	#patch: number;

	/**
	 * Creates a version defaulting to `0.0.0`.
	 */
	constructor();
	/**
	 * Creates a version from its numeric components.
	 * Non-integer finite values are truncated; negative finite values are clamped to zero.
	 * @throws {Error} If any component is not a finite number.
	 */
	constructor(major: number, minor: number, patch: number);
	constructor(major: number = 0, minor: number = 0, patch: number = 0) {
		if (!Number.isFinite(major)) throw new Error(`The major ${major} must be a finite number`);
		if (!Number.isFinite(minor)) throw new Error(`The minor ${minor} must be a finite number`);
		if (!Number.isFinite(patch)) throw new Error(`The patch ${patch} must be a finite number`);
		this.#major = trunc(major).clamp(0, Infinity);
		this.#minor = trunc(minor).clamp(0, Infinity);
		this.#patch = trunc(patch).clamp(0, Infinity);
	}

	/**
	 * Gets the major component.
	 */
	get major(): number { return this.#major; }

	/**
	 * Gets the minor component.
	 */
	get minor(): number { return this.#minor; }

	/**
	 * Gets the patch component.
	 */
	get patch(): number { return this.#patch; }

	/**
	 * Returns the version as a `"major.minor.patch"` string.
	 */
	toString(): string {
		return `${this.#major}.${this.#minor}.${this.#patch}`;
	}

	/**
	 * Attempts to parse a string in `"major.minor.patch"` format into a Version.
	 * @returns The parsed Version, or null if the string is invalid.
	 */
	static tryParse(string: string): Version | null {
		const match = Version.#pattern.exec(string.trim());
		if (match === null) return null;
		const [, major, minor, patch] = match.map(Number);
		return new Version(major, minor, patch);
	}

	/**
	 * Parses a string in `"major.minor.patch"` format into a Version.
	 * @throws {SyntaxError} If the string cannot be parsed.
	 */
	static parse(string: string): Version {
		const version = Version.tryParse(string);
		if (version === null) throw new SyntaxError(`Unable to parse '${string}' as version`);
		return version;
	}

	/**
	 * Compares two versions by major, then minor, then patch component.
	 * @returns A negative number if `left` precedes `right`, a positive number if it follows, or zero if they are equal.
	 */
	static compare(left: Readonly<Version>, right: Readonly<Version>): number {
		if (left.major !== right.major) return left.major - right.major;
		if (left.minor !== right.minor) return left.minor - right.minor;
		return left.patch - right.patch;
	}

	/**
	 * Validates and imports a version from a raw string source.
	 * @param source The raw value to check.
	 * @param name The field name for error context.
	 * @throws {TypeError} If the source is not a string.
	 * @throws {SyntaxError} If the string cannot be parsed as a version.
	 */
	static import(source: any, name: string): Version {
		if (typeof source !== "string") throw new TypeError(`Unable to import version from ${name} due its ${typename(source)} type`);
		return Version.parse(source);
	}

	/**
	 * Returns the version string for export.
	 * @param source The version to export.
	 */
	static export(source: Version): string {
		return source.toString();
	}
}
//#endregion
