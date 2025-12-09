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
			const timeoutPromise = Promise.asTimeout(1000);

			await vi.advanceTimersByTimeAsync(1000);

			await expect(timeoutPromise).resolves.toBeUndefined();
		});

		it("should call clearTimeout in the finally block", async () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			const timeoutPromise = Promise.asTimeout(1000);
			await vi.advanceTimersByTimeAsync(1000);
			await timeoutPromise;

			expect(clearTimeoutSpy).toHaveBeenCalled();
			clearTimeoutSpy.mockRestore();
		});
	});

	describe("Promise.withSignal", () => {
		it("should resolve the promise correctly", async () => {
			const promise = Promise.withSignal(
				(signal, resolve) => resolve("success")
			);
			await expect(promise).resolves.toBe("success");
		});

		it("should reject the promise correctly", async () => {
			const promise = Promise.withSignal(
				(signal, resolve, reject) => reject("failure")
			);
			await expect(promise).rejects.toBe("failure");
		});

		it("should abort the signal after the promise resolves", async () => {
			let signalInCallback: AbortSignal | undefined;

			const promise = Promise.withSignal((signal, resolve) => {
				signalInCallback = signal;
				expect(signal.aborted).toBe(false);
				resolve("done");
			});

			await promise;

			expect(signalInCallback).toBeDefined();
			expect(signalInCallback!.aborted).toBe(true);
		});
	});
});
