import "adaptive-extender/core";
import { ArrayOf, Deferred, Descendant, DiscriminatorKey, Field, Nullable, Optional, Model, Any, Timestamp, UnixSeconds, SetOf } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

// --- Models for Testing ---

class SimpleModel extends Model {
	@Field(String)
	name!: string;

	@Field(Number, "age_value")
	age!: number;
}

class ComplexModel extends Model {
	@Field(SimpleModel)
	child!: SimpleModel;

	@Field(ArrayOf(String))
	tags!: string[];

	@Field(Nullable(Number))
	score!: number | null;

	@Field(Optional(Boolean))
	active?: boolean;
}

// Recursive/Deferred Model
class Node extends Model {
	@Field(String)
	id!: string;

	@Field(ArrayOf(Deferred(_ => Node)))
	children!: Node[];
}

// Polymorphic Models
interface AnimalScheme {
	name: string;
}

@Descendant(Deferred(_ => Dog))
@Descendant(Deferred(_ => Cat))
abstract class Animal extends Model {
	@Field(String)
	name!: string;
}

class Dog extends Animal {
	@Field(String)
	breed!: string;
}

class Cat extends Animal {
	@Field(Boolean)
	indoor!: boolean;
}

class Shelter extends Model {
	@Field(ArrayOf(Deferred<Animal, AnimalScheme>(_ => Animal)))
	animals!: Animal[];
}

// Custom Discriminator Models
@Descendant(Deferred(_ => CustomTypeA), "type-a")
@Descendant(Deferred(_ => CustomTypeB), "type-b")
abstract class CustomBase extends Model {
	@Field(String)
	id!: string;
}

class CustomTypeA extends CustomBase {
	@Field(String)
	valueA!: string;
}

class CustomTypeB extends CustomBase {
	@Field(Number)
	valueB!: number;
}


// Custom Discriminator Key Models
@DiscriminatorKey("kind")
@Descendant(Deferred(_ => Notification), "msg")
@Descendant(Deferred(_ => Alert), "alert")
abstract class Event extends Model {
	@Field(Number)
	timestamp!: number;
}

class Notification extends Event {
	@Field(String)
	message!: string;
}

class Alert extends Event {
	@Field(Number)
	level!: number;
}

