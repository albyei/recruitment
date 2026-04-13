#!/bin/bash
# Git Workflow Setup Script
# Run this to configure multi-repository Git workflow

echo "Setting up Git workflow for multi-repository..."

# Remove existing origin if exists
git remote remove origin 2>/dev/null

# Add origin as primary repo
git remote add origin https://github.com/wowrack-recruitment/recruitment-portal.git

# Add personal as backup repo
git remote add personal https://github.com/albyei/recruitment.git

# Set tracking branch
git branch --set-upstream-to=origin/main main 2>/dev/null || true

# Add git aliases
git config alias.pushall '!git push origin "$@" && git push personal "$@"'
git config alias.pushall-branch '!git push origin HEAD && git push personal HEAD'
git config alias.fetchall '!git fetch origin && git fetch personal'
git config alias.sync-backup '!git fetch origin main:main && git push personal main'

echo "Git workflow setup complete!"
echo "Verifying configuration..."
git remote -v
echo ""
echo "Available aliases:"
git config --get-regexp "^alias\."
