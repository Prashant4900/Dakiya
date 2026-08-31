/**
 * Safely copy text to the clipboard.
 * Uses navigator.clipboard if available (secure contexts like localhost/HTTPS),
 * falling back to document.execCommand("copy") for non-secure contexts (like local IP).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	// Try modern async clipboard API first
	if (navigator?.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			console.warn("navigator.clipboard failed, trying fallback...", err);
		}
	}

	// Fallback to legacy execCommand (works in non-secure HTTP contexts)
	try {
		const textArea = document.createElement("textarea");
		textArea.value = text;

		// Avoid scrolling to bottom
		textArea.style.top = "0";
		textArea.style.left = "0";
		textArea.style.position = "fixed";
		textArea.style.opacity = "0";

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		const successful = document.execCommand("copy");
		document.body.removeChild(textArea);

		return successful;
	} catch (err) {
		console.error("Fallback clipboard copy failed", err);
		return false;
	}
}
