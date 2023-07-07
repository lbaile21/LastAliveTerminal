const fs = require('fs');
const path = require('path');

const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML

//////////////////Convert Image into Cartoon/////////////////////////

const API_KEY = process.env.DEEPAI_API_KEY || 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K';
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];

deepai.setApiKey(API_KEY);

/**
 * Validate that the provided path points to a readable image file
 * with a supported extension. Throws a descriptive, screen-reader
 * friendly error message on failure.
 */
function validateImagePath(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') {
        throw new TypeError('imagePath must be a non-empty string');
    }

    if (!fs.existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
    }

    const stat = fs.statSync(imagePath);
    if (!stat.isFile()) {
        throw new Error(`Not a regular file: ${imagePath}`);
    }

    const ext = path.extname(imagePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(`Unsupported image extension '${ext}'. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    }
}

/**
 * Send an image to the DeepAI toonify endpoint and return the response.
 */
async function toonifyImage(imagePath) {
    validateImagePath(imagePath);

    const stream = fs.createReadStream(imagePath);
    try {
        const resp = await deepai.callStandardApi('toonify', { image: stream });
        return resp;
    } finally {
        if (typeof stream.destroy === 'function') {
            stream.destroy();
        }
    }
}

async function main() {
    const inputPath = process.argv[2] || '/path/to/your/file.jpg';
    if (!process.argv[2]) {
        console.error('Usage: node node.js <path-to-image>');
        process.exitCode = 1;
        return;
    }
    try {
        const resp = await toonifyImage(inputPath);
        console.log(resp);
    } catch (err) {
        console.error('Toonify failed:', err.message);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = { toonifyImage, validateImagePath, SUPPORTED_EXTENSIONS };
