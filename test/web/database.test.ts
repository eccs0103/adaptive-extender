"use strict";

import "adaptive-extender/web";
import { Model, Field, Any } from "adaptive-extender/web";
import { describe, it, expect } from "vitest";

class Note {
	id: string;
	text: string;

	constructor(id: string, text: string) {
		this.id = id;
		this.text = text;
	}

	static import(source: any, name: string): Note {
		if (typeof source !== "object" || source === null) throw new TypeError(`Invalid source for ${name}`);
		if (typeof source.id !== "string") throw new TypeError("Missing or invalid 'id'");
		if (typeof source.text !== "string") throw new TypeError("Missing or invalid 'text'");
		return new Note(source.id, source.text);
	}

	static export(instance: Note): any {
		return { id: instance.id, text: instance.text };
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

describe("Database", () => {
	it("should expose its name and open tables", () => {
		const database = indexedDB.openDatabase("database");
		const table = database.openTable("notes", Note, "id");

		expect(database.name).toBe("database");
		expect(table.name).toBe("notes");
	});

	it("should add a second table to an open database and keep the first one working", async () => {
		const database = indexedDB.openDatabase(unique());
		const notes = database.openTable("notes", Note, "id");
		await notes.insert(new Note("a", "one"));

		const archive = database.openTable("archive", Note, "id");
		await archive.insert(new Note("a", "two"));

		expect(await notes.select("a")).toEqual(new Note("a", "one"));
		expect(await archive.select("a")).toEqual(new Note("a", "two"));
	});

	it("should read a table created with out-of-line keys at version 1", async () => {
		const name = unique();
		const request = indexedDB.open(name, 1);
		request.onupgradeneeded = event => request.result.createObjectStore("Library");
		const connection: IDBDatabase = await raw(request);
		const transaction = connection.transaction("Library", "readwrite");
		transaction.objectStore("Library").put({ id: "sheet-1", text: "Existing" }, "sheet-1");
		await new Promise(resolve => transaction.oncomplete = resolve);
		connection.close();

		const table = indexedDB.openDatabase(name).openTable("Library", Note, "id");

		expect(await table.select("sheet-1")).toEqual(new Note("sheet-1", "Existing"));
		await table.insert(new Note("sheet-2", "Added"));
		expect(await table.count()).toBe(2);
	});

	it("should reject a table that uses in-line keys", async () => {
		const name = unique();
		const request = indexedDB.open(name, 1);
		request.onupgradeneeded = event => request.result.createObjectStore("Library", { keyPath: "id" });
		const connection: IDBDatabase = await raw(request);
		connection.close();

		const table = indexedDB.openDatabase(name).openTable("Library", Note, "id");

		await expect(table.count()).rejects.toThrow(TypeError);
	});
});

describe("Table", () => {
	it("should insert, select, update and delete a row", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");

		await table.insert(new Note("a", "first"));
		expect(await table.select("a")).toEqual(new Note("a", "first"));

		await table.update(new Note("a", "second"));
		expect(await table.select("a")).toEqual(new Note("a", "second"));

		await table.delete("a");
		expect(await table.select("a")).toBeNull();
	});

	it("should restore rows as model instances", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");

		await table.insert(new Note("a", "text"));

		expect(await table.select("a")).toBeInstanceOf(Note);
	});

	it("should reject inserting a row whose key exists", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");
		await table.insert(new Note("a", "first"));

		await expect(table.insert(new Note("a", "second"))).rejects.toThrow();
		expect(await table.select("a")).toEqual(new Note("a", "first"));
	});

	it("should reject updating a missing row", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");

		await expect(table.update(new Note("missing", "text"))).rejects.toThrow(ReferenceError);
		expect(await table.count()).toBe(0);
	});

	it("should insert, update and delete batches in key order", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");

		await table.insert([new Note("b", "2"), new Note("a", "1"), new Note("c", "3")]);
		expect((await table.select()).map(note => note.id)).toEqual(["a", "b", "c"]);

		await table.update([new Note("a", "x"), new Note("b", "y")]);
		expect((await table.select()).map(note => note.text)).toEqual(["x", "y", "3"]);

		await table.delete(new Set(["a", "c"]));
		expect(await table.select()).toEqual([new Note("b", "y")]);
	});

	it("should store nothing from a batch that fails part way", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");
		await table.insert(new Note("b", "existing"));

		await expect(table.insert([new Note("a", "new"), new Note("b", "duplicate")])).rejects.toThrow();
		expect(await table.count()).toBe(1);

		await expect(table.update([new Note("b", "changed"), new Note("z", "missing")])).rejects.toThrow(ReferenceError);
		expect(await table.select("b")).toEqual(new Note("b", "existing"));
	});

	it("should reject a primary key that is not a string, a number or a date", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("notes", Note, "id");

		await expect(table.insert(new Note(true as any, "text"))).rejects.toThrow(TypeError);
	});

	it("should keep numeric keys and binary data by structured clone", async () => {
		const table = indexedDB.openDatabase(unique()).openTable("attachments", Attachment, "index");
		const attachment = new Attachment();
		attachment.index = 7;
		attachment.data = new Uint8Array([1, 2, 3]);

		await table.insert(attachment);

		const restored = await table.select(7);
		expect(restored).toBeInstanceOf(Attachment);
		expect(restored).not.toBeNull();
		if (restored === null) return;
		expect(ArrayBuffer.isView(restored.data)).toBe(true);
		expect(Array.from(restored.data)).toEqual([1, 2, 3]);
	});

	it("should report a row incompatible with the model as a SyntaxError", async () => {
		const name = unique();
		const notes = indexedDB.openDatabase(name).openTable("notes", Note, "id");
		await notes.count();
		const request = indexedDB.open(name);
		const connection: IDBDatabase = await raw(request);
		const transaction = connection.transaction("notes", "readwrite");
		transaction.objectStore("notes").put({ id: "broken", text: 42 }, "broken");
		await new Promise(resolve => transaction.oncomplete = resolve);
		connection.close();

		await expect(notes.select("broken")).rejects.toThrow(SyntaxError);
		await expect(notes.select()).rejects.toThrow(SyntaxError);
	});
});
