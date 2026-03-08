/**
 * Cipher - ZIP Download Utility
 *
 * Minimal ZIP file generator using raw bytes and browser APIs.
 * Uses the "store" method (no compression) which is sufficient for CSS text files
 * and avoids any external dependencies — important for Figma plugin bundling.
 */

// ---------------------------------------------------------------------------
// CRC-32 lookup table (IEEE / ISO 3309 polynomial 0xEDB88320)
// ---------------------------------------------------------------------------

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

/**
 * Compute the CRC-32 checksum of the given byte array.
 */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// Helpers for building binary structures
// ---------------------------------------------------------------------------

/** Encode a string as UTF-8 bytes. */
function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Write a 16-bit unsigned little-endian value into `buf` at `offset`. */
function writeUint16LE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
}

/** Write a 32-bit unsigned little-endian value into `buf` at `offset`. */
function writeUint32LE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

// ---------------------------------------------------------------------------
// ZIP structures
// ---------------------------------------------------------------------------

/**
 * Build a Local File Header (signature 0x04034b50).
 *
 * Layout (30 bytes + file name):
 *   0  4  Local file header signature
 *   4  2  Version needed to extract (20 = 2.0)
 *   6  2  General purpose bit flag (bit 11 = UTF-8 names)
 *   8  2  Compression method (0 = stored)
 *  10  2  Last mod file time
 *  12  2  Last mod file date
 *  14  4  CRC-32
 *  18  4  Compressed size
 *  22  4  Uncompressed size
 *  26  2  File name length
 *  28  2  Extra field length
 *  30  n  File name
 */
function buildLocalFileHeader(
  nameBytes: Uint8Array,
  crc: number,
  size: number,
  modTime: number,
  modDate: number
): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.length);
  writeUint32LE(header, 0, 0x04034b50); // signature
  writeUint16LE(header, 4, 20); // version needed
  writeUint16LE(header, 6, 0x0800); // bit flag — UTF-8
  writeUint16LE(header, 8, 0); // compression: stored
  writeUint16LE(header, 10, modTime);
  writeUint16LE(header, 12, modDate);
  writeUint32LE(header, 14, crc);
  writeUint32LE(header, 18, size); // compressed
  writeUint32LE(header, 22, size); // uncompressed
  writeUint16LE(header, 26, nameBytes.length);
  writeUint16LE(header, 28, 0); // extra field length
  header.set(nameBytes, 30);
  return header;
}

/**
 * Build a Central Directory File Header (signature 0x02014b50).
 *
 * Layout (46 bytes + file name):
 *   0  4  Central directory signature
 *   4  2  Version made by (20 = 2.0)
 *   6  2  Version needed to extract
 *   8  2  General purpose bit flag
 *  10  2  Compression method
 *  12  2  Last mod file time
 *  14  2  Last mod file date
 *  16  4  CRC-32
 *  20  4  Compressed size
 *  24  4  Uncompressed size
 *  28  2  File name length
 *  30  2  Extra field length
 *  32  2  File comment length
 *  34  2  Disk number start
 *  36  2  Internal file attributes
 *  38  4  External file attributes
 *  42  4  Relative offset of local header
 *  46  n  File name
 */
function buildCentralDirectoryHeader(
  nameBytes: Uint8Array,
  crc: number,
  size: number,
  modTime: number,
  modDate: number,
  localHeaderOffset: number
): Uint8Array {
  const header = new Uint8Array(46 + nameBytes.length);
  writeUint32LE(header, 0, 0x02014b50); // signature
  writeUint16LE(header, 4, 20); // version made by
  writeUint16LE(header, 6, 20); // version needed
  writeUint16LE(header, 8, 0x0800); // bit flag — UTF-8
  writeUint16LE(header, 10, 0); // compression: stored
  writeUint16LE(header, 12, modTime);
  writeUint16LE(header, 14, modDate);
  writeUint32LE(header, 16, crc);
  writeUint32LE(header, 20, size); // compressed
  writeUint32LE(header, 24, size); // uncompressed
  writeUint16LE(header, 28, nameBytes.length);
  writeUint16LE(header, 30, 0); // extra field length
  writeUint16LE(header, 32, 0); // file comment length
  writeUint16LE(header, 34, 0); // disk number start
  writeUint16LE(header, 36, 0); // internal attrs
  writeUint32LE(header, 38, 0); // external attrs
  writeUint32LE(header, 42, localHeaderOffset);
  header.set(nameBytes, 46);
  return header;
}

