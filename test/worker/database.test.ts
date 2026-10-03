import "adaptive-extender/worker";
import { RecordStore, PortableStore } from "adaptive-extender/worker";
import { describe, it, expect } from "vitest";

class Counter {
	value: number;

	constructor(value: number) {
		this.value = value;
	}

	static import(source: any, name: string): Counter {
		if (typeof source !== "object" || source === null || typeof source.value !== "number") throw new TypeError(`Invalid source for ${name}`);
		return new Counter(source.value);
	}

	static export(instance: Counter): any {
		return { value: instance.value };
	}
}

describe("Database stores in workers", () => {
	it("should open and use a raw store", async () => {
		const store = indexedDB.openStore(`worker-${crypto.randomUUID()}`, "records");
		expect(store).toBeInstanceOf(RecordStore);

		await store.set("key", "value");

		expect(await store.get("key")).toBe("value");
	});

	it("should open and use a portable store", async () => {
		const store = indexedDB.openPortableStore(`worker-${crypto.randomUUID()}`, "counters", Counter);
		expect(store).toBeInstanceOf(PortableStore);

		await store.set("hits", new Counter(3));

		expect(await store.get("hits")).toEqual(new Counter(3));
	});
});
