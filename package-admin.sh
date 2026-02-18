#!/bin/bash

echo "📦 Packaging Admin Panel for Firebase Hosting"
echo "=============================================="
echo ""

# Create package directory
mkdir -p /app/admin-package
cd /app/admin

echo "✅ Building admin panel..."
npx vite build

echo "✅ Copying files to package directory..."
cp -r dist/* /app/admin-package/

echo "✅ Creating firebase.json..."
cat > /app/admin-package/firebase.json << 'EOF'
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
EOF

echo "✅ Creating .firebaserc..."
cat > /app/admin-package/.firebaserc << 'EOF'
{
  "projects": {
    "default": "dmat-b0ce6"
  }
}
EOF

echo "✅ Creating README..."
cat > /app/admin-package/README.md << 'EOF'
# Stock Advisory Admin Panel - Static Files

## Quick Deploy

1. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login:
   ```
   firebase login
   ```

3. Deploy:
   ```
   firebase deploy --only hosting
   ```

Your admin panel will be live at: https://dmat-b0ce6.web.app
EOF

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📁 Package location: /app/admin-package/"
echo ""
echo "📋 Package contents:"
ls -lh /app/admin-package/
echo ""
echo "📊 Total size:"
du -sh /app/admin-package/
echo ""
echo "🎯 Next steps:"
echo "1. Download /app/admin-package/ folder"
echo "2. Run: firebase login"
echo "3. Run: firebase deploy --only hosting"
echo ""
echo "📖 Full guide: /app/FIREBASE_HOSTING_DEPLOYMENT.md"
