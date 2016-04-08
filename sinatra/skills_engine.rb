require 'rest-client'
require 'json'

module SkillsEngine
  @@client_id = ENV['SKILLS_ENGINE_ID']
  @@client_secret = ENV['SKILLS_ENGINE_SECRET']
  @@access_token = nil

  private_class_method def self.get_access_token
    if @@access_token.nil?
      @@access_token = fetch_new_access_token
    end

    @@access_token
  end

  private_class_method def self.fetch_new_access_token
    response = RestClient.post('https://api.skillsengine.com/oauth/token', {
      grant_type: 'client_credentials',
      client_id: @@client_id,
      client_secret: @@client_secret
    })

    JSON.parse(response)["access_token"]
  end

  def self.analyze_competencies(text)
    access_token = get_access_token

    response = RestClient.post('https://api.skillsengine.com/v2/competencies/analyze',
      { text: text },
      { 'Authorization': "Bearer #{access_token}", 'Accept-Encoding': 'gzip,deflate' })

    response.body
  end
end
