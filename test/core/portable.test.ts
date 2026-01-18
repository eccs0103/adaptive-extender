import "adaptive-extender/core";
import { ArrayOf, Deferred, Descendant, Field, Nullable, Optional, PortableModel } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

// --- Models for Testing ---

class SimpleModel extends PortableModel {
	@Field(String)
	name!: string;

	@Field(Number, "age_value")
	age!: number;
}

class ComplexModel extends PortableModel {
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
class Node extends PortableModel {
	@Field(String)
	id!: string;

	@Field(ArrayOf(Deferred(() => Node)))
	children!: Node[];
}

// Polymorphic Models
@Descendant(Deferred(() => Dog))
@Descendant(Deferred(() => Cat))
abstract class Animal extends PortableModel {
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

class Shelter extends PortableModel {
	@Field(ArrayOf(Deferred(() => Animal)))
	animals!: Animal[];
}


describe("PortableModel Tests", () => {

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
				$type: "SimpleModel",
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
			expect(() => Animal.import(raw, "bird")).toThrow(TypeError);
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
});
