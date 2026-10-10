// src/utils/nanoidCompat.ts
// Compatibility shim for nanoid ESM in Jest (CommonJS) environment
const { customAlphabet } = require('nanoid/non-secure') as typeof import('nanoid/non-secure');

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(alphabet, 21);

export default nanoid;
