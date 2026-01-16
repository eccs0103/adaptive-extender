import { POLYMORPHISM, SCHEMAS } from "./decorators.js";

export abstract class PortableModel {
	static import<T extends typeof PortableModel>(this: T, source: unknown, name: string): InstanceType<T> {
		const resolver = this[POLYMORPHISM];
		if (resolver !== undefined) {
			const subtypes = resolver();
			const object = Object.import(source, name);
			const typename = String.import(Reflect.get(object, "$type"), `${name}.$type`);
			const match = subtypes.find(subtype => subtype.name === typename) as T | undefined;
			if (match === undefined) throw new TypeError(`Unknown polymorphic type '${typename}' for '${this.name}'`);
			return match.import(source, name);
		}

		const object = Object.import(source, name);
		const instance: InstanceType<T> = Reflect.construct(this, []);
		let current = this;
		while (current && current !== PortableModel) {
			const schemas = current[SCHEMAS];
			for (const { key, mapping, type } of schemas) {
				const rawValue = Reflect.get(object, mapping);
				const importedValue = type.import(rawValue, `${name}.${mapping}`);
				Reflect.set(instance, key, importedValue);
			}
			current = Object.getPrototypeOf(current);
		}
		return instance;
	}

	static export(source: any): unknown {
		const resolver = this[POLYMORPHISM];
		if (resolver !== undefined) {
			const subtypes = resolver();
			for (const subtype of subtypes) {
				if (source instanceof subtype) return subtype.export(source);
			}
		}

		const result: any = Object();
		Reflect.set(result, "$type", this.name);
		let current = this;
		while (current && current !== PortableModel) {
			const schemas = current[SCHEMAS];
			for (const { key, mapping, type } of schemas) {
				const value = Reflect.get(source, key);
				const exportedValue = type.export(value);
				Reflect.set(result, mapping, exportedValue);
			}
			current = Object.getPrototypeOf(current);
		}
		return result;
	}
}
