/** A generator of ids that are unique per instance of the class. */
class UniqueIds {
	/** The free ids. If there are no free ids, the next free id is the number used. */
	private freeIds: number[] = [];

	/** The number of used ids. */
	private numUsed = 0;

	/** Gets a unique id. */
	get(): number {
		let id = this.freeIds.pop();
		if (id === undefined) {
			id = this.numUsed;
		}
		this.numUsed += 1;
		return id;
	}

	/** Releases a previously gotten id. */
	release(id: number): void {
		this.freeIds.push(id);
		this.numUsed -= 1;
	}
}

export default UniqueIds;
