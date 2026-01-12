#!/bin/bash

# SendGrid Setup Script for ChrisCandle
# This script helps set up SendGrid API key for Firebase Functions

echo "🔧 SendGrid Setup for ChrisCandle"
echo ""

# Check if sendgrid.env already exists
if [ -f "sendgrid.env" ]; then
  echo "⚠️  sendgrid.env already exists. Skipping creation."
else
  # Prompt for API key
  echo "Enter your SendGrid API Key:"
  read -s SENDGRID_KEY
  
  # Create sendgrid.env file
  echo "export SENDGRID_API_KEY='$SENDGRID_KEY'" > sendgrid.env
  echo "✅ Created sendgrid.env file"
fi

# Ensure sendgrid.env is in .gitignore
if grep -q "sendgrid.env" .gitignore; then
  echo "✅ sendgrid.env already in .gitignore"
else
  echo "sendgrid.env" >> .gitignore
  echo "✅ Added sendgrid.env to .gitignore"
fi

# Set Firebase Functions config
echo ""
echo "📝 Setting Firebase Functions config..."
echo "Enter your SendGrid API Key for Firebase (or press Enter to skip):"
read -s FIREBASE_KEY

if [ ! -z "$FIREBASE_KEY" ]; then
  firebase functions:config:set sendgrid.key="$FIREBASE_KEY"
  echo "✅ Firebase Functions config updated"
else
  echo "⏭️  Skipped Firebase config (you can set it later with:)"
  echo "   firebase functions:config:set sendgrid.key=\"YOUR_KEY\""
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd functions && npm install"
echo "2. npm run build"
echo "3. firebase deploy --only functions"
