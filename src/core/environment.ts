"use strict";

import { type PortableConstructor } from "./portable.js";

//#region Environment
export interface Environment extends Record<string, string | undefined> {
}

export interface EnvironmentResolveOptions {
	name: string;
}

export class EnvironmentProvider {
	static resolve<M extends PortableConstructor<InstanceType<M>>>(environment: Environment, model: M): Readonly<InstanceType<M>>;
	static resolve<M extends PortableConstructor<InstanceType<M>>>(environment: Environment, model: M, options: Partial<EnvironmentResolveOptions>): Readonly<InstanceType<M>>;
	static resolve<M extends PortableConstructor<InstanceType<M>>>(environment: Environment, model: M, options: Partial<EnvironmentResolveOptions> = {}): Readonly<InstanceType<M>> {
		const record: Record<string, unknown> = {};
		for (const key of Object.keys(environment)) {
			record[key] = EnvironmentProvider.#parse(environment[key]);
		}
		const instance = model.import(record, options.name ?? model.name);
		return Object.freeze(instance);
	}

	static #parse(value: Environment[keyof Environment]): unknown {
		try {
			if (value === undefined) return value;
			return JSON.parse(value);
		} catch (reason) {
			if (reason instanceof SyntaxError) return value;
			throw reason;
		}
	}
}
//#endregion
