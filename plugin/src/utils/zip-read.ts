/**
 * Minimal ZIP reader for "store" method (no compression) ZIP files.
 * Designed to read ZIPs created by our own zip-download utility.
 */

interface ZipFileEntry {
	content: string;
	name: string;
}

/** Read a 16-bit unsigned little-endian value from a DataView. */
function readUint16LE(view: DataView, offset: number): number {
	return view.getUint16(offset, true);
}

/** Read a 32-bit unsigned little-endian value from a DataView. */
function readUint32LE(view: DataView, offset: number): number {
	return view.getUint32(offset, true);
}

/**
 * Extract text files from a ZIP archive (stored/no compression only).
 * Returns an array of { name, content } entries.
 */
export function readZip(buffer: ArrayBuffer): ZipFileEntry[] {
	const view = new DataView(buffer);
	const decoder = new TextDecoder("utf-8");
	const entries: ZipFileEntry[] = [];
	let offset = 0;

	while (offset < buffer.byteLength - 4) {
		const sig = readUint32LE(view, offset);

		// Local file header signature: 0x04034b50
		if (sig !== 0x04_03_4b_50) break;

		const compressionMethod = readUint16LE(view, offset + 8);
		const compressedSize = readUint32LE(view, offset + 18);
		const nameLength = readUint16LE(view, offset + 26);
		const extraLength = readUint16LE(view, offset + 28);

		const nameBytes = new Uint8Array(buffer, offset + 30, nameLength);
		const name = decoder.decode(nameBytes);

		const dataOffset = offset + 30 + nameLength + extraLength;

		if (compressionMethod === 0 && compressedSize > 0) {
			const dataBytes = new Uint8Array(buffer, dataOffset, compressedSize);
			const content = decoder.decode(dataBytes);
			entries.push({ name, content });
		}

		offset = dataOffset + compressedSize;
	}

	return entries;
}
