#!/bin/bash

# Script to generate and apply database migration
# Run this in your terminal: bash scripts/apply-migration.sh

cd "$(dirname "$0")/.."

echo "🔍 Generating migration..."
npm run db:generate

echo ""
echo "📝 Migration file generated. Review it in drizzle/ directory"
echo ""
echo "⚠️  IMPORTANT: When prompted about profile_id in seller_leads, select:"
echo "   '+ profile_id create column'"
echo ""
echo "🚀 To apply the migration, run:"
echo "   npm run db:push"
echo ""
echo "   OR manually execute the SQL from drizzle/0001_*.sql in Supabase"

