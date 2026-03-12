"use strict";

declare global {
	export interface Map<K, V> {
		/**
		 * Adds the key/value pair only if the key is not already present.
		 * @param key The key to add.
		 * @param value The value to associate with the key.
		 * @returns `true` if the entry was added, otherwise `false`.
		 */
		add(key: K, value: V): boolean;
	}
}

Map.prototype.add = function <K, V>(this: Map<K, V>, key: K, value: V): boolean {
	if (this.has(key)) return false;
	this.set(key, value);
	return true;
};

export { };
