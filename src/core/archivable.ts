"use strict";

//#region Archivable prototype
/**
 * Defines the interface for an archivable object's prototype.
 * @template S The type of the notation returned by the export method.
 */
export interface ArchivablePrototype<S = any> {
	/**
	 * Creates a new instance of the archivable object.
	 */
	new(...args: any): any;
	/**
	 * Imports data from a source and returns a new instance.
	 * @throws {TypeError} If unable to import the source.
	 */
	import(source: any, name: string): InstanceType<this>;
	/**
	 * Exports the state of an instance to a notation.
	 */
	export(source: InstanceType<this>): S;
}
//#endregion
