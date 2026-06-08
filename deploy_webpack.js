const childProcess = require('child_process');
const fs = require('fs');

console.log("🚀 Initializing Firebase deploy with FORCED WEBPACK build (avoids Turbopack hashed-external junction bug that broke Cloud Functions)...");

// --- Part 1: Force `next build` to use Webpack instead of Turbopack ---
// The firebase-frameworks adapter runs its own `next build` and ignores the
// package.json build script. We intercept child process spawns and inject the
// `--webpack` flag whenever Next.js is asked to build. Webpack copies real
// external packages (firebase-admin) into node_modules instead of creating the
// hashed symlink/junction that Turbopack uses and that fails to deploy.

// firebase-tools invokes: spawn(<path-to>/next, ["build"], ...). So we detect
// when the COMMAND is the next binary and args contains "build".
function injectWebpack(command, args) {
    if (!Array.isArray(args)) return args;
    const cmdStr = String(command || '');
    // cross-spawn on Windows may wrap as cmd.exe /c "next build", so also scan args.
    const allStr = (cmdStr + ' ' + args.map(String).join(' ')).toLowerCase();
    const refersToNext = allStr.includes('next');
    const hasBuild = args.includes('build') || args.some(a => String(a).toLowerCase().includes('build'));
    const hasWebpack = allStr.includes('--webpack');
    const hasTurbo = args.some(a => String(a).includes('--turbo'));
    if (refersToNext && hasBuild && !hasWebpack) {
        const newArgs = hasTurbo ? args.filter(a => !String(a).includes('--turbo')) : [...args];
        newArgs.push('--webpack');
        console.log(`[WebpackPatch] Forcing webpack build: ${cmdStr} ${newArgs.join(' ')}`);
        return newArgs;
    }
    return args;
}

const origSpawn = childProcess.spawn;
childProcess.spawn = function (command, args, options) {
    if (Array.isArray(args)) {
        args = injectWebpack(command, args);
    }
    return origSpawn.call(this, command, args, options);
};

const origSpawnSync = childProcess.spawnSync;
childProcess.spawnSync = function (command, args, options) {
    if (Array.isArray(args)) {
        args = injectWebpack(command, args);
    }
    return origSpawnSync.call(this, command, args, options);
};

// Also patch exec/execSync in case the adapter builds a shell string.
const origExec = childProcess.exec;
childProcess.exec = function (cmd, options, callback) {
    if (typeof cmd === 'string' && cmd.includes('next') && cmd.includes('build') && !cmd.includes('--webpack')) {
        console.log(`[WebpackPatch] Injecting --webpack into exec build: ${cmd}`);
        cmd = cmd + ' --webpack';
    }
    return origExec.call(this, cmd, options, callback);
};

const origExecSync = childProcess.execSync;
childProcess.execSync = function (cmd, options) {
    if (typeof cmd === 'string' && cmd.includes('next') && cmd.includes('build') && !cmd.includes('--webpack')) {
        console.log(`[WebpackPatch] Injecting --webpack into execSync build: ${cmd}`);
        cmd = cmd + ' --webpack';
    }
    return origExecSync.call(this, cmd, options);
};

// --- Part 2: Keep the Windows symlink->junction safety net (Webpack normally
// does not create those externals, but keep it just in case) ---
const origSymlinkSync = fs.symlinkSync;
fs.symlinkSync = function (target, dest, type) {
    return origSymlinkSync(target, dest, 'junction');
};
const origSymlink = fs.symlink;
fs.symlink = function (target, dest, type, callback) {
    let finalType = 'junction';
    let finalCallback = callback;
    if (typeof type === 'function') {
        finalCallback = type;
    }
    return origSymlink(target, dest, finalType, finalCallback);
};

console.log("✅ Patches applied! Bootstrapping Firebase CLI...");

process.argv = [
    process.execPath,
    'firebase',
    'deploy',
    '--only',
    'hosting'
];

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
