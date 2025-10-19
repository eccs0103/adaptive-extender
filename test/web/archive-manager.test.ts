import { ArchiveManager } from "adaptive-extender/web";
import { describe, it, expect, beforeEach } from "vitest";

// Mock Archivable class for testing
class MockArchivable {
	constructor(public value: string, public count: number) { }

	static import(data: { value: string, count: number }): MockArchivable {
		return new MockArchivable(data.value, data.count);
	}

	static export(instance: MockArchivable): { value: string, count: number } {
		return { value: instance.value, count: instance.count };
	}
}

describe("ArchiveManager", () => {
	const testKey = "test-archive-manager";
	const initialArgs: [string, number] = ["initial", 1];

	beforeEach(() => {
		localStorage.clear();
	});

	it("should initialize the archive with an exported new instance", () => {
		new ArchiveManager(testKey, MockArchivable, initialArgs);
		const storedData = JSON.parse(localStorage.getItem(testKey)!);
		expect(storedData).toEqual({ value: "initial", count: 1 });
	});

	describe("content getter/setter", () => {
		it("should get the content by importing from the archive", () => {
			const manager = new ArchiveManager(testKey, MockArchivable, initialArgs);
			const content = manager.content;
			expect(content).toBeInstanceOf(MockArchivable);
			expect(content.value).toBe("initial");
			expect(content.count).toBe(1);
		});

		it("should set the content by exporting to the archive", () => {
			const manager = new ArchiveManager(testKey, MockArchivable, initialArgs);
			const newContent = new MockArchivable("updated", 2);
			manager.content = newContent;

			const storedData = JSON.parse(localStorage.getItem(testKey)!);
			expect(storedData).toEqual({ value: "updated", count: 2 });

			const retrievedContent = manager.content;
			expect(retrievedContent.value).toBe("updated");
			expect(retrievedContent.count).toBe(2);
		});
	});

	describe("reset", () => {
		it("should reset the archive to a new instance with initial arguments", () => {
			const manager = new ArchiveManager(testKey, MockArchivable, initialArgs);

			// Modify the content first
			const modifiedContent = new MockArchivable("modified", 99);
			manager.content = modifiedContent;
			expect(manager.content.value).toBe("modified");

			// Now reset
			manager.reset();

			// Check if it's back to the initial state
			const contentAfterReset = manager.content;
			expect(contentAfterReset.value).toBe("initial");
			expect(contentAfterReset.count).toBe(1);

			const storedData = JSON.parse(localStorage.getItem(testKey)!);
			expect(storedData).toEqual({ value: "initial", count: 1 });
		});
	});
});
