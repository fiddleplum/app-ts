/** A library of array sorting functions. */
export class Sort {
	/** Gets the least index of the sorted array that is greater than or equal to the key, or the
	 *  last index if all keys are less. O(log n). */
	static getIndex<ValueType, KeyType>(key: KeyType, array: ValueType[], isLess: (lhs: ValueType, rhs: KeyType) => boolean): number {
		let low = 0;
		let high = array.length;
		while (low < high) {
			const mid = (low + high) >>> 1;
			if (isLess(array[mid], key)) {
				low = mid + 1;
			}
			else {
				high = mid;
			}
		}
		return low;
	}

	/** Returns true if the key was found in the sorted array. */
	static has<ValueType, KeyType>(key: KeyType, array: ValueType[], isLess: (lhs: ValueType, rhs: KeyType) => boolean, isEqual: (lhs: ValueType, rhs: KeyType) => boolean): boolean {
		const index = this.getIndex(key, array, isLess);
		if (index < array.length && isEqual(array[index], key)) {
			return true;
		}
		return false;
	}

	/** Adds the value into the sorted array. */
	static add<ValueType>(value: ValueType, array: ValueType[], isLess: (lhs: ValueType, rhs: ValueType) => boolean): void {
		const index = this.getIndex(value, array, isLess);
		array.splice(index, 0, value);
	}

	/** Adds the value into the sorted array, if it hasn't already been added. Returns true if was added. */
	static addIfUnique<ValueType>(value: ValueType, array: ValueType[], isLess: (lhs: ValueType, rhs: ValueType) => boolean, isEqual: (lhs: ValueType, rhs: ValueType) => boolean): boolean {
		const index = this.getIndex(value, array, isLess);
		if (index < array.length && isEqual(array[index], value)) {
			return false;
		}
		array.splice(index, 0, value);
		return true;
	}

	/** Removes the key's value from the sorted array. Returns true if the key was found. */
	static remove<ValueType, KeyType>(key: KeyType, array: ValueType[], isLess: (lhs: ValueType, rhs:KeyType) => boolean, isEqual: (lhs: ValueType, rhs: KeyType) => boolean): boolean {
		const index = this.getIndex(key, array, isLess);
		if (index < array.length && isEqual(array[index], key)) {
			array.splice(index, 1);
			return true;
		}
		return false;
	}

	/** Sorts the values in the array based on the *isLess* function. Uses insertion sort. */
	static sort<ValueType>(array: ValueType[], isLess: (lhs: ValueType, rhs: ValueType) => boolean): void {
		if (array.length === 0) {
			return;
		}
		let n = 1;
		while (n < array.length) {
			let m = n - 1;
			while (m >= 0 && isLess(array[n], array[m])) {
				const t = array[m];
				array[m] = array[m + 1];
				array[m + 1] = t;
				m--;
			}
			n++;
		}
	}
}
