const fs = require('fs');
const path = 'node_modules/priority-web-sdk/index.js';

try {
    if (!fs.existsSync(path)) {
        console.log('Priority SDK not found at ' + path + ', skipping patch.');
        process.exit(0);
    }
    let content = fs.readFileSync(path, 'utf8');
    let modified = false;

    // Patch 1: expose cookies
    const sdkPatchTarget = `updateAccessToken: function(accessToken, onSuccess, onError) {
            return syncExports.updateAccessToken(accessToken, onSuccess, onError);
          }`;

    // Old patch without logs (for detection)
    const oldSdkPatchReplacement = `updateAccessToken: function(accessToken, onSuccess, onError) {
            return syncExports.updateAccessToken(accessToken, onSuccess, onError);
          },
          getCookies: function() { return fakeWindow && fakeWindow.document ? fakeWindow.document.cookie : ""; }`;

    // New patch with logs
    const sdkPatchReplacement = `updateAccessToken: function(accessToken, onSuccess, onError) {
            return syncExports.updateAccessToken(accessToken, onSuccess, onError);
          },
          getCookies: function() { 
            try {
                var c = fakeWindow && fakeWindow.document ? fakeWindow.document.cookie : "";
                console.log("[SDK_PATCH] getCookies returning:", c);
                return c;
            } catch(e) { console.error("[SDK_PATCH] getCookies error:", e); return ""; }
          }`;

    if (content.includes(sdkPatchTarget) && !content.includes('getCookies: function()')) {
        content = content.replace(sdkPatchTarget, sdkPatchReplacement);
        console.log('Applied getCookies patch (v2 with logs).');
        modified = true;
    } else if (content.includes(oldSdkPatchReplacement)) {
        content = content.replace(oldSdkPatchReplacement, sdkPatchReplacement);
        console.log('Upgraded getCookies patch to v2 (with logs).');
        modified = true;
    } else if (content.includes('[SDK_PATCH] getCookies')) {
        console.log('getCookies patch (v2) already present.');
    }

    // Patch 2: fix setCookieImpl overwriting AND strip attributes
    const originalFn = `function setCookieImpl(name_0, value_0, expires, domain, path, secure){
  var c = name_0 + '=' + value_0;
  expires && (c += ';expires=' + (new Date(expires)).toGMTString());
  domain && (c += ';domain=' + domain);
  path && (c += ';path=' + path);
  secure && (c += ';secure');
  $doc.cookie = c;
}`;

    const previousPatchFn = `function setCookieImpl(name_0, value_0, expires, domain, path, secure){
  var c = name_0 + '=' + value_0;
  expires && (c += ';expires=' + (new Date(expires)).toGMTString());
  domain && (c += ';domain=' + domain);
  path && (c += ';path=' + path);
  secure && (c += ';secure');
  $doc.cookie = ($doc.cookie ? $doc.cookie + '; ' : '') + c;
}`;

    // Previous "Improved" version without logs (for detection)
    const improvedFnNoLog = `function setCookieImpl(name_0, value_0, expires, domain, path, secure){
  var simple = name_0 + '=' + value_0;
  $doc.cookie = ($doc.cookie ? $doc.cookie + '; ' : '') + simple;
}`;

    // Improved version WITH logs
    const improvedFn = `function setCookieImpl(name_0, value_0, expires, domain, path, secure){
  console.log("[SDK_PATCH] setCookieImpl setting:", name_0, value_0);
  var simple = name_0 + '=' + value_0;
  $doc.cookie = ($doc.cookie ? $doc.cookie + '; ' : '') + simple;
  console.log("[SDK_PATCH] cookie jar:", $doc.cookie);
}`;

    if (content.includes(originalFn)) {
        content = content.replace(originalFn, improvedFn);
        console.log('Applied improved setCookieImpl patch (from original).');
        modified = true;
    } else if (content.includes(previousPatchFn)) {
        content = content.replace(previousPatchFn, improvedFn);
        console.log('Applied improved setCookieImpl patch (from previous patch).');
        modified = true;
    } else if (content.includes(improvedFnNoLog)) {
        content = content.replace(improvedFnNoLog, improvedFn);
        console.log('Upgraded setCookieImpl patch to v2 (with logs).');
        modified = true;
    } else if (content.includes('[SDK_PATCH] setCookieImpl')) {
        console.log('Improved setCookieImpl patch (v2) already present.');
    } else {
        console.log('Pattern not found for setCookieImpl, skipping.');
    }

    if (modified) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Finished patching priority-web-sdk.');
    } else {
        console.log('No changes needed, skipping write.');
    }

} catch (e) {
    console.error('Error patching:', e);
    process.exit(1);
}
