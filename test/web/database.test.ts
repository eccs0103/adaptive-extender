"use strict";

import "adaptive-extender/web";
import { RecordStore, PortableStore } from "adaptive-extender/web";
import { describe, it, expect } from "vitest";

class Note {
	text: string;
	pinned: boolean;

	constructor(text: string, pinned: boolean) {
		this.text = text;
		this.pinned = pinned;
	}

	static import(source: any, name: string): Note {
		if (typeof source !== "object" || source === null) throw new TypeError(`Invalid source for ${name}`);
		if (typeof source.text !== "string") throw new TypeError("Missing or invalid 'text'");
		if (typeof source.pinned !== "boolean") throw new TypeError("Missing or invalid 'pinned'");
		return new Note(source.text, source.pinned);
	}

	static export(instance: Note): any {
		return { text: instance.text, pinned: instance.pinned };
	}
}

function unique(): string {
	return `test-${crypto.randomUUID()}`;
}

function raw(request: IDBRequest): Promise<any> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

describe("RecordStore", () => {
	it("should be opened through indexedDB.openStore", () => {
		const store = indexedDB.openStore("database", "store");
		expect(store).toBeInstanceOf(RecordStore);
		expect(store.database).toBe("database");
		expect(store.name).toBe("store");
	});

	it("should write, read, check and delete a record", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await store.set("alpha", { value: 1 });

		expect(await store.get("alpha")).toEqual({ value: 1 });
		expect(await store.has("alpha")).toBe(true);
		await store.delete("alpha");
		expect(await store.get("alpha")).toBeNull();
		expect(await store.has("alpha")).toBe(false);
	});

	it("should tell a stored null apart from a missing record", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await store.set("empty", null);

		expect(await store.get("empty")).toBeNull();
		expect(await store.has("empty")).toBe(true);
		expect(await store.has("missing")).toBe(false);
	});

	it("should keep dates, arrays and numeric keys by structured clone", async () => {
		const store = indexedDB.openStore(unique(), "records");
		const date = new Date("2026-10-03T00:00:00.000Z");

		await store.set(7, { date, list: [1, 2, 3] });

		const value: any = await store.get(7);
		expect(value.date).toBeInstanceOf(Date);
		expect(value.date.getTime()).toBe(date.getTime());
		expect(value.list).toEqual([1, 2, 3]);
	});

	it("should list keys, values and entries in key order", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await store.putAll(new Map<IDBValidKey, unknown>([["b", 2], ["a", 1], ["c", 3]]));

		expect(await store.keys()).toEqual(["a", "b", "c"]);
		expect(await store.values()).toEqual([1, 2, 3]);
		expect(Array.from(await store.entries())).toEqual([["a", 1], ["b", 2], ["c", 3]]);
		expect(await store.count()).toBe(3);
	});

	it("should delete several records and clear the store", async () => {
		const store = indexedDB.openStore(unique(), "records");
		await store.putAll(new Map<IDBValidKey, unknown>([["a", 1], ["b", 2], ["c", 3]]));

		await store.dropAll(["a", "c"]);
		expect(await store.keys()).toEqual(["b"]);

		await store.clear();
		expect(await store.count()).toBe(0);
	});

	it("should store nothing from a batch that fails part way", async () => {
		const store = indexedDB.openStore(unique(), "records");

		const batch = new Map<IDBValidKey, unknown>([["a", 1], ["b", () => 2], ["c", 3]]);

		await expect(store.putAll(batch)).rejects.toThrow();
		expect(await store.count()).toBe(0);
	});

	it("should reject a value that cannot be cloned", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await expect(store.set("function", () => 1)).rejects.toThrow();
		expect(await store.has("function")).toBe(false);
	});

	it("should add a second store to an open database and keep the first one working", async () => {
		const database = unique();
		const store = indexedDB.openStore(database, "first");
		const store2 = indexedDB.openStore(database, "second");

		await store.set("key", "one");
		await store2.set("key", "two");

		expect(await store.get("key")).toBe("one");
		expect(await store2.get("key")).toBe("two");
	});

	it("should read a database created with out-of-line keys at version 1", async () => {
		const database = unique();
		const request = indexedDB.open(database, 1);
		request.onupgradeneeded = () => request.result.createObjectStore("Library");
		const connection: IDBDatabase = await raw(request);
		const transaction = connection.transaction("Library", "readwrite");
		transaction.objectStore("Library").put({ title: "Existing" }, "sheet-1");
		await new Promise(resolve => transaction.oncomplete = resolve);
		connection.close();

		const store = indexedDB.openStore(database, "Library");

		expect(await store.get("sheet-1")).toEqual({ title: "Existing" });
		await store.set("sheet-2", { title: "Added" });
		expect(await store.keys()).toEqual(["sheet-1", "sheet-2"]);
	});
});

describe("PortableStore", () => {
	it("should be opened through indexedDB.openPortableStore", () => {
		const store = indexedDB.openPortableStore("database", "notes", Note);
		expect(store).toBeInstanceOf(PortableStore);
		expect(store.database).toBe("database");
		expect(store.name).toBe("notes");
	});

	it("should store and restore model instances", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note);

		await store.set("first", new Note("Hello", true));

		const note = await store.get("first");
		expect(note).toBeInstanceOf(Note);
		expect(note).toEqual(new Note("Hello", true));
		expect(await store.get("missing")).toBeNull();
	});

	it("should write a batch and list restored instances", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note);

		await store.putAll(new Map<IDBValidKey, Note>([["b", new Note("B", false)], ["a", new Note("A", true)]]));

		const values = await store.values();
		expect(values.every(value => value instanceof Note)).toBe(true);
		expect(values.map(value => value.text)).toEqual(["A", "B"]);
		const entries = await store.entries();
		expect(entries.get("b")).toEqual(new Note("B", false));
		expect(await store.keys()).toEqual(["a", "b"]);
		expect(await store.count()).toBe(2);
	});

	it("should store exported records readable by a raw store", async () => {
		const database = unique();
		const store = indexedDB.openPortableStore(database, "notes", Note);

		await store.set("first", new Note("Raw", false));

		expect(await indexedDB.openStore(database, "notes").get("first")).toEqual({ text: "Raw", pinned: false });
	});

	it("should report a record incompatible with the model as a SyntaxError", async () => {
		const database = unique();
		await indexedDB.openStore(database, "notes").set("broken", { text: 42 });
		const store = indexedDB.openPortableStore(database, "notes", Note);

		await expect(store.get("broken")).rejects.toThrow(SyntaxError);
		await expect(store.values()).rejects.toThrow(SyntaxError);
	});

	it("should delete and clear records", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note);
		await store.putAll(new Map<IDBValidKey, Note>([["a", new Note("A", true)], ["b", new Note("B", true)], ["c", new Note("C", true)]]));

		await store.delete("a");
		await store.dropAll(["b"]);
		expect(await store.keys()).toEqual(["c"]);
		expect(await store.has("c")).toBe(true);

		await store.clear();
		expect(await store.count()).toBe(0);
	});
});
