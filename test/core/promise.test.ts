import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Promise extensions", () => {
	describe("Promise.prototype.isSettled", () => {
		it("should be true for resolved promise", async () => {
			const p = Promise.resolve(42);
			await expect(p.isSettled).resolves.toBe(true);
		});

		it("should be true for rejected promise", async () => {
			const p = Promise.reject(new Error("fail"));
			// Catch the rejection to prevent unhandled promise rejection warnings
			p.catch(() => { });
			await expect(p.isSettled).resolves.toBe(true);
		});

		it("should be false for pending promise", async () => {
			let resolveFn: (v: number) => void;
			const p = new Promise<number>(resolve => { resolveFn = resolve; });
			const settled = await Promise.race([p.isSettled, Promise.resolve(false)]);
			expect(settled).toBe(false);
			resolveFn!(1);
		});
	});

	describe("Promise.prototype.isResolved", () => {
		it("should be true for resolved promise", async () => {
			const p = Promise.resolve("ok");
			await expect(p.isResolved).resolves.toBe(true);
		});

		it("should be false for rejected promise", async () => {
			const p = Promise.reject("fail");
			p.catch(() => { });
			await expect(p.isResolved).resolves.toBe(false);
		});
	});

	describe("Promise.prototype.isRejected", () => {
		it("should be false for resolved promise", async () => {
			const p = Promise.resolve("ok");
			await expect(p.isRejected).resolves.toBe(false);
		});

		it("should be true for rejected promise", async () => {
			const p = Promise.reject("fail");
			p.catch(() => { });
			await expect(p.isRejected).resolves.toBe(true);
		});
	});

	describe("Promise.prototype.value", () => {
		it("should return value for resolved promise", async () => {
			const p = Promise.resolve(123);
			await expect(p.value).resolves.toBe(123);
		});

		it("should throw error for rejected promise", async () => {
			const p = Promise.reject("fail");
			p.catch(() => { });
			await expect(p.value).rejects.toThrow(/Unable to get value of rejected promise/);
		});
	});

	describe("Promise.prototype.reason", () => {
		it("should return reason for rejected promise", async () => {
			const p = Promise.reject("fail");
			p.catch(() => { });
			await expect(p.reason).resolves.toBe("fail");
		});

		it("should throw error for resolved promise", async () => {
			const p = Promise.resolve("ok");
			await expect(p.reason).rejects.toThrow(/Unable to get reason of resolved promise/);
		});
	});
});
