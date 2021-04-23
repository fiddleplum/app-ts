import { Component } from '../component';

export class DragList extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Add the children to the list.
		for (const child of params.children) {
			if (!(child instanceof HTMLElement)) {
				throw new Error('All children of DragLists must be HTMLElements.');
			}
			const itemDiv = document.createElement('div');
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
		// Record the original margins of the list elements.
		this._topMargins.clear();
		for (const child of this.root.children) {
			this._topMargins.set(child as HTMLElement, (child as HTMLElement).style.marginTop);
		}
		// Make the dragged item have relative positioning.
		const parentBounds = this._draggedItem.parentElement!.getBoundingClientRect();
		const bounds = this._draggedItem.getBoundingClientRect();
		this._elemRefY = bounds.top - parentBounds.top;
		this._draggedItem.style.position = 'absolute';
		this._draggedItem.style.top = `${this._elemRefY}px`;
		this._draggedItem.style.width = `${bounds.width}px`;
		this._draggedItem.style.zIndex = '10';
		this._draggedItem.style.marginTop = '0';
		this.root.appendChild(this._draggedItem);
		// Record the height, including margins, of the dragged item.
		const marginBottom = this._getStyleValue(this._draggedItem, 'margin-bottom');
		this._draggedItemHeight = bounds.height + marginBottom;
		// Adjust the margins of the items.
		this._adjustMargins();
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
		// Adjust the margin of the other items.
		this._adjustMargins();
	}

	private _onRelease(_event: MouseEvent | TouchEvent): void {
		// Clean up the event listeners.
		window.removeEventListener('mousemove', this._onDrag);
		window.removeEventListener('mouseup', this._onRelease);
		// Place the item back.
		this._draggedItem!.style.position = '';
		this._draggedItem!.style.zIndex = '';
		this._draggedItem = undefined;
		// Revert the margins of the items to their original.
		this._adjustMargins();
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

	/** Adjusts the margins of the items so that there is gap where the dragged item would be placed. */
	private _adjustMargins(): void {
		// Find the item that the dragged item is before.
		let beforeItem: HTMLElement | undefined;
		if (this._draggedItem !== undefined) {
			const draggedItemBounds = this._draggedItem!.getBoundingClientRect();
			const middleOfDraggedItem = (draggedItemBounds.top + draggedItemBounds.bottom) / 2;
			for (const child of this.root.children) {
				if (child === this._draggedItem) {
					continue;
				}
				const bounds = child.getBoundingClientRect();
				const middleOfItem = (bounds.top + bounds.bottom) / 2;
				if (middleOfDraggedItem < middleOfItem) {
					beforeItem = child as HTMLElement;
					break;
				}
			}
		}
		// If it is a different item than the currently increased margin item,
		if (beforeItem !== this._itemWithIncreasedMargin) {
			// Restore the increased margin item to its original style.
			if (this._itemWithIncreasedMargin !== undefined) {
				this._itemWithIncreasedMargin.style.marginTop = this._topMargins.get(this._itemWithIncreasedMargin)!;
				if (this._itemWithIncreasedMargin.parentElement!.firstChild === this._itemWithIncreasedMargin) {
					this._elemRefY += this._draggedItemHeight;
				}
			}
			// Make the new increased margin item have an increased margin.
			this._itemWithIncreasedMargin = beforeItem;
			if (this._itemWithIncreasedMargin !== undefined) {
				const originalMargin = this._topMargins.get(this._itemWithIncreasedMargin);
				this._itemWithIncreasedMargin.style.marginTop = `calc(${this._draggedItemHeight}px${originalMargin !== '' ? ` + ${originalMargin}` : ''})`;
				if (this._itemWithIncreasedMargin.parentElement!.firstChild === this._itemWithIncreasedMargin) {
					this._elemRefY -= this._draggedItemHeight;
				}
			}
		}
	}

	private _getStyleValue(element: Element, property: string): number {
		return Number.parseFloat(window.getComputedStyle(element).getPropertyValue(property));
	}

	private _draggedItem: HTMLElement | undefined;
	private _draggedItemHeight: number = 0;
	private _itemWithIncreasedMargin: HTMLElement | undefined;
	private _topMargins: Map<HTMLElement, string> = new Map();
	private _elemRefY: number = 0;
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