describe("Model Tests", () => {

	describe("Basic Field Mapping", () => {
		it("should import simple fields", () => {
			const raw = { name: "John", age_value: 30 };
			const model = SimpleModel.import(raw, "test");
			
			expect(model).toBeInstanceOf(SimpleModel);
			expect(model.name).toBe("John");
			expect(model.age).toBe(30);
		});

		it("should export simple fields", () => {
			const model = new SimpleModel();
			model.name = "Jane";
			model.age = 25;

			const raw = SimpleModel.export(model);
			expect(raw).toEqual({
				name: "Jane",
				age_value: 25
			});
		});

		it("should throw on missing required fields during import", () => {
			const raw = { name: "John" }; // Missing age_value
			// Note: The behavior depends on Number.import throwing when undefined is passed
			expect(() => SimpleModel.import(raw, "test")).toThrow(); 
		});
	});

	describe("Complex Types (ArrayOf, Nullable, Optional)", () => {
		it("should handle nested models and arrays", () => {
			const raw = {
				child: { name: "Kid", age_value: 5 },
				tags: ["one", "two"],
				score: 100,
				active: true
			};
			const model = ComplexModel.import(raw, "complex");

			expect(model.child).toBeInstanceOf(SimpleModel);
			expect(model.child.name).toBe("Kid");
			expect(model.tags).toEqual(["one", "two"]);
			expect(model.score).toBe(100);
			expect(model.active).toBe(true);
		});

		it("should handle nullable fields", () => {
			const raw = {
				child: { name: "Ghost", age_value: 999 },
				tags: [],
				score: null
				// active is optional/undefined
			};
			const model = ComplexModel.import(raw, "complex");
			expect(model.score).toBeNull();
			expect(model.active).toBeUndefined();
		});

		it("should export complex structures", () => {
			const model = new ComplexModel();
			model.child = new SimpleModel();
			model.child.name = "Baby";
			model.child.age = 1;
			model.tags = ["a"];
			model.score = null;
			model.active = undefined;

			const raw: any = ComplexModel.export(model);
			expect(raw.child).toBeDefined();
			expect(raw.child.name).toBe("Baby");
			expect(raw.tags).toEqual(["a"]);
			expect(raw.score).toBeNull();
			expect(raw.active).toBeUndefined();
		});
	});

	describe("Deferred / Recursive Models", () => {
		it("should valid self-referencing models", () => {
			const raw = {
				id: "root",
				children: [
					{ id: "c1", children: [] },
					{ id: "c2", children: [{ id: "c2.1", children: [] }] }
				]
			};

			const root = Node.import(raw, "tree");
			expect(root).toBeInstanceOf(Node);
			expect(root.children).toHaveLength(2);
			expect(root.children[0]).toBeInstanceOf(Node);
			expect(root.children[1].children[0].id).toBe("c2.1");
		});
	});

	describe("Polymorphism (Descendants)", () => {
		it("should import correct subclass based on $type", () => {
			const raw = {
				animals: [
					{ $type: "Dog", name: "Buddy", breed: "Golden" },
					{ $type: "Cat", name: "Whiskers", indoor: true }
				]
			};

			const shelter = Shelter.import(raw, "shelter");
			expect(shelter.animals).toHaveLength(2);
			
			const dog = shelter.animals[0];
			const cat = shelter.animals[1];

			expect(dog).toBeInstanceOf(Dog);
			expect((dog as Dog).breed).toBe("Golden");

			expect(cat).toBeInstanceOf(Cat);
			expect((cat as Cat).indoor).toBe(true);
		});

		it("should throw on unknown discriminator", () => {
			const raw = {
				$type: "Bird",
				name: "Tweety"
			};
			expect(() => Animal.import(raw, "bird")).toThrow(`Unknown 'Bird' discriminator for bird`);
		});

		it("should export with $type discriminator", () => {
			const dog = new Dog();
			dog.name = "Rex";
			dog.breed = "Pug";

			const raw: any = Animal.export(dog);
			expect(raw.$type).toBe("Dog");
			expect(raw.breed).toBe("Pug");
		});
	});

	describe("Adapters", () => {
		describe("SetOf", () => {
			it("should identify as Set and convert elements", () => {
				expect(SetOf(String)[Symbol.hasInstance](new Set())).toBe(true);
				const raw = ["a", "b"];
				const set = SetOf(String).import(raw, "s");
				expect(set).toBeInstanceOf(Set);
				expect(Array.from(set)).toEqual(["a", "b"]);
			});

			it("should export Set to array", () => {
				const set = new Set(["x", "y"]);
				const arr = SetOf(String).export(set);
				expect(arr).toEqual(["x", "y"]);
			});

			it("should import Set of models", () => {
				const raw = [{ name: "S1", age_value: 10 }];
				const set = SetOf(SimpleModel).import(raw, "models");
				const first = Array.from(set)[0];
				expect(first).toBeInstanceOf(SimpleModel);
				expect((first as SimpleModel).name).toBe("S1");
			});
		});

		describe("Timestamp", () => {
			it("should identify as Timestamp", () => {
				expect(Timestamp.name).toBe("Timestamp");
				expect(Timestamp[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import number as Date", () => {
				const time = 1705752000000; // 2024-01-20T12:00:00.000Z
				const date = Timestamp.import(time, "ts");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(time);
			});

			it("should throw on invalid import type", () => {
				expect(() => Timestamp.import("invalid", "ts")).toThrow(TypeError);
			});

			it("should export Date as number (milliseconds)", () => {
				const time = 1705752000000;
				const date = new Date(time);
				expect(Timestamp.export(date)).toBe(time);
			});
		});

		describe("UnixSeconds", () => {
			it("should identify as UnixSeconds", () => {
				expect(UnixSeconds.name).toBe("UnixSeconds");
				expect(UnixSeconds[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import seconds number as Date", () => {
				const seconds = 1705752000; // 2024-01-20T12:00:00.000Z
				const date = UnixSeconds.import(seconds, "unix");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(seconds * 1000);
			});

			it("should throw on invalid import type", () => {
				expect(() => UnixSeconds.import("invalid", "unix")).toThrow(TypeError);
			});

			it("should export Date as number (seconds)", () => {
				const seconds = 1705752000;
				const date = new Date(seconds * 1000 + 500); // +500ms (should be truncated)
				expect(UnixSeconds.export(date)).toBe(seconds);
			});
		});

		describe("Any", () => {
			it("should identify as Any", () => {
				expect(Any.name).toBe("Any");
				expect(Any[Symbol.hasInstance]({})).toBe(true);
				expect(Any[Symbol.hasInstance](null)).toBe(true);
			});

			it("should pass through any value on import", () => {
				const obj = { context: "data" };
				expect(Any.import(obj, "any")).toBe(obj);
				expect(Any.import(123, "any")).toBe(123);
				expect(Any.import(null, "any")).toBe(null);
			});

			it("should pass through any value on export", () => {
				const obj = { context: "data" };
				expect(Any.export(obj)).toBe(obj);
			});
		});
	});

	describe("Custom Discriminator Polymorphism", () => {
		it("should export with custom discriminator", () => {
			const instance = new CustomTypeA();
			instance.id = "1";
			instance.valueA = "test";
			const exported = CustomBase.export<CustomBase, any>(instance);
			expect(exported.$type).toBe("type-a");
			expect(exported.id).toBe("1");
			expect(exported.valueA).toBe("test");
		});

		it("should import with custom discriminator", () => {
			const source = { $type: "type-b", id: "2", valueB: 123 };
			const instance = CustomBase.import(source, "root") as CustomTypeB;
			expect(instance).toBeInstanceOf(CustomTypeB);
			expect(instance.id).toBe("2");
			expect(instance.valueB).toBe(123);
		});

		it("should throw for unknown custom discriminator", () => {
			const source = { $type: "type-z", id: "3" };
			expect(() => CustomBase.import(source, "root")).toThrow(`Unknown 'type-z' discriminator for root`);
		});
	});

	describe("Custom Discriminator Key ($type override)", () => {
		it("should export with custom key 'kind'", () => {
			const notification = new Notification();
			notification.timestamp = 12345;
			notification.message = "Hello";

			const exported: any = Event.export(notification);
			expect(exported.kind).toBe("msg");
			expect(exported.$type).toBeUndefined();
			expect(exported.message).toBe("Hello");
		});

		it("should import with custom key 'kind'", () => {
			const source = { kind: "alert", timestamp: 555, level: 1 };
			const event = Event.import(source, "event") as Alert;
			expect(event).toBeInstanceOf(Alert);
			expect(event.level).toBe(1);
			expect(event.timestamp).toBe(555);
		});

		it("should throw if custom key is missing", () => {
			const source = { $type: "alert", timestamp: 555, level: 1 };
			// Should fail because it looks for 'kind', not '$type'
			expect(() => Event.import(source, "event")).toThrow("Missing 'kind' discriminator in event");
		});
	});

	describe("Validation Tests", () => {
		it("should throw error when Field is used on static property", () => {
			expect(() => {
				class InvalidModel extends Model {
					@Field(String)
					static staticField: string;
				}
				void InvalidModel;
			}).toThrow("Portable fields cannot be static");
		});
	});
});
