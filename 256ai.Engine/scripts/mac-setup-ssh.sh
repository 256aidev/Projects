#!/bin/bash
# Run this on the Mac to allow Dragon to SSH in
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBubjLd34Z857mcmadMYeKGi2NjYv52Mry+TJZZ/BvZI dragon-to-mac" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "Done! Dragon can now SSH into this Mac."
