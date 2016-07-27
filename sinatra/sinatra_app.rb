require 'sinatra'
require 'sinatra/sequel'
require 'json'
require 'docx'
require 'dotenv'

require './sinatra/skills_engine.rb'

Dotenv.load

register Sinatra::SequelExtension
configure do
  set :database, ENV['DATABASE_URL']
  database.extension :pg_array, :pg_json
end

set :public_dir, proc { File.join(root, '_site') }
set :views, proc { File.join(File.dirname(__FILE__), 'views') }
enable :sessions
set :session_secret, ENV['SINATRA_SESSION_SECRET']

# check for un-run migrations
if ENV['RACK_ENV'].eql? 'development'
  Sequel.extension :migration
  Sequel::Migrator.check_current(database, 'sinatra/db/migrations')
end

# call the SkillsEngine API
post '/api/skillsengine/competencies' do
  data = JSON.parse(request.body.read)

  skills_engine_api = SkillsEngine.new(session['se_access_token'], session['se_token_expiry'])
  skills_engine_response = skills_engine_api.analyze_competencies(data['text'])
  if skills_engine_api.has_updated_token
    session['se_access_token'] = skills_engine_api.access_token
    session['se_token_expiry'] = skills_engine_api.token_expiry
  end

  skills_engine_response
end

before do
  response.headers['Cache-Control'] = 'public, max-age=36000'
end

# remove all trailing slashes
get %r{(/.*)\/$} do
  redirect params[:captures].first.to_s
end

post '/upload/word' do
  # upload that stuff
end

get '/templates' do
  content_type :json
  dataset = database[:templates]

  dataset.select_map([:id, :job_title]).to_json
end

get '/templates/:id' do
  content_type :json
  id = params[:id].to_i
  dataset = database[:templates]

  dataset[:id => id].to_json
end

# serve the jekyll site from the _site folder
get '/*' do
  file_name = "_site#{request.path_info}/index.html".gsub(%r{\/+}, '/')
  raise Sinatra::NotFound unless File.exist?(file_name)
  File.read(file_name)
end
