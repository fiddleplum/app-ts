import { Component } from '../component';

export class DragList extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the reordered callback.
		this._reinsertCallback = params.eventHandlers.get('reinsert');

		// Add the children to the list.
		for (const child of params.children) {
			if (!(child instanceof HTMLElement)) {
				throw new Error('All children of DragLists must be HTMLElements.');
			}
			const itemDiv = document.createElement('div');
			itemDiv.style.overflow = 'auto';
			itemDiv.appendChild(child);
			this.insertNode(this.root, null, itemDiv, params.parent);
		}

		// Bind the functions for the future calls.
		this._onGrab = this._onGrab.bind(this);
		this._onDrag = this._onDrag.bind(this);
		this._onRelease = this._onRelease.bind(this);

		// Setup all grabbing elements, those with the 'grab' class.
		const grabElements = this.root.querySelectorAll('.grab');
		for (const grabElement of grabElements) {
			grabElement.addEventListener('mousedown', this._onGrab);
		}
	}

	/** Grabs the list item given a grab element that is inside of it. */
	private _onGrab(event: MouseEvent | TouchEvent): void {
		// Get the item associated with the grab element.
		this._draggedItem = event.target as HTMLElement;
		while (this._draggedItem.parentNode !== this.root) {
			this._draggedItem = this._draggedItem.parentNode as HTMLElement;
		}
		// Record the mouse/touch position of the cursor.
		this._refY = this._getY(event);
		// Make the dragged item have relative positioning.
		const parentBounds = this._draggedItem.parentElement!.getBoundingClientRect();
		const bounds = this._draggedItem.getBoundingClientRect();
		this._elemRefY = bounds.top - parentBounds.top;
		this._draggedItem.style.position = 'absolute';
		this._draggedItem.style.top = `${this._elemRefY}px`;
		this._draggedItem.style.width = `${bounds.width}px`;
		this._draggedItem.style.zIndex = '1';
		// Record the height of the dragged item.
		this._draggedItemHeight = bounds.height;
		// Adjust the paddings of the items.
		this._adjustPaddings(false);
		// Enable the drag callbacks.
		window.addEventListener('mousemove', this._onDrag);
		window.addEventListener('mouseup', this._onRelease);
	}

	/** Drags the list item from its original position. */
	private _onDrag(event: MouseEvent | TouchEvent): void {
		// Get the position of the cursor.
		let y = this._getY(event);
		y -= this._refY;
		// Set the dragged item's position.
		this._draggedItem!.style.top = `${this._elemRefY + y}px`;
		// Adjust the padding of the other items.
		this._adjustPaddings(true);
	}

	private _onRelease(_event: MouseEvent | TouchEvent): void {
		// Clean up the event listeners.
		window.removeEventListener('mousemove', this._onDrag);
		window.removeEventListener('mouseup', this._onRelease);
		// See if the order changed at all by checking if the next siblings are the same.
		const changed = this._draggedItem!.nextSibling !== (this._itemWithIncreasedPadding ?? null);
		const draggedChild = this._draggedItem!.firstElementChild as HTMLElement;
		const beforeChild = (this._itemWithIncreasedPadding?.firstElementChild ?? undefined) as HTMLElement | undefined;
		// Place the item back.
		this._draggedItem!.style.position = '';
		this._draggedItem!.style.zIndex = '';
		this.root.insertBefore(this._draggedItem!, this._itemWithIncreasedPadding ?? null);
		this._draggedItem = undefined;
		// Revert the paddings of the items to their original.
		this._adjustPaddings(false);
		// Call the reordered callback if needed.
		if (this._reinsertCallback !== undefined && changed) {
			this._reinsertCallback(this, draggedChild, beforeChild);
		}
	}

	/** Returns the y value of the event. */
	private _getY(event: MouseEvent | TouchEvent): number {
		if (event instanceof MouseEvent) {
			return event.clientY;
		}
		else if (event instanceof TouchEvent) {
			if (event.touches.length > 0) {
				return event.touches[0].clientY;
			}
		}
		return NaN;
	}

	/** Adjusts the paddings of the items so that there is gap where the dragged item would be placed. */
	private _adjustPaddings(transition: boolean): void {
		// Find the item that the dragged item is before.
		let beforeItem: HTMLElement | undefined;
		if (this._draggedItem !== undefined) {
			const draggedItemBounds = this._draggedItem!.firstElementChild!.getBoundingClientRect();
			const middleOfDraggedItem = (draggedItemBounds.top + draggedItemBounds.bottom) / 2;
			for (const child of this.root.children) {
				if (child === this._draggedItem) {
					continue;
				}
				// Get the bounds of the actual list item.
				const bounds = child.firstElementChild!.getBoundingClientRect();
				// Compare the middle-y values and choose the before item based on where the cursor is.
				const middleOfItem = (bounds.top + bounds.bottom) / 2;
				if (middleOfDraggedItem <= middleOfItem) {
					beforeItem = child as HTMLElement;
					break;
				}
			}
		}
		// If it is a different item than the currently increased padding item,
		if (beforeItem !== this._itemWithIncreasedPadding) {
			// Restore the increased padding item to its original style.
			if (this._itemWithIncreasedPadding !== undefined) {
				this._itemWithIncreasedPadding.style.paddingTop = '';
				this._itemWithIncreasedPadding.style.transition = transition ? 'padding-top .25s' : '';
			}
			// Make the new increased padding item have an increased padding.
			this._itemWithIncreasedPadding = beforeItem;
			if (this._itemWithIncreasedPadding !== undefined) {
				this._itemWithIncreasedPadding.style.paddingTop = `${this._draggedItemHeight}px`;
				this._itemWithIncreasedPadding.style.transition = transition ? 'padding-top .25s' : '';
			}
		}
	}

	/** Gets the computed style of an element. */
	private _getComputedStyle(element: Element, property: string): number {
		return Number.parseFloat(window.getComputedStyle(element).getPropertyValue(property));
	}

	/** The callback called when an item is reinserted in a different location. */
	private _reinsertCallback: ((component: DragList, elem: HTMLElement, before: HTMLElement | undefined) => void) | undefined;

	/** The item currently being dragged. */
	private _draggedItem: HTMLElement | undefined;

	/** The height of the dragged item. */
	private _draggedItemHeight: number = 0;

	/** The item with increased padding that the dragged item, if let go, will be place before. */
	private _itemWithIncreasedPadding: HTMLElement | undefined;

	/** The dragged item's original y value. */
	private _elemRefY: number = 0;

	/** The cursor's original y value. */
	private _refY: number = 0;
}

DragList.html = /* html */`<div>
	</div>
	`;

DragList.css = /** css */`
	.DragList {
		position: relative;
	}
	.DragList > * {
		t2ransition: top .25s;
	}
	`;

DragList.register();
