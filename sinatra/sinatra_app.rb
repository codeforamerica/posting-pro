require 'sinatra'
require 'sinatra/sequel'
require 'json'
require 'dotenv'

require './sinatra/skills_engine.rb'

Dotenv.load

register Sinatra::SequelExtension
configure do
  set :database, ENV['DATABASE_URL']
  database.extension :pg_array, :pg_json
end

set :public_dir, proc { File.join(root, '_site/asset') }
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

  skills_engine_api = SkillsEngine.new(session['se_access_token'],
                                       session['se_token_expiry'])
  skills_engine_response = skills_engine_api.analyze_competencies(data['text'])
  if skills_engine_api.has_updated_token
    session['se_access_token'] = skills_engine_api.access_token
    session['se_token_expiry'] = skills_engine_api.token_expiry
  end

  skills_engine_response
end

helpers do
  def protected!
    return if authorized?
    headers['WWW-Authenticate'] = 'Basic realm="Restricted Area"'
    halt 401, "Not authorized\n"
  end

  def authorized?
    @auth ||=  Rack::Auth::Basic::Request.new(request.env)
    if @auth.provided? &&
       @auth.basic? &&
       @auth.credentials &&
       @auth.credentials == [ENV['ADMIN_USER'], ENV['ADMIN_PASSWORD']]
    end
  end
end

before do
  response.headers['Cache-Control'] = 'public, max-age=36000'
end

# remove all trailing slashes
get %r{(/.*)\/$} do
  redirect params[:captures].first.to_s
end

get '/api/templates' do
  content_type :json
  cache_control :no_cache
  dataset = database[:templates]

  dataset.select(:id, :job_title).all.to_json
end

get '/api/templates/:id' do
  content_type :json
  id = params[:id].to_i
  dataset = database[:templates]

  dataset[id: id].to_json
end

post '/api/templates/:id/delete' do
  protected!
  content_type :json

  id = params[:id].to_i
  dataset = database[:templates]
  dataset.filter(id: id).delete

  status 200
  { id: id }.to_json
end

post '/api/templates' do
  protected!
  content_type :json

  data = JSON.parse(request.body.read)

  example_activities = '{}'
  if data['example_activities'].any?
    example_activities = Sequel.pg_array(data['example_activities'])
  end

  req_certifications = '{}'
  if data['req_certifications'].any?
    req_certifications = Sequel.pg_array(data['req_certifications'])
  end

  dataset = database[:templates]
  dataset.insert(
    job_title: data['job_title'],
    company_description: data['company_description'],
    job_description: data['job_description'],
    req_occupational_skills: Sequel.pg_json(data['req_occupational_skills']),
    req_foundational_skills: Sequel.pg_json(data['req_foundational_skills']),
    pref_occupational_skills: Sequel.pg_json(data['pref_occupational_skills']),
    pref_foundational_skills: Sequel.pg_json(data['pref_foundational_skills']),
    example_activities: example_activities,
    req_certifications: req_certifications
  )

  status 200
  data.to_json
end

# serve secured section for 'manage' folder
get '/admin' do
  redirect to('/manage')
end

get '/manage' do
  protected!
  file_name = "_site#{request.path_info}/index.html".gsub(%r{\/+}, '/')
  raise Sinatra::NotFound unless File.exist?(file_name)
  File.read(file_name)
end

# serve the jekyll site from the _site folder
get '/*' do
  file_name = "_site#{request.path_info}/index.html".gsub(%r{\/+}, '/')
  raise Sinatra::NotFound unless File.exist?(file_name)
  File.read(file_name)
end
