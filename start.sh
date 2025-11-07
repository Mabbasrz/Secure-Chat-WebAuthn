#!/bin/bash
set -e

echo "🚀 Starting CrypTalk Backend..."

cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the server
echo "✅ Starting server..."
npm start
