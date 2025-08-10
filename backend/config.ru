require 'bundler'
Bundler.require

require './app'

# Enable logging
use Rack::Logger

# Run the Sinatra application
run Sinatra::Application
