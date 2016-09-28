require 'rest-client'
require 'json'

# Not currently used, remains for reference
# Wrap calls to the SkillsEngine API & handle auth
class SkillsEngine
  attr_reader :token_expiry, :has_updated_token

  def initialize(access_token, token_expiry)
    @access_token = access_token
    @token_expiry = token_expiry
    @has_updated_token = false

    @test_json = File.read('./sinatra/test/sample.json') if dev_mode?
  end

  def access_token
    t = Time.now
    update_access_token if @access_token.nil? || t.to_i >= @token_expiry
    @access_token
  end

  def analyze_competencies(text)
    return @test_json if dev_mode?

    response = RestClient.post('https://api.skillsengine.com/v2/competencies/analyze',
                               { text: text },
                               'Authorization': "Bearer #{access_token}",
                               'Accept-Encoding': 'gzip,deflate')
    response.body
  end

  private

  def update_access_token
    response = RestClient.post('https://api.skillsengine.com/oauth/token',
                               grant_type: 'client_credentials',
                               client_id: ENV['SKILLS_ENGINE_ID'],
                               client_secret: ENV['SKILLS_ENGINE_SECRET'])

    json_response = JSON.parse(response)
    @token_expiry = json_response['created_at'] + json_response['expires_in']
    @access_token = json_response['access_token']
    @has_updated_token = true
  end

  def dev_mode?
    ENV['RACK_ENV'] == 'development'
  end
end
