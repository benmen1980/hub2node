const fs = require('fs');
const path = 'node_modules/priority-web-sdk/index.js';

try {
    if (!fs.existsSync(path)) {
        console.log('Priority SDK not found at ' + path + ', skipping patch.');
        process.exit(0);
    }
    let content = fs.readFileSync(path, 'utf8');

    // Patch 1: expose cookies
    const sdkPatchTarget = `updateAccessToken: function(accessToken, onSuccess, onError) {
            return syncExports.updateAccessToken(accessToken, onSuccess, onError);
          }`;

    const sdkPatchReplacement = `updateAccessToken: function(accessToken, onSuccess, onError) {
            return syncExports.updateAccessToken(accessToken, onSuccess, onError);
          },
          getCookies: function() { return fakeWindow && fakeWindow.document ? fakeWindow.document.cookie : ""; }`;

    if (content.includes(sdkPatchTarget) && !content.includes('getCookies: function()')) {
        content = content.replace(sdkPatchTarget, sdkPatchReplacement);
        console.log('Applied getCookies patch.');
    } else if (content.includes('getCookies: function()')) {
        console.log('getCookies patch already present.');
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

    // Improved version: stores only name=value
    const improvedFn = `function setCookieImpl(name_0, value_0, expires, domain, path, secure){
  var simple = name_0 + '=' + value_0;
  $doc.cookie = ($doc.cookie ? $doc.cookie + '; ' : '') + simple;
}`;

    if (content.includes(originalFn)) {
        content = content.replace(originalFn, improvedFn);
        console.log('Applied improved setCookieImpl patch (from original).');
    } else if (content.includes(previousPatchFn)) {
        content = content.replace(previousPatchFn, improvedFn);
        console.log('Applied improved setCookieImpl patch (from previous patch).');
    } else if (content.includes('var simple = name_0 + \'=\' + value_0;')) {
        console.log('Improved setCookieImpl patch already present.');
    } else {
        console.log('Pattern not found for setCookieImpl, skipping.');
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Finished patching priority-web-sdk.');

} catch (e) {
    console.error('Error patching:', e);
    process.exit(1);
}
