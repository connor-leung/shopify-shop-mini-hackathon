require 'rspec'
require 'rack/test'
require 'sinatra/activerecord'
require File.expand_path('../app', __dir__)

# Configure RSpec
RSpec.configure do |config|
  config.include Rack::Test::Methods
  
  # Use transactions for tests
  config.around(:each) do |example|
    ActiveRecord::Base.transaction do
      example.run
      raise ActiveRecord::Rollback
    end
  end
  
  # Clean up after tests
  config.after(:each) do
    User.destroy_all
    Post.destroy_all
    Comment.destroy_all
  end
end

# Test database configuration
ActiveRecord::Base.establish_connection(
  adapter: 'sqlite3',
  database: ':memory:'
)

# Run migrations for test database
ActiveRecord::Migration.verbose = false
ActiveRecord::Migration.migrate(File.expand_path('../db/migrate', __dir__))

def app
  Sinatra::Application
end
