const fs = require('fs');
const path = require('path');

console.log("🚀 Initializing Firebase Monkeypatch: Replacing symlinks with REAL directory copies for Windows + Cloud Functions compatibility...");

// Recursively copy a directory (real files, not links). Node 16+ has fs.cpSync.
function copyDirReal(target, dest) {
    // Resolve target relative to the link's parent dir, like a real symlink would.
    const resolvedTarget = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(dest), target);
    try {
        // Remove any pre-existing dest so cpSync doesn't choke.
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        const stat = fs.statSync(resolvedTarget);
        if (stat.isDirectory()) {
            fs.cpSync(resolvedTarget, dest, { recursive: true, dereference: true });
        } else {
            fs.copyFileSync(resolvedTarget, dest);
        }
        console.log(`[CopyPatch] Copied REAL files: ${resolvedTarget} -> ${dest}`);
    } catch (e) {
        console.warn(`[CopyPatch] Copy failed (${resolvedTarget} -> ${dest}): ${e.message}. Falling back to junction.`);
        try {
            origSymlinkSync(target, dest, 'junction');
        } catch (e2) {
            console.error(`[CopyPatch] Junction fallback also failed: ${e2.message}`);
        }
    }
}

// Keep originals
const origSymlink = fs.symlink;
const origSymlinkSync = fs.symlinkSync;

// Patch fs.symlink (Async)
fs.symlink = function (target, dest, type, callback) {
    let finalCallback = callback;
    if (typeof type === 'function') {
        finalCallback = type;
    }
    try {
        copyDirReal(target, dest);
        if (typeof finalCallback === 'function') finalCallback(null);
    } catch (e) {
        if (typeof finalCallback === 'function') finalCallback(e);
    }
};

// Patch fs.symlinkSync (Sync)
fs.symlinkSync = function (target, dest, type) {
    copyDirReal(target, dest);
};

// Patch fs.promises.symlink
if (fs.promises && fs.promises.symlink) {
    fs.promises.symlink = function (target, dest, type) {
        return new Promise((resolve, reject) => {
            try {
                copyDirReal(target, dest);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };
}

console.log("✅ Copy-patches applied successfully! Bootstrapping Firebase CLI...");

// Emulate command line arguments
process.argv = [
    process.execPath,
    'firebase',
    'deploy',
    '--only',
    'hosting'
];

// Require global firebase-tools launcher directly
const globalFirebasePath = "C:\\Users\\Сергей\\AppData\\Roaming\\npm\\node_modules\\firebase-tools\\lib\\bin\\firebase.js";

try {
    require(globalFirebasePath);
} catch (e) {
    console.warn("⚠️ Could not load global Firebase launcher, attempting relative node_modules search...", e.message);
    try {
        require('firebase-tools/lib/bin/firebase');
    } catch (err) {
        console.error("❌ CRITICAL: Failed to bootstrap firebase-tools!", err);
        process.exit(1);
    }
}
