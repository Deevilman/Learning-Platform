/** Pyodide's standard input as bytes, read in chunks and then end of file.
 *  (Returning the whole string from a `stdin` callback cuts it off after Pyodide's 8 KB buffer.) */
export function stdinReader(text: string): { read: (buf: Uint8Array) => number } {
  const bytes = new TextEncoder().encode(text)
  let off = 0
  return {
    read: (buf: Uint8Array) => {
      const n = Math.min(buf.length, bytes.length - off)
      buf.set(bytes.subarray(off, off + n))
      off += n
      return n
    },
  }
}
