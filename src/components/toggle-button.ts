import { Component } from '../component';
import { AbstractButton } from './abstract-button';

export class ToggleButton extends AbstractButton {
	constructor(params: Component.Params) {
		super(params);

		// Get the user press callback.
		const pressedValue = params.attributes.get('pressed');
		if (pressedValue === 'true') {
			// Add the pressed class.
			this.root.classList.add('pressed');
			// Set the state.
			this._pressed = true;
		}
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected _mouseTouchDown(): void {
		if (!this._pressed) {
			// Add the pressed class.
			this.root.classList.add('pressed');
			// Set the callback for when mouseup or touchend happens. It does nothing right now.
			this.setFocusReleaseCallback(() => {
			});
			// Set the state.
			this._pressed = true;
			// Call the user press callback.
			this.triggerEvent('press');
		}
		else {
			// Remove the pressed class.
			this.root.classList.remove('pressed');
			// Set the callback for when mouseup or touchend happens. It does nothing right now.
			this.setFocusReleaseCallback(() => {
			});
			// Set the state.
			this._pressed = false;
			// Call the user release callback.
			this.triggerEvent('release');
		}
	}

	/** The current state of the toggle button. */
	private _pressed: boolean = false;
}

ToggleButton.register();
