/**
 * =====================================================
 * SahiSehat — Source Code Protection Build Script
 * =====================================================
 * 
 * Usage:  node build.js
 * 
 * Reads:  web v4_temp.html  (source)
 *         translations.js   (i18n data)
 * 
 * Outputs: index.html           (minimal shell)
 *          app.obfuscated.js    (protected bundle)
 * 
 * The output files are what you deploy. Never deploy 
 * the source HTML directly.
 * =====================================================
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('\n🔒 SahiSehat Source Code Protection Builder');
console.log('==========================================\n');

// Ensure output directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy image assets to output directory
console.log('🖼️  Copying image assets to dist/...');
const imagesToCopy = ['logo.png', 'logo1.png', 'textlogo.png'];
imagesToCopy.forEach(img => {
    const srcPath = path.join(__dirname, img);
    const destPath = path.join(distDir, img);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✓ Copied ${img}`);
    } else {
        console.log(`   ⚠️  Image ${img} not found at ${srcPath}`);
    }
});

// ─── Step 1: Read source files ───────────────────────

console.log('📖 Reading source files...');

const htmlSource = fs.readFileSync(
    path.join(__dirname, 'web v4_temp.html'), 'utf8'
);
const translationsSource = fs.readFileSync(
    path.join(__dirname, 'translations.js'), 'utf8'
);

console.log(`   ✓ HTML source: ${(htmlSource.length / 1024).toFixed(1)} KB`);
console.log(`   ✓ Translations: ${(translationsSource.length / 1024).toFixed(1)} KB`);


// ─── Step 2: Extract CSS ─────────────────────────────

console.log('\n🎨 Extracting & adapting CSS for Shadow DOM...');

const cssBlocks = [];

// Read standalone theme configuration if it exists
const themeConfigPath = path.join(__dirname, 'theme-config.css');
if (fs.existsSync(themeConfigPath)) {
    console.log('   ✓ Found standalone theme-config.css, loading theme overrides...');
    const themeConfigCSS = fs.readFileSync(themeConfigPath, 'utf8');
    cssBlocks.push(themeConfigCSS.trim());
} else {
    console.log('   ⚠️  No theme-config.css found. Using default internal styles.');
}

const cssRegex = /<style>([\s\S]*?)<\/style>/gi;
let cssMatch;
while ((cssMatch = cssRegex.exec(htmlSource)) !== null) {
    cssBlocks.push(cssMatch[1].trim());
}
const allCSS = cssBlocks.join('\n');

// Adapt CSS for Shadow DOM scoping
let processedCSS = allCSS;
// Replace :root with :host
processedCSS = processedCSS.replace(/:root\b/g, ':host');
// Replace html with #shadow-body (since html matches the top container, we sync theme to #shadow-body)
processedCSS = processedCSS.replace(/(^|[\s,>+~])html\b/g, '$1#shadow-body');
// Replace body with #shadow-body so body styles apply to the container div
processedCSS = processedCSS.replace(/(^|[\s,>+~])body\b/g, '$1#shadow-body');

console.log(`   ✓ Extracted and processed ${cssBlocks.length} style block(s), ${(processedCSS.length / 1024).toFixed(1)} KB`);


// ─── Step 3: Extract body HTML (without scripts) ─────

console.log('\n🏗️  Extracting HTML body...');

const bodyMatch = htmlSource.match(/<body>([\s\S]*)<\/body>/i);
let bodyHTML = bodyMatch ? bodyMatch[1] : '';

// Remove all <script> blocks (both inline and external src) from body HTML
bodyHTML = bodyHTML.replace(/<script[\s\S]*?<\/script>/gi, '');

// Also remove the <script src="translations.js"></script> reference (it's in head)
// Trim whitespace
bodyHTML = bodyHTML.trim();

console.log(`   ✓ Body HTML: ${(bodyHTML.length / 1024).toFixed(1)} KB`);


// ─── Step 4: Extract inline JavaScript ───────────────

console.log('\n⚡ Extracting JavaScript...');

const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
const scriptBlocks = [];
let scriptMatch;
while ((scriptMatch = scriptRegex.exec(htmlSource)) !== null) {
    scriptBlocks.push(scriptMatch[1].trim());
}

let allInlineJS = scriptBlocks.join('\n\n').replace(/lucide\.createIcons\(\)/g, 'if(typeof lucide !== "undefined"){lucide.createIcons();}');

// Export functions to window so inline HTML handlers (onclick, onchange) in Shadow DOM can resolve them
const functionsToExport = [
    'triggerUnlock',
    'showFacilities',
    'hideFacilities',
    'bookAppointment',
    'openManualAppointmentModal',
    'markCompletePrompt',
    'closeUnlockModal',
    'verifyUnlock',
    'verifyUnlockBiometric',
    'closeAppointmentModal',
    'confirmAppointment',
    'closeManualAppointmentModal',
    'confirmManualAppointment',
    'closeCompleteModal',
    'completeWithoutDocs',
    'showUploadSection',
    'handleDocUpload',
    'finishUploadAndComplete',
    'toggleBiometricSetting'
];
functionsToExport.forEach(fn => {
    allInlineJS += `\nif (typeof ${fn} !== 'undefined') { window.${fn} = ${fn}; }`;
});

console.log(`   ✓ Extracted ${scriptBlocks.length} script block(s), ${(allInlineJS.length / 1024).toFixed(1)} KB`);


// ─── Step 5: Build the anti-DevTools protection ──────

console.log('\n🛡️  Building protection layers...');

const protectionCode = `
// ╔══════════════════════════════════════════════════╗
// ║  LAYER 4: SURFACE HARDENING                      ║
// ╚══════════════════════════════════════════════════╝

// Block right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
}, true);

// Block keyboard shortcuts for DevTools
document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+S (Save page)
    if (e.ctrlKey && !e.shiftKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
        e.preventDefault(); e.stopPropagation(); return false;
    }
}, true);

// Block drag
document.addEventListener('dragstart', function(e) {
    e.preventDefault(); return false;
}, true);

// Disable text selection on body (except inputs/textareas)
document.addEventListener('selectstart', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    e.preventDefault(); return false;
}, true);


// ╔══════════════════════════════════════════════════╗
// ║  LAYER 3: ANTI-DEVTOOLS SHIELD                   ║
// ╚══════════════════════════════════════════════════╝

(function() {
    var _shield_active = true;
    
    function _killPage() {
        if (!_shield_active) return;
        try {
            // Instantly unload the page by redirecting to about:blank
            window.location.replace('about:blank');
        } catch(e) {
            document.body.innerHTML = '';
        }
    }
    
    // --- Detection Method 1: Debugger Timing ---
    function _checkDebuggerTiming() {
        var start = performance.now();
        debugger; // Active in production
        var duration = performance.now() - start;
        if (duration > 150) {
            _killPage();
        }
    }
    
    // --- Detection Method 2: Window Size Heuristic ---
    function _checkWindowSize() {
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > 160 || heightDiff > 160) {
            _killPage();
        }
    }
    
    // --- Detection Method 3: Console Property Trap ---
    function _checkConsoleTrap() {
        var r = /./;
        r.toString = function() {
            _killPage();
            return '';
        };
        console.log(r);
        console.clear();
    }
    
    // --- Disable Console Output ---
    function _disableConsole() {
        var methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'assert', 'profile', 'profileEnd', 'time', 'timeEnd', 'timeLog'];
        methods.forEach(function(method) {
            try {
                window.console[method] = function() {};
            } catch(e) {}
        });
    }
    
    _disableConsole();
    
    // Run checks on intervals
    setInterval(_checkDebuggerTiming, 100);
    setInterval(_checkWindowSize, 500);
    setInterval(_checkConsoleTrap, 1000);
})();
`;


// ─── Step 6: Assemble the complete bundle ────────────

console.log('\n📦 Assembling bundle...');

const bundleCode = `
(function() {
    'use strict';
    
    // Save original DOM references
    var originalGetElementById = document.getElementById;
    var originalQuerySelector = document.querySelector;
    var originalQuerySelectorAll = document.querySelectorAll;
    var originalGetElementsByClassName = document.getElementsByClassName;
    var originalGetElementsByTagName = document.getElementsByTagName;
    var originalAddEventListener = document.addEventListener;
    var originalRemoveEventListener = document.removeEventListener;

    // ═══════════════════════════════════════════════
    // PROTECTION LAYERS (3 & 4)
    // ═══════════════════════════════════════════════
    ${protectionCode}
    
    // ═══════════════════════════════════════════════
    // INITIALIZE SHADOW DOM
    // ═══════════════════════════════════════════════
    var _root = originalGetElementById.call(document, 'root');
    if (!_root) {
        _root = document.createElement('div');
        _root.id = 'root';
        document.body.appendChild(_root);
    }
    
    // Create a closed Shadow DOM to hide elements from Edge 3D view and inspectors
    var _shadow = _root.attachShadow({ mode: 'closed' });
    
    // Shadow root container that mimics the document body
    var shadowBody = document.createElement('div');
    shadowBody.id = 'shadow-body';
    shadowBody.style.minHeight = '100vh';
    shadowBody.style.display = 'flex';
    shadowBody.style.flexDirection = 'column';
    _shadow.appendChild(shadowBody);

    // Sync theme and colorblind attributes from document.documentElement to shadowBody and host
    var syncThemeAndColorblind = function() {
        var theme = document.documentElement.getAttribute('data-theme');
        if (theme) {
            shadowBody.setAttribute('data-theme', theme);
            _root.setAttribute('data-theme', theme);
        } else {
            shadowBody.removeAttribute('data-theme');
            _root.removeAttribute('data-theme');
        }
        var cb = document.documentElement.getAttribute('data-colorblind');
        if (cb) {
            shadowBody.setAttribute('data-colorblind', cb);
            _root.setAttribute('data-colorblind', cb);
        } else {
            shadowBody.removeAttribute('data-colorblind');
            _root.removeAttribute('data-colorblind');
        }
    };
    syncThemeAndColorblind();
    var themeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes') {
                syncThemeAndColorblind();
            }
        });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-colorblind'] });

    // Overriding document DOM query APIs to redirect to the Shadow DOM
    document.getElementById = function(id) {
        if (id === 'root') return _root;
        return shadowBody.querySelector('#' + id) || _shadow.querySelector('#' + id) || originalGetElementById.call(document, id);
    };

    document.querySelector = function(selector) {
        if (selector === '#root') return _root;
        if (selector === 'body') return shadowBody;
        return shadowBody.querySelector(selector) || _shadow.querySelector(selector) || originalQuerySelector.call(document, selector);
    };

    document.querySelectorAll = function(selector) {
        if (selector === 'body') return [shadowBody];
        var results = shadowBody.querySelectorAll(selector);
        if (results.length > 0) return results;
        return originalQuerySelectorAll.call(document, selector);
    };

    document.getElementsByClassName = function(className) {
        return shadowBody.getElementsByClassName(className);
    };

    document.getElementsByTagName = function(tagName) {
        var lower = tagName.toLowerCase();
        if (lower === 'body') return [shadowBody];
        return shadowBody.getElementsByTagName(tagName);
    };

    // Override document.body getter
    Object.defineProperty(document, 'body', {
        get: function() {
            return shadowBody;
        },
        configurable: true
    });

    // Event listener routing to avoid retargeting issues of closed shadow roots
    var routeEvents = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mouseleave', 'keydown', 'keypress', 'keyup', 'change', 'input', 'submit', 'focus', 'blur', 'focusin', 'focusout'];
    
    var __dcl_queue = [];
    document.addEventListener = function(type, fn, opts) {
        if (type === 'DOMContentLoaded') {
            __dcl_queue.push(fn);
        } else if (routeEvents.includes(type)) {
            shadowBody.addEventListener(type, fn, opts);
        } else {
            originalAddEventListener.call(document, type, fn, opts);
        }
    };

    document.removeEventListener = function(type, fn, opts) {
        if (routeEvents.includes(type)) {
            shadowBody.removeEventListener(type, fn, opts);
        } else {
            originalRemoveEventListener.call(document, type, fn, opts);
        }
    };

    // ═══════════════════════════════════════════════
    // INJECT EXTERNAL RESOURCES
    // ═══════════════════════════════════════════════
    (function() {
        var h = document.head;
        
        var pc1 = document.createElement('link');
        pc1.rel = 'preconnect';
        pc1.href = 'https://fonts.googleapis.com';
        h.appendChild(pc1);
        
        var pc2 = document.createElement('link');
        pc2.rel = 'preconnect';
        pc2.href = 'https://fonts.gstatic.com';
        pc2.crossOrigin = '';
        h.appendChild(pc2);
        
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
        h.appendChild(fontLink);
    })();
    
    // ═══════════════════════════════════════════════
    // INJECT CSS INSIDE SHADOW DOM
    // ═══════════════════════════════════════════════
    (function() {
        var s = document.createElement('style');
        s.textContent = ${JSON.stringify(processedCSS)};
        _shadow.appendChild(s);
    })();
    
    // ═══════════════════════════════════════════════
    // INJECT TRANSLATIONS
    // ═══════════════════════════════════════════════
    ${translationsSource}
    
    // ═══════════════════════════════════════════════
    // INJECT BODY HTML INSIDE SHADOW DOM
    // ═══════════════════════════════════════════════
    shadowBody.innerHTML = ${JSON.stringify(bodyHTML)};
    
    // ═══════════════════════════════════════════════
    // LOAD LUCIDE ICONS & INITIALIZE APP
    // ═══════════════════════════════════════════════
    // Execute app JS immediately
    __executeAppCode();
    
    // Fire queued DOMContentLoaded handlers
    __dcl_queue.forEach(function(fn) {
        try { fn(); } catch(e) {}
    });
    
    var _lucideScript = document.createElement('script');
    _lucideScript.src = 'https://unpkg.com/lucide@latest';
    _lucideScript.onload = function() {
        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    };
    document.head.appendChild(_lucideScript);
    
    // ═══════════════════════════════════════════════
    // APP CODE
    // ═══════════════════════════════════════════════
    function __executeAppCode() {
        ${allInlineJS}
    }
    
})();
`;

console.log(`   ✓ Bundle assembled: ${(bundleCode.length / 1024).toFixed(1)} KB`);


// ─── Step 7: Obfuscate ───────────────────────────────

console.log('\n🔐 Obfuscating (this may take a minute)...');

const obfuscationResult = JavaScriptObfuscator.obfuscate(bundleCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: true,
    debugProtectionInterval: 3000,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,   // Keep global function names for onclick handlers
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 15,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

const obfuscatedCode = obfuscationResult.getObfuscatedCode();
console.log(`   ✓ Obfuscated: ${(obfuscatedCode.length / 1024).toFixed(1)} KB`);


// ─── Step 8: Write output files ──────────────────────

console.log('\n📝 Writing output files to dist/...');

// Cache-busting parameter using current timestamp
const buildVersion = Date.now();

// Minimal index.html shell (with Google One Tap/Identity SDK injected)
const outputHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SahiSehat - Your Health is Our Concern</title>
<meta name="description" content="SahiSehat - AI-assisted health application for managing your health records, appointments, and government health schemes.">
<!-- Google Identity Services Library -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
<div id="root"></div>
<script src="app.obfuscated.js?v=${buildVersion}"></script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), outputHTML, 'utf8');
fs.writeFileSync(path.join(distDir, 'app.obfuscated.js'), obfuscatedCode, 'utf8');

console.log(`   ✓ dist/index.html (${(outputHTML.length).toFixed(0)} bytes)`);
console.log(`   ✓ dist/app.obfuscated.js (${(obfuscatedCode.length / 1024).toFixed(1)} KB)`);


// ─── Done ────────────────────────────────────────────

console.log('\n✅ Build complete!');
console.log('');
console.log('📁 Deploy/serve files in the frontend/dist folder:');
console.log('   • dist/index.html');
console.log('   • dist/app.obfuscated.js');
console.log('   • dist/logo.png, dist/logo1.png, dist/textlogo.png');
console.log('');
console.log('⚠️  Do NOT deploy source files: web v4_temp.html, translations.js, build.js, theme-config.css');
console.log('');
