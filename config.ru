# ruby
$stdout.sync = true
require 'sinatra'
require './sinatra/sinatra_app'
run Sinatra::Application
