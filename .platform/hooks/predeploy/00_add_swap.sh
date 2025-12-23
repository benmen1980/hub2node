#!/bin/bash
set -e

SWAPFILE=/swapfile
SWAPSIZE=2G

# If swap already active, do nothing
if swapon --show | grep -q "$SWAPFILE"; then
  echo "Swap already enabled"
  exit 0
fi

# Create swap file if missing
if [ ! -f "$SWAPFILE" ]; then
  echo "Creating swap file..."
  fallocate -l $SWAPSIZE $SWAPFILE || dd if=/dev/zero of=$SWAPFILE bs=1M count=2048
  chmod 600 $SWAPFILE
  mkswap $SWAPFILE
fi

# Enable swap
swapon $SWAPFILE

# Persist swap across reboots
grep -q "$SWAPFILE" /etc/fstab || echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab

echo "Swap setup completed"
