'use strict';
// Express
const express = require('express');

const superagent = require('superagent');

// initialize a server
const server = express();


// Cross Origin Resource Sharing
const cors = require('cors');
server.use(cors()); // give access

// get all environment variable you need
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;


// Make the app listening
server.listen(PORT, () => console.log('Listening at port 3000'));



server.get('/', (request, response) => {
    response.status(200).send('App is working CLAAAAASS');
});

/* {
    "search_query": "lynwood",
    "formatted_query": "lynood,... ,WA, USA",
    "latitude": "47.606210",
    "longitude": "-122.332071"
  }
*/


server.get('/location', locationHandler);

function Location(city, locationData) {
    this.formatted_query = locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
    this.search_query = city;
}

function locationHandler(request, response) {
    // Read the city from the user (request) and respond
    let city = request.query['city'];
    getLocationData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}
function getLocationData(city) {
    const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;

    // Superagent
    return superagent.get(url)
        .then((data) => {
            let location = new Location(city, data.body);
            return location;
        });
}



server.get('/weather', weatherHandler);

function Weather(day) {
    this.time = new Date(day.time * 1000).toDateString();
    this.forecast = day.summary;
}

function weatherHandler(request, response) {
    let lat = request.query['latitude'];
    let lng = request.query['longitude'];
    getWeatherData(lat, lng)
        .then((data) => {
            response.status(200).send(data);
        });

}

function getWeatherData(lat, lng) {
    const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
    return superagent.get(url)
        .then((weatherData) => {
            console.log(weatherData.body.daily.data);
            let weather = weatherData.body.daily.data.map((day) => new Weather(day));
            return weather;
        });
}



server.use('*', (request, response) => {
    response.status(404).send('Sorry, not found');
});

server.use((error, request, response) => {
    response.status(500).send(error);
});


