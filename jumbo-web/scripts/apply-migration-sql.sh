#!/bin/bash

# Script to apply the migration SQL file directly to the database
# This bypasses drizzle-kit push which may fail silently

set -e  # Exit on error

cd /Users/tarun/code_projects/jumbo-crm/jumbo-web

echo "🔍 Checking for migration file..."
MIGRATION_FILE="drizzle/0001_loose_lily_hollister.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    echo "   Run 'npm run db:generate' first to create the migration"
    exit 1
fi

echo "✅ Migration file found: $MIGRATION_FILE"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "📝 Loading DATABASE_URL from .env.local..."
    if [ -f ".env.local" ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    else
        echo "❌ .env.local not found and DATABASE_URL not set"
        exit 1
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

echo "🚀 Applying migration..."
echo "   This may take 1-2 minutes..."

# Use psql to apply the migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify in Drizzle Studio: npm run db:studio"
    echo "   2. Check that new tables exist: notes, media_items, home_inspections, etc."
    echo "   3. Check that new columns exist in listings, leads, visits, etc."
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    echo ""
    echo "💡 Common issues:"
    echo "   - Some columns/enums might already exist (safe to ignore)"
    echo "   - Database connection issues"
    echo "   - Permission errors"
    exit 1
fi


