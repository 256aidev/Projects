#!/bin/bash
# ChoreQuest server setup - run this on the Ubuntu server
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBubjLd34Z857mcmadMYeKGi2NjYv52Mry+TJZZ/BvZI dragon-to-mac' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo ""
echo "=== SSH key installed ==="
echo ""
echo "Your IP address is:"
hostname -I
echo ""
echo "Done! Tell Claude the IP address above."
