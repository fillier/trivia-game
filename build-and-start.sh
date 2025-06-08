#!/bin/bash

echo "🎯 Building Trivia Game for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the root voting-game directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm install
cd ../dashboard && npm install  
cd ../mobile && npm install
cd ..

# Build React applications
echo "🏗️ Building React applications..."
cd dashboard
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Dashboard build failed"
    exit 1
fi
echo "✅ Dashboard built successfully"

cd ../mobile
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Mobile build failed"
    exit 1
fi
echo "✅ Mobile built successfully"

cd ..

# Start server
echo "🚀 Starting production server..."
cd server
NODE_ENV=production npm start