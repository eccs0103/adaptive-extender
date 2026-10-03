"use strict";

import "adaptive-extender/web";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Promise extensions", () => {
	describe("Promise.asTimeout", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should resolve after the specified timeout", async () => {
			const promise = Promise.asTimeout(1000);

			await vi.advanceTimersByTimeAsync(1000);

			await expect(promise).resolves.toBeUndefined();
		});

		it("should call clearTimeout in the finally block", async () => {
			const spy = vi.spyOn(globalThis, "clearTimeout");

			const promise = Promise.asTimeout(1000);
			await vi.advanceTimersByTimeAsync(1000);
			await promise;

			expect(spy).toHaveBeenCalled();
			spy.mockRestore();
		});
	});

	describe("Promise.withSignal", () => {
		it("should resolve the promise correctly", async () => {
			const promise = Promise.withSignal<string>((signal, resolve) => resolve("success"));
			await expect(promise).resolves.toBe("success");
		});

		it("should reject the promise correctly", async () => {
			const promise = Promise.withSignal((signal, resolve, reject) => reject("failure"));
			await expect(promise).rejects.toBe("failure");
		});

		it("should abort the signal after the promise resolves", async () => {
			let signal2: AbortSignal | undefined;

			const promise = Promise.withSignal<string>((signal, resolve) => {
				signal2 = signal;
				expect(signal.aborted).toBe(false);
				resolve("done");
			});

			await promise;

			expect(signal2).toBeDefined();
			expect(signal2?.aborted).toBe(true);
		});
	});
});
