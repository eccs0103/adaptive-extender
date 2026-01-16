"use strict";

//#region Constructor
/**
 * Represents a generic class constructor.
 */
export type Constructor = abstract new (...args: any[]) => any;
//#endregion
//#region Importable constructor
/**
 * Represents a constructor that supports importing instances from a source.
 */
export interface ImportableConstructor extends Constructor {
	/**
	 * Imports an instance from a source.
	 * @param source The source value to import.
	 * @param name The name of the source value.
	 * @throws {TypeError} If the source is not of the expected type.
	 */
	import(source: any, name: string): InstanceType<this>;
}
//#endregion
//#region Exportable constructor
/**
 * Represents a constructor that supports exporting instances to a scheme.
 * @template S The type of scheme.
 */
export interface ExportableConstructor<S = any> extends Constructor {
	/**
	 * Exports an instance to a source.
	 * @param source The instance to export.
	 */
	export(source: InstanceType<this>): S;
}
//#endregion
//#region Portable constructor
/**
 * Represents a constructor that supports facilitating the safe conversion between anonymous schemes and typed instances.
 * @template S The type of scheme.
 */
export interface PortableConstructor<S = any> extends ImportableConstructor, ExportableConstructor<S>, Constructor {
}
//#endregion
