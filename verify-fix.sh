#!/bin/bash

echo "========================================"
echo "Email Invite Links Fix - Verification"
echo "========================================"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✓ .env file found"
    
    # Check if VITE_APP_URL is configured
    if grep -q "VITE_APP_URL" .env; then
        APP_URL=$(grep "VITE_APP_URL" .env | cut -d '=' -f2)
        echo "✓ VITE_APP_URL is configured: $APP_URL"
        
        # Check if it's still localhost
        if echo "$APP_URL" | grep -q "localhost"; then
            echo ""
            echo "⚠️  WARNING: VITE_APP_URL is set to localhost"
            echo ""
            echo "For production, update .env with your deployed URL:"
            echo "  VITE_APP_URL=https://yourdomain.com"
            echo ""
            echo "For local testing, use ngrok:"
            echo "  1. Run: ngrok http 5173"
            echo "  2. Update VITE_APP_URL with the ngrok URL"
            echo "  3. Restart your dev server"
            echo ""
        else
            echo "✓ Using public URL (not localhost)"
        fi
    else
        echo "✗ VITE_APP_URL not found in .env"
        echo "  Please add: VITE_APP_URL=https://yourdomain.com"
    fi
else
    echo "✗ .env file not found"
fi

echo ""

# Check if utility file exists
if [ -f "src/utils/appUrl.ts" ]; then
    echo "✓ URL utility functions exist (src/utils/appUrl.ts)"
else
    echo "✗ URL utility file missing"
fi

echo ""

# Check if documentation exists
echo "Documentation Files:"
[ -f "QUICK_FIX_GUIDE.md" ] && echo "  ✓ QUICK_FIX_GUIDE.md" || echo "  ✗ QUICK_FIX_GUIDE.md missing"
[ -f "INVITE_LINKS_SETUP.md" ] && echo "  ✓ INVITE_LINKS_SETUP.md" || echo "  ✗ INVITE_LINKS_SETUP.md missing"
[ -f "CHANGES_SUMMARY.md" ] && echo "  ✓ CHANGES_SUMMARY.md" || echo "  ✗ CHANGES_SUMMARY.md missing"

echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo ""
echo "1. Read QUICK_FIX_GUIDE.md for immediate fix"
echo "2. Update VITE_APP_URL in .env file"
echo "3. Restart your development server"
echo "4. Test by sending yourself an invite"
echo ""
echo "For detailed instructions, see:"
echo "  - INVITE_LINKS_SETUP.md (full setup guide)"
echo "  - CHANGES_SUMMARY.md (what was changed)"
echo ""
