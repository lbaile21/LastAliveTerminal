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
 * Format a byte count as a human-readable string (e.g. "1.4 MiB").
 * Used in error messages so operators and screen-reader users get a
 * value that's easier to parse than a raw byte count.
 */
function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format a millisecond duration for human-readable status output.
 * Keeping durations consistent across log lines helps assistive
 * tooling (and humans) skim run summaries.
 */
function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) return String(ms);
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const minutes = Math.floor(seconds / 60);
    const remSeconds = (seconds - minutes * 60).toFixed(1);
    return `${minutes}m ${remSeconds}s`;
}

/**
 * Emit a status line to stderr in a stable, screen-reader-friendly
 * format: "[level] message". Centralising this keeps log output
 * predictable for assistive tooling that consumes our stderr stream.
 */
function logStatus(level, message) {
    const lvl = String(level || 'info').toLowerCase();
    console.error(`[${lvl}] ${message}`);
}

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
        throw new Error(`Image too large (${formatBytes(stat.size)}); limit is ${formatBytes(MAX_IMAGE_BYTES)}`);
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
    if (!inputPath || inputPath === '-h' || inputPath === '--help') {
        const out = inputPath ? console.log : console.error;
        out('Usage: node node.js <path-to-image>');
        out(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);
        out(`Maximum image size: ${formatBytes(MAX_IMAGE_BYTES)}`);
        process.exitCode = inputPath ? 0 : 1;
        return;
    }
    try {
        const started = Date.now();
        logStatus('info', `toonifying ${inputPath}`);
        const resp = await toonifyImage(inputPath);
        console.log(resp);
        logStatus('info', `toonify completed in ${formatDuration(Date.now() - started)}`);
    } catch (err) {
        logStatus('error', `toonify failed: ${err.message}`);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = { toonifyImage, validateImagePath, formatBytes, formatDuration, logStatus, SUPPORTED_EXTENSIONS, MAX_IMAGE_BYTES };
