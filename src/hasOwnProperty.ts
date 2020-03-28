/** Returns true if *obj* has the property *key*. Typescript then recognizes the value properly
 * and doesn't give an error. */
export default function hasOwnProperty<O extends object, K extends PropertyKey>(obj: O, key: K): obj is O & Record<K, unknown> {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
