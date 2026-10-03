"use strict";

import "adaptive-extender/worker";
import { Model, Field } from "adaptive-extender/worker";
import { describe, it, expect } from "vitest";

class Counter extends Model {
	@Field(String)
	id: string;

	@Field(Number)
	value: number;

	constructor();
	constructor(id: string, value: number);
	constructor(id?: string, value?: number) {
		if (id === undefined || value === undefined) {
			super();
			return;
		}
		super();
		this.id = id;
		this.value = value;
	}
}

describe("Stores in workers", () => {
	it("should open a raw store and keep its records", async () => {
		const store = indexedDB.openStore(`worker-${crypto.randomUUID()}`, "records");

		await store.insert("key", "value");

		expect(await store.select("key")).toBe("value");
	});

	it("should open a portable store and keep its rows", async () => {
		const store = indexedDB.openPortableStore(`worker-${crypto.randomUUID()}`, "counters", Counter, "id");

		await store.insert(new Counter("hits", 3));
		await store.update(new Counter("hits", 4));

		expect(await store.select("hits")).toEqual(new Counter("hits", 4));
		expect(await store.count()).toBe(1);
	});
});
