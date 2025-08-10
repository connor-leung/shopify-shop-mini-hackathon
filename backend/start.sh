#!/bin/bash

echo "🎮 Starting Gaming Leaderboard Backend..."

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby is not installed. Please install Ruby 3.2.0 or higher."
    exit 1
fi

# Check Ruby version
RUBY_VERSION=$(ruby -v | cut -d' ' -f2 | cut -d'p' -f1)
REQUIRED_VERSION="3.2.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$RUBY_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Ruby version $RUBY_VERSION is too old. Please install Ruby $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Ruby $RUBY_VERSION detected"

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "📦 Installing Bundler..."
    gem install bundler
fi

# Install dependencies
echo "📦 Installing dependencies..."
bundle install

# Create database if it doesn't exist
if [ ! -f "db/development.sqlite3" ]; then
    echo "🗄️  Setting up gaming database..."
    bundle exec rake db:create
    bundle exec rake db:migrate
    bundle exec rake db:seed
    echo "✅ Gaming database setup complete!"
    echo ""
    echo "🏆 Sample mock leaderboard created with 10 players"
    echo "📊 Sample users and scores added to database"
fi

# Start the server
echo "🌐 Starting gaming leaderboard server on http://localhost:4567"
echo "🎯 Available endpoints:"
echo "   - /api/scores (submit scores)"
echo "   - /api/leaderboard (view rankings)"
echo "   - /api/compare-score (analyze performance)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

bundle exec ruby app.rb
