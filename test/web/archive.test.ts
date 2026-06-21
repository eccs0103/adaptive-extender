import "adaptive-extender/web";
import { Cell, PortableCell, BufferedCell } from "adaptive-extender/web";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// A Mock Portable Model that behaves correctly
class MockArchivable {
	value: number;
	name: string;

	constructor(value: number = 0, name: string = "") {
		this.value = value;
		this.name = name;
	}

	// PortableConstructor Interface Implementation
	static import(source: any, name: string): MockArchivable {
		if (typeof source !== "object" || source === null) {
			throw new TypeError(`Invalid source for ${name}`);
		}
		// Basic validation to simulate type checking
		if (typeof source.value !== "number") throw new TypeError("Missing or invalid 'value'");
		if (typeof source.name !== "string") throw new TypeError("Missing or invalid 'name'");

		return new MockArchivable(source.value, source.name);
	}

	static export(instance: MockArchivable): any {
		return {
			value: instance.value,
			name: instance.name
		};
	}
}

describe("PortableCell", () => {
	const KEY = "test_archive_key";

	beforeEach(() => {
		localStorage.clear();
	});

	it("should initialize with initial instance if storage is empty", () => {
		const initial = new MockArchivable(10, "init");
		const cell = localStorage.openPortableCell(KEY, MockArchivable, initial);

		expect(cell.content.value).toBe(10);
		expect(cell.content.name).toBe("init");

		// Should have persisted to localStorage immediately (or via Cell ctor)
		const raw = localStorage.getItem(KEY);
		expect(raw).toBeTruthy();
	});

	it("should restore from existing storage", () => {
		const data = { value: 99, name: "stored" };
		localStorage.setItem(KEY, JSON.stringify(data));

		const cell = localStorage.openPortableCell(KEY, MockArchivable, new MockArchivable(0, "default"));

		expect(cell.content.value).toBe(99);
		expect(cell.content.name).toBe("stored");
	});

	it("should persist changes when content setter is called", () => {
		const cell = localStorage.openPortableCell(KEY, MockArchivable, new MockArchivable(1, "a"));
		const next = new MockArchivable(2, "b");
		cell.content = next;

		const raw = localStorage.getItem(KEY);
		const parsed = JSON.parse(raw!);
		expect(parsed).toEqual({ value: 2, name: "b" });
	});

	it("should reset to initial state", () => {
		const initial = new MockArchivable(5, "start");
		const cell = localStorage.openPortableCell(KEY, MockArchivable, initial);

		cell.content = new MockArchivable(10, "change");
		expect(cell.content.value).toBe(10);

		cell.reset();
		expect(cell.content.value).toBe(5);
		expect(cell.content.name).toBe("start");
	});

	it("should throw TypeError during construction if instance is incompatible", () => {
		// Mock an instance that fails export/import cycle check
		class BadModel {
			static import(s: any) { return new BadModel(); }
			static export(i: any) { throw new Error("Export failed"); }
		}

		expect(() => {
			localStorage.openPortableCell(KEY, BadModel as any, new BadModel() as any);
		}).toThrow(TypeError);
	});

	it("should throw SyntaxError if storage is corrupted", () => {
		localStorage.setItem(KEY, "{ invalid json");
		const cell = localStorage.openPortableCell(KEY, MockArchivable, new MockArchivable(0, ""));

		expect(() => cell.content).toThrow(SyntaxError);
	});
});

describe("BufferedCell", () => {
	const KEY = "repo_key";

	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should provide access to in-memory content", () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(100, "repo"));
		expect(cell.content.value).toBe(100);
	});

	it("should save with delay (debounce)", () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(1, "start"));
		cell.content.value = 500;

		cell.save(1000);

		// Not saved yet
		let stored = JSON.parse(localStorage.getItem(KEY)!);
		expect(stored.value).toBe(1);

		// Run timers
		vi.advanceTimersByTime(1000);

		stored = JSON.parse(localStorage.getItem(KEY)!);
		expect(stored.value).toBe(500);
	});

	it("should resolve false when aborted", async () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(1, "start"));
		cell.content.value = 500;
		const savePromise = cell.save(1000);

		cell.abort();
		await expect(savePromise).resolves.toBe(false);
		vi.advanceTimersByTime(1000);

		// Should still be initial value in storage
		const stored = JSON.parse(localStorage.getItem(KEY)!);
		expect(stored.value).toBe(1);
	});

	it("should resolve false when superseded by a subsequent save", async () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(1, "start"));
		cell.content.value = 500;
		const firstSave = cell.save(1000);

		cell.content.value = 600;
		cell.save(500);

		await expect(firstSave).resolves.toBe(false);
	});

	it("should resolve true when save completes", async () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(1, "start"));
		cell.content.value = 500;
		const savePromise = cell.save(1000);

		vi.advanceTimersByTime(1000);
		await expect(savePromise).resolves.toBe(true);

		const stored = JSON.parse(localStorage.getItem(KEY)!);
		expect(stored.value).toBe(500);
	});

	it("should reset repository state", () => {
		const cell = localStorage.openBufferedCell(KEY, MockArchivable, new MockArchivable(1, "start"));
		cell.content.value = 999;

		cell.reset();

		expect(cell.content.value).toBe(1);
		const stored = JSON.parse(localStorage.getItem(KEY)!);
		expect(stored.value).toBe(1);
	});
});
