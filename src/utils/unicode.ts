// Convert non-ASCII characters to \uXXXX escape sequences
export function unicodeEncode(input: string): string {
  return input.replace(/[^\x00-\x7F]/g, (ch) => {
    return "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
  });
}

// Convert \uXXXX escape sequences back to Unicode characters
export function unicodeDecode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}
