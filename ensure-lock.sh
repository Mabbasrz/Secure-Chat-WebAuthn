#!/bin/bash
# Ensure package-lock.json exists in backend
cd backend

if [ ! -f package-lock.json ]; then
    echo "package-lock.json not found, generating..."
    npm install
else
    echo "package-lock.json found"
fi

echo "Done"
