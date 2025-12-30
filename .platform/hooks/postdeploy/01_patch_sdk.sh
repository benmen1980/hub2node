#!/usr/bin/env bash
set -e

LOG=/tmp/patch_sdk.log
exec > $LOG 2>&1

echo "Running patch_sdk.js"
cd /var/app/current

# Fix permissions: Ensure the target file is writable before patching
# This resolves EACCES errors during deployment hooks
TARGET="node_modules/priority-web-sdk/index.js"
if [ -f "$TARGET" ]; then
    echo "Found $TARGET, attempting to relax permissions..."
    chmod 666 "$TARGET"
else
    echo "Warning: $TARGET not found!"
fi

node patch_sdk.js

echo "Done"
