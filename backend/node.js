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

// Default read-stream chunk size. Larger than Node's 64 KiB default to
// reduce syscall overhead when streaming multi-MiB images to the API.
// Overridable via TOONIFY_READ_CHUNK_BYTES for tuning on slow disks or
// when the remote endpoint prefers smaller chunks.
const DEFAULT_READ_STREAM_HWM = 1024 * 256;

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
const READ_STREAM_HWM = parsePositiveIntEnv('TOONIFY_READ_CHUNK_BYTES', DEFAULT_READ_STREAM_HWM);

deepai.setApiKey(API_KEY);

/**
 * Format a byte count as a human-readable string (e.g. "1.4 MiB").
 * Used in error messages so operators and screen-reader users get a
 * value that's easier to parse than a raw byte count.
 */
function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
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
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        },
    };
}

/**
 * Resolve the effective timeout for a toonify call from caller-supplied
 * options, falling back to the module-level default. Extracted so the
 * precedence rule is documented in exactly one place.
 */
function resolveTimeoutMs(options) {
    if (options && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0) {
        return Math.floor(options.timeoutMs);
    }
    return REQUEST_TIMEOUT_MS;
}

/**
 * Pick the read-stream highWaterMark for a given file size. Small
 * files don't benefit from a large buffer (and would just waste
 * memory), while very large files can amortise more syscall overhead
 * with a bigger chunk. The result is always clamped to at least
 * Node's 16 KiB minimum and never larger than the configured
 * READ_STREAM_HWM ceiling.
 */
function chooseReadHwm(fileSize) {
    const MIN_HWM = 16 * 1024;
    if (!Number.isFinite(fileSize) || fileSize <= 0) return READ_STREAM_HWM;
    if (fileSize <= 64 * 1024) return MIN_HWM;
    if (fileSize <= 1024 * 1024) return Math.min(64 * 1024, READ_STREAM_HWM);
    return READ_STREAM_HWM;
}

/**
 * Stat a path, translating ENOENT/EACCES into friendlier error
 * messages. Returns the fs.Stats object on success.
 */
function safeStat(imagePath) {
    try {
        return fs.statSync(imagePath);
    } catch (e) {
        if (e && e.code === 'EACCES') {
            throw new Error(`Permission denied reading: ${imagePath}`);
        }
        throw new Error(`File not found: ${imagePath}`);
    }
}

/**
 * Validate that the provided path points to a readable image file
 * with a supported extension and a reasonable size. Returns the
 * fs.Stats object so callers can reuse the size without a second
 * stat() syscall.
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

    const stat = safeStat(imagePath);
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
    return stat;
}

/**
 * Return true if `ext` (with or without a leading dot, any case) is one
 * of the image extensions this module accepts. Useful for callers that
 * want to filter candidate paths before invoking validateImagePath().
 */
function isSupportedExtension(ext) {
    if (typeof ext !== 'string' || ext.length === 0) return false;
    const normalised = (ext.startsWith('.') ? ext : `.${ext}`).toLowerCase();
    return SUPPORTED_EXTENSIONS_SET.has(normalised);
}

/**
 * Open a buffered read stream for `imagePath` and return both the
 * stream and a promise that rejects if the stream emits an error
 * before it's consumed. Callers are responsible for destroying the
 * stream when finished. The chunk size is selected based on the
 * file's size to avoid over-allocating buffers for tiny images.
 *
 * The returned `errorPromise` never resolves; it only rejects. This
 * makes it safe to include in a Promise.race() without accidentally
 * masking the real result from the API call.
 */
function openImageStream(imagePath, fileSize) {
    const highWaterMark = chooseReadHwm(fileSize);
    const stream = fs.createReadStream(imagePath, { highWaterMark });
    const errorPromise = new Promise((_, reject) => {
        stream.once('error', (err) => {
            const message = (err && err.message) ? err.message : String(err);
            reject(new Error(`Failed to read image '${imagePath}': ${message}`));
        });
    });
    return { stream, errorPromise, highWaterMark };
}

/**
 * Best-effort cleanup for a read stream: destroys it if it's still
 * open. Swallows errors because cleanup must never mask the original
 * failure reported by the caller.
 */
function destroyStreamSafely(stream) {
    if (!stream || typeof stream.destroy !== 'function') return;
    if (stream.destroyed) return;
    try {
        stream.destroy();
    } catch (_) {
        /* ignore: cleanup is best-effort */
    }
}

/**
 * Send an image to the DeepAI toonify endpoint and return the response.
 * Uses a size-tuned buffered read stream to reduce syscall overhead
 * for typical image sizes, and enforces a configurable overall
 * request timeout. The stream and timer are always cleaned up, even
 * when the API call throws synchronously.
 */
async function toonifyImage(imagePath, options) {
    const stat = validateImagePath(imagePath);
    const timeoutMs = resolveTimeoutMs(options);

    const { stream, errorPromise } = openImageStream(imagePath, stat.size);
    const timeout = createTimeout(timeoutMs, 'toonify request');
    // Attach a no-op rejection handler so an early stream error before
    // Promise.race() subscribes doesn't trigger an unhandledRejection.
    errorPromise.catch(() => {});
    try {
        return await Promise.race([
            deepai.callStandardApi('toonify', { image: stream }),
            errorPromise,
            timeout.promise,
        ]);
    } finally {
        timeout.cancel();
        destroyStreamSafely(stream);
    }
}

/**
 * Print CLI usage information to the given writer (console.log or
 * console.error). Extracted so main() stays focused on flow control.
 */
function printUsage(writer) {
    writer('Usage: node node.js <path-to-image>');
    writer(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    writer(`Maximum image size: ${formatBytes(MAX_IMAGE_BYTES)}`);
    writer(`Request timeout: ${formatDuration(REQUEST_TIMEOUT_MS)}`);
}

async function main() {
    const inputPath = process.argv[2];
    const askedForHelp = inputPath === '-h' || inputPath === '--help';
    if (!inputPath || askedForHelp) {
        // Help text goes to stdout when explicitly requested, stderr otherwise,
        // so screen readers and pipelines get a consistent exit/stream contract.
        printUsage(askedForHelp ? console.log : console.error);
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

module.exports = { toonifyImage, validateImagePath, isSupportedExtension, formatBytes, formatDuration, logStatus, createTimeout, parsePositiveIntEnv, resolveTimeoutMs, openImageStream, destroyStreamSafely, chooseReadHwm, printUsage, SUPPORTED_EXTENSIONS, MAX_IMAGE_BYTES, REQUEST_TIMEOUT_MS, READ_STREAM_HWM };
