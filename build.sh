#!/bin/bash

echo "🎯 Building Trivia Game for Production..."

# Install dependencies for all projects
echo "📦 Installing dependencies..."
cd server && npm install
cd ../dashboard && npm install  
cd ../mobile && npm install
cd ..

# Build React applications
echo "🏗️ Building React applications..."
cd dashboard && npm run build
cd ../mobile && npm run build
cd ..

echo "✅ Build complete!"
echo "🚀 Run 'npm start' in the server directory to start production server"
