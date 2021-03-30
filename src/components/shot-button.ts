import { Component } from '../component';
import { AbstractButton } from './abstract-button';

export class ShotButton extends AbstractButton {
	constructor(params: Component.Params) {
		super(params);

		// Get the user press callback.
		const shotTimeValue = params.attributes.get('shottime');
		if (shotTimeValue !== undefined) {
			this._shotTime = Number.parseFloat(shotTimeValue);
			if (isNaN(this._shotTime)) {
				throw new Error('shottime is not a number-parsable string.');
			}
		}
	}

	/** The event callback for when the mousedown or touchstart happens. */
	protected _mouseTouchDown(): void {
		// Set the callback for when mouseup or touchend happens. It does nothing right now.
		this.setFocusReleaseCallback(() => {
		});
		if (this.root.classList.contains('pressed')) {
			// It's already pressed so do nothing until it releases.
			return;
		}
		// Add the pressed class.
		this.root.classList.add('pressed');
		// Call the user press callback.
		this.triggerEvent('press');
		setTimeout(() => {
			// Remove the pressed class.
			this.root.classList.remove('pressed');
			// Call the user release callback.
			this.triggerEvent('release');
		}, this._shotTime * 1000);
	}

	/** The shot time in seconds. */
	private _shotTime: number = 1;
}

ShotButton.register();
