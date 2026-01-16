"use strict";

export * from "./global.js";
export * from "./primitives.js";
export * from "./number.js";
export * from "./string.js";
export * from "./boolean.js";
export * from "./date.js";
export * from "./math.js";
export * from "./array.js";
export * from "./object.js";
export * from "./reflect.js";
export * from "./portable.js";
export * from "./error.js";
export * from "./promise.js";
export * from "./random.js";
export * from "./color.js";
export * from "./vector.js";
export * from "./vector-1.js";
export * from "./vector-2.js";
export * from "./vector-3.js";
export * from "./timespan.js";
export * from "./engine.js";
export * from "./controller.js";

"use strict";
import { PolymorphicBase, Portable, Scheme } from "./decorators.js";

//#region Base model
@Portable
@PolymorphicBase(DerivedModel)
export abstract class BaseModel {
	@Scheme(String, "value_1")
	value1: string;

	constructor() {
		if (new.target === BaseModel) throw new TypeError("Unable to create an instance of an abstract class");
	}
}
//#endregion
//#region Derived model
@Portable
export class DerivedModel extends BaseModel {
	@Scheme(Number, "value_2")
	value2: number;
}
//#endregion
