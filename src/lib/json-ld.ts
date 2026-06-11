/**
 * Serialize a JSON-LD object for safe embedding inside a <script> tag.
 *
 * JSON.stringify does NOT escape "<", so a value containing "</script>"
 * (e.g. a user-set event title) would break out of the script element and
 * execute as HTML. Escaping "<" (and a couple of other characters that can
 * confuse HTML/JSON parsers) closes that hole while keeping the JSON valid.
 *
 * U+2028 / U+2029 are valid in JSON strings but are line terminators in
 * JavaScript, so they must be escaped too when the JSON is inlined in a script.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
