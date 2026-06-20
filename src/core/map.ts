"use strict";

import { type PortableConstructor } from "./portable.js";

//#region Map
declare global {
	export interface MapConstructor {
		/**
		 * Creates a portable wrapper for maps with string keys, converting them to and from plain objects.
		 * @param type The portable type of the map values.
		 */
		AsRecord<I, S>(type: PortableConstructor<I, S>): PortableConstructor<Map<string, I>, Record<string, S>>;
		/**
		 * Creates a portable wrapper for maps with arbitrary key and value types, converting them to and from arrays of `[key, value]` tuples.
		 * @param typeKey The portable type of the map keys.
		 * @param typeValue The portable type of the map values.
		 */
		AsTuples<IK, SK, IV, SV>(typeKey: PortableConstructor<IK, SK>, typeValue: PortableConstructor<IV, SV>): PortableConstructor<Map<IK, IV>, [SK, SV][]>;
	}

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

Map.AsRecord = function <I, S>(type: PortableConstructor<I, S>): PortableConstructor<Map<string, I>, Record<string, S>> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Map[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Map<string, ${type.name}>`;
		},

		import(source: any, name: string): Map<string, I> {
			const record = Object.import(source, name) as Record<string, unknown>;
			const map = new Map<string, I>();
			for (const key of Object.keys(record)) {
				map.set(key, type.import(Reflect.get(record, key), `${name}[${JSON.stringify(key)}]`));
			}
			return map;
		},

		export(source: Map<string, I>): Record<string, S> {
			const record: Record<string, S> = {};
			for (const [key, value] of source) {
				Reflect.set(record, key, type.export(value));
			}
			return record;
		},
	} as PortableConstructor<Map<string, I>, Record<string, S>>;
};

Map.AsTuples = function <IK, SK, IV, SV>(typeKey: PortableConstructor<IK, SK>, typeValue: PortableConstructor<IV, SV>): PortableConstructor<Map<IK, IV>, [SK, SV][]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Map[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Map<${typeKey.name}, ${typeValue.name}>`;
		},

		import(source: any, name: string): Map<IK, IV> {
			return new Map<IK, IV>(Array.import(source, name).map((item, index) => {
				const tuple = Array.import(item, `${name}[${index}]`);
				const key = typeKey.import(tuple[0], `${name}[${index}][0]`);
				const value = typeValue.import(tuple[1], `${name}[${index}][1]`);
				return [key, value] as [IK, IV];
			}));
		},

		export(source: Map<IK, IV>): [SK, SV][] {
			return Array.from(source, ([key, value]) => [typeKey.export(key), typeValue.export(value)] as [SK, SV]);
		},
	} as PortableConstructor<Map<IK, IV>, [SK, SV][]>;
};

Map.prototype.add = function <K, V>(this: Map<K, V>, key: K, value: V): boolean {
	if (this.has(key)) return false;
	this.set(key, value);
	return true;
};
//#endregion
