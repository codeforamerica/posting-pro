set :public_dir, Proc.new { File.join(root, "_site") }
set :views, Proc.new { File.join(File.dirname(__FILE__), "views") }

post '/api', :provides => :json do
  #
  #
  # Code to handle api calls
  #
  #
  puts "Here comes your data!"
  puts params
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
