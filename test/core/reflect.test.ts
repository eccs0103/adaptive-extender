import "adaptive-extender/core";
import { Nullable, Optional } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe('Nullable.map', () => {
	it('should return null if the value is null', () => {
		const result = Nullable.map(null, (v: number) => v + 1);
		expect(result).toBeNull();
	});

	it('should apply the callback if the value is not null', () => {
		const result = Nullable.map(5, (v: number) => v * 2);
		expect(result).toBe(10);
	});

	it('should treat undefined as a valid value and apply callback', () => {
		const result = Nullable.map(undefined, (v: undefined) => 'was undefined');
		expect(result).toBe('was undefined');
	});
});

describe('Optional.map', () => {
	it('should return undefined if the value is undefined', () => {
		const result = Optional.map(undefined, (v: number) => v + 1);
		expect(result).toBeUndefined();
	});

	it('should apply the callback if the value is not undefined', () => {
		const result = Optional.map(5, (v: number) => v * 2);
		expect(result).toBe(10);
	});

	it('should treat null as a valid value and apply callback', () => {
		const result = Optional.map(null, (v: null) => 'was null');
		expect(result).toBe('was null');
	});
});