/**
 * Build the End of Central Directory record (signature 0x06054b50).
 *
 * Layout (22 bytes):
 *   0  4  End of central directory signature
 *   4  2  Disk number
 *   6  2  Disk where central directory starts
 *   8  2  Number of central directory records on this disk
 *  10  2  Total number of central directory records
 *  12  4  Size of central directory (bytes)
 *  16  4  Offset of start of central directory
 *  20  2  Comment length
 */
function buildEndOfCentralDirectory(
  entryCount: number,
  centralDirSize: number,
  centralDirOffset: number
): Uint8Array {
  const record = new Uint8Array(22);
  writeUint32LE(record, 0, 0x06054b50); // signature
  writeUint16LE(record, 4, 0); // disk number
  writeUint16LE(record, 6, 0); // disk with central dir
  writeUint16LE(record, 8, entryCount);
  writeUint16LE(record, 10, entryCount);
  writeUint32LE(record, 12, centralDirSize);
  writeUint32LE(record, 16, centralDirOffset);
  writeUint16LE(record, 20, 0); // comment length
  return record;
}

// ---------------------------------------------------------------------------
// DOS date/time helpers
// ---------------------------------------------------------------------------

function toDosTime(date: Date): number {
  return (
    ((date.getSeconds() >> 1) & 0x1f) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getHours() & 0x1f) << 11)
  );
}

function toDosDate(date: Date): number {
  return (
    (date.getDate() & 0x1f) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (((date.getFullYear() - 1980) & 0x7f) << 9)
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ZipEntry {
  /** File path inside the ZIP (e.g. "styles/tokens.css"). */
  name: string;
  /** Text content of the file. */
  content: string;
}

/**
 * Create a ZIP file from an array of `{ name, content }` entries and trigger a
 * browser download.
 *
 * Uses the "store" method (no compression) which keeps the implementation
 * dependency-free and is perfectly adequate for CSS text files.
 */
export function downloadAsZip(
  files: ZipEntry[],
  zipName: string
): void {
  const now = new Date();
  const modTime = toDosTime(now);
  const modDate = toDosDate(now);

  // Pre-encode all file names and contents.
  const entries = files.map((f) => {
    const nameBytes = encodeUTF8(f.name);
    const dataBytes = encodeUTF8(f.content);
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  // --- Pass 1: Local file headers + data ---
  const localParts: Uint8Array[] = [];
  const localOffsets: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    localOffsets.push(offset);
    const header = buildLocalFileHeader(
      entry.nameBytes,
      entry.crc,
      entry.dataBytes.length,
      modTime,
      modDate
    );
    localParts.push(header);
    localParts.push(entry.dataBytes);
    offset += header.length + entry.dataBytes.length;
  }

  // --- Pass 2: Central directory ---
  const centralDirOffset = offset;
  const centralParts: Uint8Array[] = [];
  let centralDirSize = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const cdHeader = buildCentralDirectoryHeader(
      entry.nameBytes,
      entry.crc,
      entry.dataBytes.length,
      modTime,
      modDate,
      localOffsets[i]
    );
    centralParts.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // --- End of central directory ---
  const eocd = buildEndOfCentralDirectory(
    entries.length,
    centralDirSize,
    centralDirOffset
  );

  // --- Assemble final blob ---
  const allParts: BlobPart[] = [
    ...localParts.map((p) => p as BlobPart),
    ...centralParts.map((p) => p as BlobPart),
    eocd as BlobPart,
  ];
  const blob = new Blob(allParts, { type: "application/zip" });

  triggerDownload(blob, zipName);
}

/**
 * Download a single text file via the browser.
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  triggerDownload(blob, filename);
}

// ---------------------------------------------------------------------------
// Internal: trigger a file download in the browser
// ---------------------------------------------------------------------------

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a short delay so the browser has time to start the download.
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}
