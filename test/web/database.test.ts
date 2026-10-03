"use strict";

import "adaptive-extender/web";
import { Model, Field, Any } from "adaptive-extender/web";
import { describe, it, expect } from "vitest";

class Note extends Model {
	@Field(String)
	id: string;

	@Field(String)
	text: string;

	constructor();
	constructor(id: string, text: string);
	constructor(id?: string, text?: string) {
		if (id === undefined || text === undefined) {
			super();
			return;
		}
		super();
		this.id = id;
		this.text = text;
	}
}

class Attachment extends Model {
	@Field(Number)
	index: number;

	@Field(Any)
	data: Uint8Array;
}

function unique(): string {
	return `test-${crypto.randomUUID()}`;
}

function raw(request: IDBRequest): Promise<any> {
	return new Promise((resolve, reject) => {
		request.onsuccess = event => resolve(request.result);
		request.onerror = event => reject(request.error);
	});
}

async function seed(database: string, store: string, records: ReadonlyMap<IDBValidKey, unknown>): Promise<void> {
	const request = indexedDB.open(database, 1);
	request.onupgradeneeded = event => request.result.createObjectStore(store);
	const connection: IDBDatabase = await raw(request);
	const transaction = connection.transaction(store, "readwrite");
	for (const [key, value] of records) {
		transaction.objectStore(store).put(value, key);
	}
	await new Promise(resolve => transaction.oncomplete = resolve);
	connection.close();
}

describe("Store", () => {
	it("should read an existing store created with out-of-line keys at version 1", async () => {
		const database = unique();
		await seed(database, "Audiolist", new Map<IDBValidKey, unknown>([["track", "audio"], ["track.lrc", "lyrics"], [["nested"], "skipped"]]));

		const store = indexedDB.openStore(database, "Audiolist");

		expect(await store.select("track")).toBe("audio");
		expect(await store.select("missing")).toBeNull();
		expect(await store.select()).toEqual([["track", "audio"], ["track.lrc", "lyrics"]]);
		expect(await store.count()).toBe(3);
	});

	it("should take the key type from the template", async () => {
		const store = indexedDB.openStore<number>(unique(), "scores");

		await store.insert([[2, "second"], [1, "first"]]);
		await store.update(2, "changed");
		expect(await store.select()).toEqual([[1, "first"], [2, "changed"]]);

		await store.delete(1);
		expect(await store.select(1)).toBeNull();
		await expect(store.insert(Number.NaN, "invalid")).rejects.toThrow(TypeError);
	});

	it("should insert, update and delete a record", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await store.insert("key", { value: 1 });
		await store.update("key", { value: 2 });
		expect(await store.select("key")).toEqual({ value: 2 });

		await store.delete("key");
		expect(await store.select("key")).toBeNull();
	});

	it("should reject inserting an existing key and updating a missing one", async () => {
		const store = indexedDB.openStore(unique(), "records");
		await store.insert("key", "first");

		await expect(store.insert("key", "second")).rejects.toThrow();
		await expect(store.update("missing", "value")).rejects.toThrow(ReferenceError);
		expect(await store.select("key")).toBe("first");
	});

	it("should write and delete batches in one transaction", async () => {
		const store = indexedDB.openStore(unique(), "records");

		await store.insert([["b", 2], ["a", 1], ["c", 3]]);
		await store.update([["a", 10]]);
		expect(await store.select()).toEqual([["a", 10], ["b", 2], ["c", 3]]);

		await expect(store.insert([["d", 4], ["a", 0]])).rejects.toThrow();
		expect(await store.count()).toBe(3);

		await store.delete(["a", "c"]);
		expect(await store.select()).toEqual([["b", 2]]);
	});
});

