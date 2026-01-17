// import { ArchiveManager, ArchiveRepository } from "adaptive-extender/web";
import { describe, it, expect, beforeEach, vi } from "vitest";

class MockArchivable {
	constructor(public value: number, public name: string) { }

	static import(data: any): MockArchivable {
		if (typeof data?.value !== "number" || typeof data?.name !== "string") {
			throw new TypeError("Invalid data for MockArchivable");
		}
		return new MockArchivable(data.value, data.name);
	}

	static export(instance: MockArchivable): any {
		return { value: instance.value, name: instance.name };
	}
}

describe("ArchiveManager", () => {
	expect(true);

	const archiveKey = "test-archive";

	beforeEach(() => {
		localStorage.clear();
	});

	// it("should initialize with a new instance if archive is empty", () => {
	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 10, "initial");
	// 	const content = manager.content;

	// 	expect(content).toBeInstanceOf(MockArchivable);
	// 	expect(content.value).toBe(10);
	// 	expect(content.name).toBe("initial");
	// });

	// it("should load existing data from archive", () => {
	// 	// Pre-populate localStorage
	// 	const initialData = { value: 99, name: "existing" };
	// 	localStorage.setItem(archiveKey, JSON.stringify(initialData));

	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 0, "default");
	// 	const content = manager.content;

	// 	expect(content.value).toBe(99);
	// 	expect(content.name).toBe("existing");
	// });

	// it("should save content to the archive", () => {
	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 1, "one");
	// 	const newContent = new MockArchivable(2, "two");
	// 	manager.content = newContent;

	// 	const rawData = localStorage.getItem(archiveKey);
	// 	expect(rawData).not.toBeNull();
	// 	const parsedData = JSON.parse(rawData!);
	// 	expect(parsedData).toEqual({ value: 2, name: "two" });
	// });

	// it("should reset the archive to a new instance", () => {
	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 5, "original");
	// 	manager.content = new MockArchivable(50, "changed");

	// 	manager.reset();

	// 	const content = manager.content;
	// 	expect(content.value).toBe(5);
	// 	expect(content.name).toBe("original");
	// });

	// it("should throw SyntaxError if archive data is corrupted", () => {
	// 	localStorage.setItem(archiveKey, "this is not json");
	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 0, "default");

	// 	expect(() => manager.content).toThrow(SyntaxError);
	// 	expect(() => manager.content).toThrow(`Archive at key '${archiveKey}' is corrupted`);
	// });

	// it("should throw SyntaxError if imported data is invalid for the constructor", () => {
	// 	localStorage.setItem(archiveKey, JSON.stringify({ value: 123 })); // Missing 'name' property
	// 	const manager = new ArchiveManager(archiveKey, MockArchivable, 0, "default");

	// 	expect(() => manager.content).toThrow(SyntaxError);
	// 	expect(() => manager.content).toThrow(`Archive at key '${archiveKey}' is corrupted`);
	// });

	// it("should return the correct archive key", () => {
	// 	const manager = new ArchiveManager("another-key", MockArchivable, 0, "default");
	// 	expect(manager.key).toBe("another-key");
	// });
});

describe("ArchiveRepository", () => {
	const archiveKey = "repo-test-archive";

	beforeEach(() => {
		localStorage.clear();
		vi.useRealTimers();
	});

	// it("should initialize and get content", () => {
	// 	const repo = new ArchiveRepository(archiveKey, MockArchivable, 20, "repo-initial");
	// 	expect(repo.key).toBe(archiveKey);
	// 	const content = repo.content;
	// 	expect(content.value).toBe(20);
	// 	expect(content.name).toBe("repo-initial");
	// });

	// it("should save content after a delay", () => {
	// 	vi.useFakeTimers();
	// 	const repo = new ArchiveRepository(archiveKey, MockArchivable, 1, "one");
	// 	repo.content.value = 100;
	// 	repo.save();

	// 	// Should not have saved yet
	// 	const rawData = localStorage.getItem(archiveKey);
	// 	const parsedData = JSON.parse(rawData!);
	// 	expect(parsedData.value).toBe(1);

	// 	// Fast-forward time
	// 	vi.runAllTimers();

	// 	const finalRawData = localStorage.getItem(archiveKey);
	// 	const finalParsedData = JSON.parse(finalRawData!);
	// 	expect(finalParsedData.value).toBe(100);
	// });

	// it("should reset content", () => {
	// 	const repo = new ArchiveRepository(archiveKey, MockArchivable, 30, "original-repo");
	// 	repo.content.name = "modified";
	// 	repo.reset();

	// 	const content = repo.content;
	// 	expect(content.value).toBe(30);
	// 	expect(content.name).toBe("original-repo");
	// });

	// it("should abort a pending save operation", () => {
	// 	vi.useFakeTimers();
	// 	const repo = new ArchiveRepository(archiveKey, MockArchivable, 1, "one");
	// 	repo.content.value = 100;
	// 	repo.save(100); // Save with a delay

	// 	repo.abort(); // Abort the save

	// 	vi.runAllTimers(); // Try to execute the save

	// 	const rawData = localStorage.getItem(archiveKey);
	// 	const parsedData = JSON.parse(rawData!);
	// 	expect(parsedData.value).toBe(1); // The value should not have changed
	// });
});
