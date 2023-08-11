require 'net/http'
require 'time'

url = "http://localhost:3000/photos"
url = URI(url)

req = Net::HTTP::Get.new(url, $headers)
res = Net::HTTP.start(url.host, url.port) {|http| http.request(req)}

request_time = Time.now - Time.parse(res['Date'])

puts request_time.to_f * 1000