"use strict";

declare global {
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

export {};
