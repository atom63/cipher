/**
 * Minimal ZIP reader supporting both "store" (method 0) and "deflate"
 * (method 8) compression methods via the DecompressionStream API.
 * Designed to read ZIPs created by our own zip-download utility (store only)
 * as well as standard ZIPs created by OS tools (deflate).
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

/** Decompress raw deflate bytes using the DecompressionStream API. */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
	const ds = new DecompressionStream("deflate-raw");
	const writer = ds.writable.getWriter();
	const reader = ds.readable.getReader();

	writer.write(data as Uint8Array<ArrayBuffer>);
	writer.close();

	const chunks: Uint8Array[] = [];
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}

	const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
	const result = new Uint8Array(totalLength);
	let pos = 0;
	for (const chunk of chunks) {
		result.set(chunk, pos);
		pos += chunk.length;
	}
	return result;
}

/**
 * Extract text files from a ZIP archive.
 * Supports both stored (method 0) and deflated (method 8) entries.
 * Returns an array of { name, content } entries.
 */
export async function readZip(buffer: ArrayBuffer): Promise<ZipFileEntry[]> {
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

		if (compressedSize > 0) {
			const dataBytes = new Uint8Array(buffer, dataOffset, compressedSize);

			if (compressionMethod === 0) {
				// Stored — read directly
				entries.push({ name, content: decoder.decode(dataBytes) });
			} else if (compressionMethod === 8) {
				// Deflate — decompress
				try {
					const inflated = await inflateRaw(dataBytes);
					entries.push({ name, content: decoder.decode(inflated) });
				} catch {
					// Skip entries that can't be decompressed
				}
			}
			// Other compression methods are unsupported and skipped
		}

		offset = dataOffset + compressedSize;
	}

	return entries;
}
