#!/bin/bash
# =============================================================================
# Package GHMS for Deployment
# Run this on your DEVELOPMENT machine to create the deployable archive
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }

PROJECT_DIR="/home/z/my-project/ghms-clone"
OUTPUT="/home/z/my-project/scripts/ghms-deploy.tar.gz"

log_info "Packaging GHMS from: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Create the archive excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='db' \
    --exclude='.git' \
    --exclude='tool-results' \
    --exclude='download' \
    --exclude='*.log' \
    -czf "$OUTPUT" .

SIZE=$(du -h "$OUTPUT" | cut -f1)
log_ok "Archive created: $OUTPUT ($SIZE)"
echo ""
echo "Next steps:"
echo "  1. SCP both files to your server:"
echo "     scp /home/z/my-project/scripts/deploy-ghms.sh ghms@YOUR_SERVER_IP:/home/ghms/"
echo "     scp /home/z/my-project/scripts/ghms-deploy.tar.gz ghms@YOUR_SERVER_IP:/home/ghms/"
echo ""
echo "  2. SSH into the server and run:"
echo "     ssh ghms@YOUR_SERVER_IP"
echo "     cd /home/ghms"
echo "     chmod +x deploy-ghms.sh"
echo "     sudo ./deploy-ghms.sh"
