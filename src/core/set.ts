"use strict";

import { type PortableConstructor } from "./portable.js";

//#region Set
declare global {
	export interface SetConstructor {
		/**
		 * Creates a portable wrapper for set types.
		 * @param type The portable type of the set elements.
		 */
		Of<I, S>(type: PortableConstructor<I, S>): PortableConstructor<Set<I>, S[]>;
	}

	export interface Set<T> {
		/**
		 * Toggles presence of an element in the set.
		 * @param value The value to toggle.
		 * @returns `true` if the value is present after the operation, otherwise `false`.
		 */
		toggle(value: T): boolean;
		/**
		 * Toggles presence of an element in the set.
		 * @param value The value to toggle.
		 * @param force If true, ensures the value is present; if false, ensures it is absent.
		 * @returns `true` if the value is present after the operation, otherwise `false`.
		 */
		toggle(value: T, force: boolean): boolean;
	}
}

Set.Of = function <I, S>(type: PortableConstructor<I, S>): PortableConstructor<Set<I>, S[]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Set[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Set<${type.name}>`;
		},

		import(source: any, name: string): Set<I> {
			return new Set(Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`)));
		},

		export(source: Set<I>): S[] {
			return Array.from(source, item => type.export(item));
		},
	} as PortableConstructor<Set<I>, S[]>;
};

Set.prototype.toggle = function <T>(this: Set<T>, value: T, force?: boolean): boolean {
	if (force === undefined) {
		if (this.has(value)) {
			this.delete(value);
			return false;
		}
		this.add(value);
		return true;
	}
	if (force) {
		this.add(value);
		return true;
	}
	this.delete(value);
	return false;
};
//#endregion
