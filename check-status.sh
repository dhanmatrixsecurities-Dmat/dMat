#!/bin/bash

echo "=================================="
echo "Stock Advisory App - System Status"
echo "=================================="
echo ""

echo "📱 MOBILE APP STATUS:"
echo "--------------------"
EXPO_STATUS=$(sudo supervisorctl status expo | awk '{print $2}')
if [ "$EXPO_STATUS" = "RUNNING" ]; then
    echo "✅ Expo Mobile App: RUNNING"
    echo "   Access at: http://localhost:3000"
    echo "   Preview URL: Check Expo output for QR code"
else
    echo "❌ Expo Mobile App: NOT RUNNING"
fi
echo ""

echo "🌐 ADMIN PANEL STATUS:"
echo "--------------------"
ADMIN_STATUS=$(sudo supervisorctl status admin | awk '{print $2}')
if [ "$ADMIN_STATUS" = "RUNNING" ]; then
    echo "✅ Admin Panel: RUNNING"
    ADMIN_PORT=$(tail -20 /var/log/supervisor/admin.out.log | grep -oP 'localhost:\K[0-9]+' | tail -1)
    echo "   Access at: http://localhost:${ADMIN_PORT:-3003}"
else
    echo "❌ Admin Panel: NOT RUNNING"
fi
echo ""

echo "🔥 FIREBASE STATUS:"
echo "--------------------"
echo "   Project ID: dmat-b0ce6"
echo "   Config File: /app/frontend/google-services.json ✅"
echo ""
echo "   Required Setup (check Firebase Console):"
echo "   □ Phone Authentication enabled"
echo "   □ Firestore Database created"
echo "   □ Cloud Messaging enabled"
echo "   □ Admin user created"
echo ""

echo "=================================="
echo "📋 QUICK LINKS:"
echo "=================================="
echo ""
echo "Firebase Console:"
echo "  Main: https://console.firebase.google.com/project/dmat-b0ce6"
echo "  Authentication: https://console.firebase.google.com/project/dmat-b0ce6/authentication"
echo "  Firestore: https://console.firebase.google.com/project/dmat-b0ce6/firestore"
echo ""
echo "Documentation:"
echo "  Setup Checklist: /app/FIREBASE_SETUP_CHECKLIST.md"
echo "  Admin Panel Guide: /app/ADMIN_PANEL_COMPLETE.md"
echo "  Mobile App README: /app/MOBILE_APP_README.md"
echo ""
echo "=================================="
