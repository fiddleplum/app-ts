import { AbstractButton } from './abstract-button';

export class PushButton extends AbstractButton {
	/** The event callback for when the mousedown or touchstart happens. */
	protected _mouseTouchDown(): void {
		// Add the pressed class.
		this.root.classList.add('pressed');
		// Set the callback for when mouseup or touchend happens.
		this.setFocusReleaseCallback(() => {
			// Remove the pressed class.
			this.root.classList.remove('pressed');
			// Call the user release callback.
			this.triggerEvent	('release');
		});
		// Call the user press callback.
		this.triggerEvent('press');
	}
}

PushButton.register();
