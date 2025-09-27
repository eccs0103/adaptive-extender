import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Promise extensions", () => {
	describe("Promise.prototype.isSettled", () => {
		it("should be true for resolved promise", async () => {
			const p = Promise.resolve(42);
			assert.equal(await p.isSettled, true);
		});

		it("should be true for rejected promise", async () => {
			const p = Promise.reject(new Error("fail"));
			assert.equal(await p.isSettled, true);
		});

		it("should be false for pending promise", async () => {
			let resolveFn: (v: number) => void;
			const p = new Promise<number>(resolve => { resolveFn = resolve; });
			const settled = await Promise.race([p.isSettled, Promise.resolve(false)]);
			assert.equal(settled, false);
			resolveFn!(1);
		});
	});

	describe("Promise.prototype.isResolved", () => {
		it("should be true for resolved promise", async () => {
			const p = Promise.resolve("ok");
			assert.equal(await p.isResolved, true);
		});

		it("should be false for rejected promise", async () => {
			const p = Promise.reject("fail");
			assert.equal(await p.isResolved, false);
		});
	});

	describe("Promise.prototype.isRejected", () => {
		it("should be false for resolved promise", async () => {
			const p = Promise.resolve("ok");
			assert.equal(await p.isRejected, false);
		});

		it("should be true for rejected promise", async () => {
			const p = Promise.reject("fail");
			assert.equal(await p.isRejected, true);
		});
	});

	describe("Promise.prototype.value", () => {
		it("should return value for resolved promise", async () => {
			const p = Promise.resolve(123);
			assert.equal(await p.value, 123);
		});

		it("should throw error for rejected promise", async () => {
			const p = Promise.reject("fail");
			await assert.rejects(() => p.value, /Unable to get value of rejected promise/);
		});
	});

	describe("Promise.prototype.reason", () => {
		it("should return reason for rejected promise", async () => {
			const p = Promise.reject("fail");
			assert.equal(await p.reason, "fail");
		});

		it("should throw error for resolved promise", async () => {
			const p = Promise.resolve("ok");
			await assert.rejects(() => p.reason, /Unable to get reason of resolved promise/);
		});
	});
});