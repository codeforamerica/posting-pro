set :public_dir, Proc.new { File.join(root, "_site") }
set :views, Proc.new { File.join(File.dirname(__FILE__), "views") }
enable :sessions
set :session_secret, ENV['SINATRA_SESSION_SECRET']

require './sinatra/skills_engine.rb'
require './sinatra/google_maps.rb'
require 'json'

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

# get nearby transit locations from Google Maps API
get '/api/googlemaps/nearby_transit' do
  results = GoogleMaps.nearby_transit_stations_from_address(params['address'])
  results.take(3)
end


before do
    response.headers['Cache-Control'] = 'public, max-age=36000'
end

# remove all trailing slashes
get %r{(/.*)\/$} do
  redirect "#{params[:captures].first}"
end

# serve the jekyll site from the _site folder
get '/*' do
    file_name = "_site#{request.path_info}/index.html".gsub(%r{\/+},'/')
    if File.exists?(file_name)
  File.read(file_name)
    else
  raise Sinatra::NotFound
    end
end
