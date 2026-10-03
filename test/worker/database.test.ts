"use strict";

import "adaptive-extender/worker";
import { describe, it, expect } from "vitest";

class Counter {
	id: string;
	value: number;

	constructor(id: string, value: number) {
		this.id = id;
		this.value = value;
	}

	static import(source: any, name: string): Counter {
		if (typeof source !== "object" || source === null || typeof source.id !== "string" || typeof source.value !== "number") throw new TypeError(`Invalid source for ${name}`);
		return new Counter(source.id, source.value);
	}

	static export(instance: Counter): any {
		return { id: instance.id, value: instance.value };
	}
}

describe("Database in workers", () => {
	it("should open a table and keep its rows", async () => {
		const table = indexedDB.openDatabase(`worker-${crypto.randomUUID()}`).openTable("counters", Counter, "id");

		await table.insert(new Counter("hits", 3));
		await table.update(new Counter("hits", 4));

		expect(await table.select("hits")).toEqual(new Counter("hits", 4));
		expect(await table.count()).toBe(1);
	});
});
