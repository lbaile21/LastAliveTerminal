const fs = require('fs');
const path = require('path');

const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML

//////////////////Convert Image into Cartoon/////////////////////////

const API_KEY = process.env.DEEPAI_API_KEY || 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K';
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
const SUPPORTED_EXTENSIONS_SET = new Set(SUPPORTED_EXTENSIONS);

// Cap the file size we'll stream to the remote API to avoid wasted
// bandwidth and long-running requests on obviously-too-large inputs.
const MAX_IMAGE_BYTES = Number(process.env.TOONIFY_MAX_BYTES) || 25 * 1024 * 1024; // 25 MiB

deepai.setApiKey(API_KEY);

/**
 * Validate that the provided path points to a readable image file
 * with a supported extension and a reasonable size. Throws a
 * descriptive error message on failure.
 */
function validateImagePath(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') {
        throw new TypeError('imagePath must be a non-empty string');
    }

    let stat;
    try {
        stat = fs.statSync(imagePath);
    } catch (e) {
        throw new Error(`File not found: ${imagePath}`);
    }
    if (!stat.isFile()) {
        throw new Error(`Not a regular file: ${imagePath}`);
    }
    if (stat.size === 0) {
        throw new Error(`Image file is empty: ${imagePath}`);
    }
    if (stat.size > MAX_IMAGE_BYTES) {
        throw new Error(`Image too large (${stat.size} bytes); limit is ${MAX_IMAGE_BYTES} bytes`);
    }

    const ext = path.extname(imagePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS_SET.has(ext)) {
        throw new Error(`Unsupported image extension '${ext}'. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    }
}

/**
 * Send an image to the DeepAI toonify endpoint and return the response.
 * Uses a buffered high-water mark on the read stream to reduce syscall
 * overhead for typical image sizes.
 */
async function toonifyImage(imagePath) {
    validateImagePath(imagePath);

    const stream = fs.createReadStream(imagePath, { highWaterMark: 1024 * 256 });
    try {
        return await deepai.callStandardApi('toonify', { image: stream });
    } finally {
        if (typeof stream.destroy === 'function') {
            stream.destroy();
        }
    }
}

async function main() {
    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error('Usage: node node.js <path-to-image>');
        process.exitCode = 1;
        return;
    }
    try {
        const started = Date.now();
        const resp = await toonifyImage(inputPath);
        console.log(resp);
        console.error(`toonify completed in ${Date.now() - started}ms`);
    } catch (err) {
        console.error('Toonify failed:', err.message);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = { toonifyImage, validateImagePath, SUPPORTED_EXTENSIONS, MAX_IMAGE_BYTES };
