/** Returns true if *obj* has the property *key*, including in its prototype chain.
 * Typescript then recognizes the value properly and doesn't give an error. */
export function isIn<O extends Record<K, unknown>, K extends PropertyKey>(obj: O, key: K): obj is O & Record<K, unknown> {
	return key in obj;
}