describe("PortableStore", () => {
	it("should add a second store to an open database and keep the first one working", async () => {
		const database = unique();
		const notes = indexedDB.openPortableStore(database, "notes", Note, "id");
		await notes.insert(new Note("a", "one"));

		const archive = indexedDB.openPortableStore(database, "archive", Note, "id");
		await archive.insert(new Note("a", "two"));

		expect(await notes.select("a")).toEqual(new Note("a", "one"));
		expect(await archive.select("a")).toEqual(new Note("a", "two"));
	});

	it("should read an existing store created with out-of-line keys at version 1", async () => {
		const database = unique();
		await seed(database, "Library", new Map([["sheet-1", { id: "sheet-1", text: "Existing" }]]));

		const store = indexedDB.openPortableStore(database, "Library", Note, "id");

		expect(await store.select("sheet-1")).toEqual(new Note("sheet-1", "Existing"));
		await store.insert(new Note("sheet-2", "Added"));
		expect(await store.count()).toBe(2);
	});

	it("should reject a store that uses in-line keys", async () => {
		const database = unique();
		const request = indexedDB.open(database, 1);
		request.onupgradeneeded = event => request.result.createObjectStore("Library", { keyPath: "id" });
		const connection: IDBDatabase = await raw(request);
		connection.close();

		const store = indexedDB.openPortableStore(database, "Library", Note, "id");

		await expect(store.count()).rejects.toThrow(TypeError);
	});

	it("should insert, select, update and delete a row", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note, "id");

		await store.insert(new Note("a", "first"));
		expect(await store.select("a")).toEqual(new Note("a", "first"));
		expect(await store.select("a")).toBeInstanceOf(Note);

		await store.update(new Note("a", "second"));
		expect(await store.select("a")).toEqual(new Note("a", "second"));

		await store.delete("a");
		expect(await store.select("a")).toBeNull();
	});

	it("should reject inserting an existing row and updating a missing one", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note, "id");
		await store.insert(new Note("a", "first"));

		await expect(store.insert(new Note("a", "second"))).rejects.toThrow();
		await expect(store.update(new Note("missing", "text"))).rejects.toThrow(ReferenceError);
		expect(await store.select("a")).toEqual(new Note("a", "first"));
	});

	it("should insert, update and delete batches in key order", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note, "id");

		await store.insert([new Note("b", "2"), new Note("a", "1"), new Note("c", "3")]);
		expect((await store.select()).map(note => note.id)).toEqual(["a", "b", "c"]);

		await store.update([new Note("a", "x"), new Note("b", "y")]);
		expect((await store.select()).map(note => note.text)).toEqual(["x", "y", "3"]);

		await store.delete(new Set(["a", "c"]));
		expect(await store.select()).toEqual([new Note("b", "y")]);
	});

	it("should store nothing from a batch that fails part way", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note, "id");
		await store.insert(new Note("b", "existing"));

		await expect(store.insert([new Note("a", "new"), new Note("b", "duplicate")])).rejects.toThrow();
		expect(await store.count()).toBe(1);

		await expect(store.update([new Note("b", "changed"), new Note("z", "missing")])).rejects.toThrow(ReferenceError);
		expect(await store.select("b")).toEqual(new Note("b", "existing"));
	});

	it("should reject a primary key that is not a string, a number or a date", async () => {
		const store = indexedDB.openPortableStore(unique(), "notes", Note, "id");

		await expect(store.insert(new Note(true as any, "text"))).rejects.toThrow(TypeError);
	});

	it("should keep numeric keys and binary data by structured clone", async () => {
		const store = indexedDB.openPortableStore(unique(), "attachments", Attachment, "index");
		const attachment = new Attachment();
		attachment.index = 7;
		attachment.data = new Uint8Array([1, 2, 3]);

		await store.insert(attachment);

		const restored = await store.select(7);
		expect(restored).toBeInstanceOf(Attachment);
		if (restored === null) return;
		expect(ArrayBuffer.isView(restored.data)).toBe(true);
		expect(Array.from(restored.data)).toEqual([1, 2, 3]);
	});

	it("should report a row incompatible with the model as a SyntaxError", async () => {
		const database = unique();
		await seed(database, "notes", new Map([["broken", { id: "broken", text: 42 }]]));

		const store = indexedDB.openPortableStore(database, "notes", Note, "id");

		await expect(store.select("broken")).rejects.toThrow(SyntaxError);
		await expect(store.select()).rejects.toThrow(SyntaxError);
	});
});
