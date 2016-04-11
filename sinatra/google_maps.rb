require 'rest-client'
require 'json'

module GoogleMaps

  def self.nearby_transit_stations_from_address(address)
    result = geocode(address)

    if result.nil?
      []
    else
      geocoded_address = JSON.parse(result)
      if geocoded_address['results'].nil? || geocoded_address['results'][0].nil?
        []
      else
        geometry = geocoded_address['results'][0]['geometry']
        places = nearby_places(geometry['location'], 'transit_station')
        if places.nil?
          []
        else
          JSON.parse(places)['results']
        end
      end
    end
  end

  def self.place_detail(place_id)
    response = RestClient.get('https://maps.googleapis.com/maps/api/place/details/json',
      { params: {
          placeid: place_id,
          key: ENV['GOOGLE_API_KEY']
        }
      })

    response.body
  end

  def self.directions(from_place_id, to_place_id)
    response = RestClient.get('https://maps.googleapis.com/maps/api/directions/json',
      { params: {
          origin: "place_id:#{from_place_id}",
          destination: "place_id:#{to_place_id}",
          mode: 'transit',
          key: ENV['GOOGLE_API_KEY']
        }
      })

    response.body
  end

  def self.geocode(address)
    response = RestClient.get('https://maps.googleapis.com/maps/api/geocode/json',
      { params: {
          address: address,
          key: ENV['GOOGLE_API_KEY']
        }
      })

    response.body
  end

  def self.nearby_places(location, type)
    response = RestClient.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      { params: {
          location: "#{location['lat']},#{location['lng']}",
          rankby: 'distance',
          type: type,
          key: ENV['GOOGLE_API_KEY']
        }
      })

    response.body
  end

end
