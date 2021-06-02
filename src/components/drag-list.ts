import { Component } from '../component';

export class DragList extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Get the main elements for future use.
		this._draggedItemsElem = this.query('.dragged-items', HTMLElement)!;
		this._itemsElem = this.query('.items', HTMLElement)!;

		this.registerEvent('aftergrab', params);
		this.registerEvent('afterdrag', params);
		this.registerEvent('afterrelease', params);

		// Add the children to the list.
		for (const child of params.children) {
			if (!(child instanceof HTMLElement)) {
				throw new Error('All children of DragLists must be HTMLElements.');
			}
			this.insertNode(child, this._itemsElem, undefined, this.parent);
		}

		// Bind the functions for the future calls.
		this._onGrab = this._onGrab.bind(this);
		this._onDrag = this._onDrag.bind(this);
		this._onRelease = this._onRelease.bind(this);

		// Setup all grabbing elements, those with the 'grab' class.
		const grabElements = this._itemsElem.querySelectorAll('.grab');
		for (const grabElement of grabElements) {
			if (grabElement instanceof HTMLElement) {
				grabElement.addEventListener('mousedown', this._onGrab);
				grabElement.addEventListener('touchstart', this._onGrab);
			}
		}
	}

	/** Inserts an item before another. */
	insertItems(html: string, before: HTMLElement | undefined): void {
		if (before === undefined || before.parentNode === this._itemsElem) {
			const nodes = this.insertHtml(html, this._itemsElem, before, this.parent);
			for (const node of nodes) {
				if (node instanceof Element) {
					// Setup all grabbing elements, those with the 'grab' class.
					const grabElement = node.querySelector('.grab');
					if (grabElement instanceof HTMLElement) {
						grabElement.addEventListener('mousedown', this._onGrab);
						grabElement.addEventListener('touchstart', this._onGrab);
					}
				}
			}
		}
	}

	/** Removes an item. */
	removeItem(elem: HTMLElement): void {
		if (elem.parentNode === this._itemsElem) {
			this.removeNode(elem);
		}
	}

	/** Grabs the list item given a grab element that is inside of it. */
	private _onGrab(event: MouseEvent | TouchEvent): void {
		// Get the item associated with the grab element.
		this._draggedElem = event.target as HTMLElement;
		while (this._draggedElem.parentNode !== this._itemsElem) {
			this._draggedElem = this._draggedElem.parentNode as HTMLElement;
		}
		// Get the document y coordinate of the root for use as the origin.
		const rootBounds = this.root.getBoundingClientRect();
		this._rootElemRefY = rootBounds.top + window.scrollY;
		// Get the y coordinate of the dragged elem.
		const draggedElemBounds = this._draggedElem.getBoundingClientRect();
		this._draggedElemRefY = (draggedElemBounds.top + window.scrollY) - this._rootElemRefY;
		// Record the mouse/touch position of the cursor.
		this._refY = this._getY(event) + window.scrollY - this._rootElemRefY;
		// Make the dragged item have relative positioning.
		this._draggedItemsElem.style.position = 'absolute';
		this._draggedItemsElem.style.top = `${this._draggedElemRefY}px`;
		this._draggedItemsElem.style.zIndex = '1';
		// Record the height of the dragged item.
		this._draggedElemHeight = this._getHeight(this._draggedElem);
		// Put the dragged item into the dragged-item element.
		const beforeElem = this._draggedElem.nextElementSibling ?? undefined;
		this._draggedItemsElem.insertBefore(this._draggedElem, null);
		// Call the callback before anything is calculated or done.
		this.triggerEvent('aftergrab', this._draggedElem, beforeElem, event);
		// Adjust the paddings of the items.
		this._adjustMargins(false);
		// Find the most descendent scrollable element for use in scrolling to keep the elem in view.
		this._scrollableElem = this._draggedItemsElem;
		while (true) {
			if (this._scrollableElem === document.body) {
				break;
			}
			const overflowY = getComputedStyle(this._scrollableElem).overflowY;
			if (overflowY === 'scroll' || overflowY === 'auto') {
				break;
			}
			this._scrollableElem = this._scrollableElem!.parentElement!;
		}
		// Enable the drag callbacks.
		window.addEventListener('mousemove', this._onDrag);
		window.addEventListener('touchmove', this._onDrag);
		window.addEventListener('mouseup', this._onRelease);
		window.addEventListener('touchend', this._onRelease);
		event.preventDefault();
	}

	/** Drags the list item from its original position. */
	private _onDrag(event: MouseEvent | TouchEvent): void {
		// Get the position of the cursor.
		const y = this._getY(event) + window.scrollY - this._rootElemRefY;
		// Set the dragged elem's position.
		this._draggedItemsElem.style.top = `${this._draggedElemRefY + (y - this._refY)}px`;
		// Adjust the padding of the other items.
		this._adjustMargins(true);
		// Update the scroll so that the item stays in view.
		const draggedItemsBounds = this._draggedItemsElem.getBoundingClientRect();
		const scrollableBounds = this._scrollableElem!.getBoundingClientRect();
		if (draggedItemsBounds.top - draggedItemsBounds.height < scrollableBounds.top) {
			this._scrollableElem!.scrollTop += draggedItemsBounds.top - draggedItemsBounds.height - scrollableBounds.top;
		}
		else if (scrollableBounds.bottom < draggedItemsBounds.bottom + draggedItemsBounds.height) {
			this._scrollableElem!.scrollTop += draggedItemsBounds.bottom + draggedItemsBounds.height - scrollableBounds.bottom;
		}
		// Trigger the after drag event.
		this.triggerEvent('afterdrag', this._draggedElem!, event, this._beforeElem);
	}

	private _onRelease(event: MouseEvent | TouchEvent): void {
		// Clean up the event listeners.
		window.removeEventListener('mousemove', this._onDrag);
		window.removeEventListener('touchmove', this._onDrag);
		window.removeEventListener('mouseup', this._onRelease);
		window.removeEventListener('touchend', this._onRelease);
		// See if the order changed at all by checking if the next siblings are the same.
		const beforeItem = this._beforeElem;
		// Place the item back.
		const draggedItem = this._draggedElem!;
		this._draggedItemsElem!.style.position = '';
		this._draggedItemsElem!.style.zIndex = '';
		this._draggedItemsElem!.style.width = '';
		this._itemsElem.insertBefore(this._draggedElem!, beforeItem ?? null);
		this._draggedElem = undefined;
		// Revert the paddings of the items to their original.
		this._adjustMargins(false);
		// Trigger the after released event.
		this.triggerEvent('afterrelease', draggedItem, beforeItem);
		event.preventDefault();
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

	/** Gets the height of an element, including margins. */
	private _getHeight(elem: HTMLElement): number {
		const style = window.getComputedStyle(elem);
		return elem.offsetHeight + parseFloat(style['marginTop']) + parseFloat(style['marginBottom']);
	}

	/** Adjusts the paddings of the items so that there is gap where the dragged item would be placed. */
	private _adjustMargins(transition: boolean): void {
		// Find the item that the dragged item is before.
		let beforeItem: HTMLElement | undefined;
		if (this._draggedElem !== undefined) {
			const draggedItemBounds = this._draggedElem.getBoundingClientRect();
			for (const child of this._itemsElem.children) {
				// Get the bounds of the actual list item.
				const bounds = child.getBoundingClientRect();
				// Compare the middle-y values and choose the before item based on where the cursor is.
				if (draggedItemBounds.top <= bounds.top) {
					beforeItem = child as HTMLElement;
					break;
				}
			}
		}
		// If it is a different item than the currently increased padding item,
		if (beforeItem !== this._beforeElem) {
			// Restore the increased padding item to its original style.
			if (this._beforeElem !== undefined) {
				this._beforeElem.style.marginTop = '';
				this._beforeElem.style.transition = transition ? 'margin-top .25s' : '';
			}
			// Make the new increased padding item have an increased padding.
			this._beforeElem = beforeItem;
			if (this._beforeElem !== undefined) {
				this._beforeElem.style.marginTop = `${this._draggedElemHeight}px`;
				this._beforeElem.style.transition = transition ? 'margin-top .25s' : '';
			}
		}
	}

	/** The dragged-items element. */
	private _draggedItemsElem!: HTMLElement;

	/** The items element. */
	private _itemsElem!: HTMLElement;

	/** The item currently being dragged. */
	private _draggedElem: HTMLElement | undefined;

	/** The height of the dragged item. */
	private _draggedElemHeight: number = 0;

	/** The item with increased padding that the dragged item, if released, will be placed before. */
	private _beforeElem: HTMLElement | undefined;

	/** The parent of the item's original y value. */
	private _rootElemRefY: number = 0;

	/** The dragged item's original y value. */
	private _draggedElemRefY: number = 0;

	/** The cursor's original y value. */
	private _refY: number = 0;

	/** The most descendent scrollable element. */
	private _scrollableElem: HTMLElement | undefined;

}

DragList.html = /* html */`
	<div>
		<div class="dragged-items"></div>
		<div class="items"></div>
	</div>
	`;

DragList.css = /** css */`
	.DragList {
		position: relative;
		overflow: visible;
	}
	.DragList::before { /* Prevents the top margin from bothering the parent. */
		clear: both;
		content: "";
		display: table;
	}
	.DragList .dragged-items {
		overflow: visible;
		width: 100%;
	}
	.DragList .items { /* Prevents adjacent items from margin collapsing. */
		display: flex;
		flex-direction: column;
	}`;

DragList.register();
