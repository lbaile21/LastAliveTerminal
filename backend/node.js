const fs = require('fs');
const path = require('path');

const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML

//////////////////Convert Image into Cartoon/////////////////////////

const API_KEY = process.env.DEEPAI_API_KEY || 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K';
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
const SUPPORTED_EXTENSIONS_SET = new Set(SUPPORTED_EXTENSIONS);

// Cap the file size we'll stream to the remote API to avoid wasted
// bandwidth and long-running requests on obviously-too-large inputs.
// Override via the TOONIFY_MAX_BYTES environment variable (in bytes).
const DEFAULT_MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MiB

// Default request timeout for the remote toonify call. Overridable via
// TOONIFY_TIMEOUT_MS so CI environments can tighten or loosen it without
// code changes.
const DEFAULT_REQUEST_TIMEOUT_MS = 120 * 1000;

/**
 * Parse a positive integer from an environment variable, falling back
 * to `defaultValue` when the variable is unset, empty, or invalid.
 * Centralising this keeps env-var handling consistent and testable.
 */
function parsePositiveIntEnv(name, defaultValue) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return defaultValue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
    return Math.floor(parsed);
}

const MAX_IMAGE_BYTES = parsePositiveIntEnv('TOONIFY_MAX_BYTES', DEFAULT_MAX_IMAGE_BYTES);
const REQUEST_TIMEOUT_MS = parsePositiveIntEnv('TOONIFY_TIMEOUT_MS', DEFAULT_REQUEST_TIMEOUT_MS);

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
 * Return a Promise that rejects after `ms` milliseconds with a
 * timeout error tagged by `label`. The returned object also exposes a
 * `cancel()` method so callers can clear the underlying timer once
 * the racing work has resolved.
 */
function createTimeout(ms, label) {
    let timer;
    const promise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const err = new Error(`${label} timed out after ${formatDuration(ms)}`);
            err.code = 'ETIMEDOUT';
            reject(err);
        }, ms);
        if (typeof timer.unref === 'function') timer.unref();
    });
    return {
        promise,
        cancel() {
            if (timer) clearTimeout(timer);
        },
    };
}

/**
 * Validate that the provided path points to a readable image file
 * with a supported extension and a reasonable size. Throws a
 * descriptive error message on failure.
 *
 * @param {string} imagePath Filesystem path to the candidate image.
 * @throws {TypeError} If imagePath is not a non-empty string.
 * @throws {Error} If the file is missing, empty, too large, or has an
 *   unsupported extension.
 */
function validateImagePath(imagePath) {
    if (typeof imagePath !== 'string' || imagePath.length === 0) {
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
 * overhead for typical image sizes, and enforces a configurable
 * overall request timeout.
 */
async function toonifyImage(imagePath, options) {
    validateImagePath(imagePath);
    const timeoutMs = (options && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0)
        ? Math.floor(options.timeoutMs)
        : REQUEST_TIMEOUT_MS;

    const stream = fs.createReadStream(imagePath, { highWaterMark: 1024 * 256 });
    const streamError = new Promise((_, reject) => {
        stream.once('error', (err) => {
            reject(new Error(`Failed to read image '${imagePath}': ${err.message}`));
        });
    });
    const timeout = createTimeout(timeoutMs, 'toonify request');
    try {
        return await Promise.race([
            deepai.callStandardApi('toonify', { image: stream }),
            streamError,
            timeout.promise,
        ]);
    } finally {
        timeout.cancel();
        if (typeof stream.destroy === 'function' && !stream.destroyed) {
            stream.destroy();
        }
    }
}

async function main() {
    const inputPath = process.argv[2];
    const askedForHelp = inputPath === '-h' || inputPath === '--help';
    if (!inputPath || askedForHelp) {
        // Help text goes to stdout when explicitly requested, stderr otherwise,
        // so screen readers and pipelines get a consistent exit/stream contract.
        const out = askedForHelp ? console.log : console.error;
        out('Usage: node node.js <path-to-image>');
        out(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);
        out(`Maximum image size: ${formatBytes(MAX_IMAGE_BYTES)}`);
        out(`Request timeout: ${formatDuration(REQUEST_TIMEOUT_MS)}`);
        process.exitCode = askedForHelp ? 0 : 1;
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

module.exports = { toonifyImage, validateImagePath, formatBytes, formatDuration, logStatus, createTimeout, parsePositiveIntEnv, SUPPORTED_EXTENSIONS, MAX_IMAGE_BYTES, REQUEST_TIMEOUT_MS };
