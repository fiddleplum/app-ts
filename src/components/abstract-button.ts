import { Component } from '../component';

export abstract class AbstractButton extends Component {
	constructor(params: Component.Params) {
		super(params);

		// Register the events.
		this.registerEvent('press', params);
		this.registerEvent('release', params);
		this.registerEvent('hover', params);

		// Add the children to the button.
		for (const child of params.children) {
			this.root.appendChild(child);
		}
	}

	/** The event callback for when the mousemove happens. */
	private _mouseMove(event: MouseEvent): void {
		this.root.classList.add('hovered');
		const rect = this.root.getBoundingClientRect();
		this.triggerEvent('hover', event.clientX - rect.left, event.clientY - rect.top);
	}

	/** The event callback for when the mouseout happens. */
	private _mouseOut(): void {
		this.root.classList.remove('hovered');
		this.triggerEvent('hover', Number.NaN, Number.NaN);
	}

	/** Returns true if the coordinates are over the button. */
	protected _isOver(x: number, y: number): boolean {
		const rect = this.root.getBoundingClientRect();
		return rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom;
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected abstract _mouseTouchDown(): void;
}

AbstractButton.html = /* html */`<div onmousedown="_mouseTouchDown" ontouchstart="_mouseTouchDown" onmousemove="_mouseMove" onmouseout="_mouseOut"></div>`;

AbstractButton.css = /* css */`
	.AbstractButton {
		cursor: pointer;
	}
	`;

AbstractButton.register();
