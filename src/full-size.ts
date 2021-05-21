export class FullSize {
	static init(): void {
		// Do it once now.
		this._onResize();
		// Do it on every resize.
		window.addEventListener('resize', this._onResize);
	}

	private static _onResize(): void {
		const height = `${window.innerHeight}px`;
		document.documentElement.style.height = height;
		document.body.style.height = height;
	}
}
