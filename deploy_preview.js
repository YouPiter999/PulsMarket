const fs = require('fs');
const path = require('path');

console.log("🚀 Initializing Firebase Monkeypatch: Forcing Directory Junctions instead of Symlinks for Windows compatibility...");

// Patch fs.symlink (Async)
const origSymlink = fs.symlink;
fs.symlink = function (target, dest, type, callback) {
    let finalType = type;
    let finalCallback = callback;
    if (typeof type === 'function') {
        finalCallback = type;
        finalType = 'junction';
    } else {
        finalType = 'junction';
    }
    console.log(`[Monkeypatch] fs.symlink intercepted: forcing 'junction' for ${dest}`);
    return origSymlink(target, dest, finalType, finalCallback);
};

// Patch fs.symlinkSync (Sync)
const origSymlinkSync = fs.symlinkSync;
fs.symlinkSync = function (target, dest, type) {
    console.log(`[Monkeypatch] fs.symlinkSync intercepted: forcing 'junction' for ${dest}`);
    return origSymlinkSync(target, dest, 'junction');
};

// Patch fs.promises.symlink
if (fs.promises && fs.promises.symlink) {
    const origPromisesSymlink = fs.promises.symlink;
    fs.promises.symlink = function (target, dest, type) {
        console.log(`[Monkeypatch] fs.promises.symlink intercepted: forcing 'junction' for ${dest}`);
        return origPromisesSymlink(target, dest, 'junction');
    };
}

console.log("✅ Monkeypatches applied successfully! Bootstrapping Firebase CLI (Preview Channel Staging)...");

// Set argv to emulate the command line arguments for preview channel deployment
process.argv = [
    process.execPath,
    'firebase',
    'hosting:channel:deploy',
    'staging'
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
