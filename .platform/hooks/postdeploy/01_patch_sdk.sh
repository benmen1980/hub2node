#!/usr/bin/env bash
set -e

LOG=/tmp/patch_sdk.log
exec > $LOG 2>&1

echo "Running patch_sdk.js"
cd /var/app/current

node patch_sdk.js

echo "Done"
