#!/bin/bash

echo "🔍 Checking for Firebase SDK Mixing Issues..."
echo "=============================================="
echo ""

# Check for compat imports in code
echo "1. Checking for firebase/compat imports in code..."
COMPAT_COUNT=$(grep -r "firebase/compat" /app/frontend /app/admin 2>/dev/null | grep -v node_modules | wc -l)
if [ "$COMPAT_COUNT" -eq 0 ]; then
    echo "   ✅ No firebase/compat imports found in code"
else
    echo "   ❌ Found firebase/compat imports:"
    grep -r "firebase/compat" /app/frontend /app/admin 2>/dev/null | grep -v node_modules
fi
echo ""

# Check for @react-native-firebase packages
echo "2. Checking for @react-native-firebase packages..."
RN_FIREBASE=$(grep "@react-native-firebase" /app/frontend/package.json 2>/dev/null)
if [ -z "$RN_FIREBASE" ]; then
    echo "   ✅ No @react-native-firebase packages (good for Expo)"
else
    echo "   ⚠️  Found @react-native-firebase packages:"
    echo "$RN_FIREBASE"
fi
echo ""

# Check Firebase modular imports
echo "3. Checking Firebase modular SDK imports..."
MODULAR_IMPORTS=$(grep -r "from 'firebase/" /app/frontend/firebaseConfig.ts /app/frontend/contexts/AuthContext.tsx 2>/dev/null | grep -v compat | wc -l)
if [ "$MODULAR_IMPORTS" -gt 0 ]; then
    echo "   ✅ Using modular Firebase SDK imports"
else
    echo "   ❌ No modular Firebase imports found"
fi
echo ""

# Check initialization order
echo "4. Checking Firebase initialization order..."
INIT_IMPORT=$(grep "import '@/firebaseConfig'" /app/frontend/app/_layout.tsx 2>/dev/null)
if [ -n "$INIT_IMPORT" ]; then
    echo "   ✅ Firebase initialized at app entry point"
else
    echo "   ⚠️  Firebase might not be initialized early enough"
fi
echo ""

# Summary
echo "=============================================="
echo "📋 SUMMARY"
echo "=============================================="
echo ""

if [ "$COMPAT_COUNT" -eq 0 ] && [ -z "$RN_FIREBASE" ] && [ "$MODULAR_IMPORTS" -gt 0 ]; then
    echo "✅ All checks passed!"
    echo "   Your Firebase setup is clean and using modular SDK only."
else
    echo "⚠️  Some issues found. Review the checks above."
fi

echo ""
echo "🔥 Firebase Configuration:"
echo "   Project: dmat-b0ce6"
echo "   Mobile: /app/frontend/firebaseConfig.ts"
echo "   Admin:  /app/admin/src/firebaseConfig.ts"
echo ""
