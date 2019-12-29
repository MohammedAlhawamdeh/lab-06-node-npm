'use strict';

// step 1 get all the libraries
//==============================
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
require('dotenv').config();
const pg = require('pg');
const client = new pg.Client();
const server = express();// initialize a server
server.use(cors());// give access to anyone

// Step 2 identify the PORT and read them from the .env file
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;// locationIQ
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;//DARKSKY API
const EVENTFUL_API_KEY = process.env.EVENTFUL_API_KEY;//EVENT API
const MOVIES_API_KEY = process.env.MOVIE_API_KEY;//MOVIES API
const YELP_API_KEY = process.env.YELP_API_KEY;//YELP API KEY

// Step 3 Let the server listen from the node.js
server.listen(PORT, () => console.log('Listening to port 3000'));

// identify a route for a proof of life
server.get('/', (request, response) => {
  response.status(200).send('IT IS ALIVE');
});


//==================================
// NOW working for the LOCATION PART and STORE IT in our local DATABASE

// initialize the route
server.get('/location', locationHandler);

// create a constructor function
function Location(city, data) {
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
  this.search_query = city;
}
// create a handler function to make it easier to read the code
function locationHandler(request, response) {
  let city = request.query['city'];
  getLocationData(city)
    .then((data) => {
      response.status(200).send(data);
    });
}
// Get the locationDATA to the constructor and store it to local database
function getLocationData(city) {
  let sql = `SELECT * FROM location WHERE formatted_query = $1`;
  let values = [city];
  return client.query(sql, values)
    .then(results => {
      if (results.rowCount) {
        return results.rows[0];
      } else {// in case we don't have the data locally , we get it from the API
        const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;
        return superagent.get(url)
          .then(data => dataStoreLocation(city, data.body));
      }
    });
}
// now we need to do two things here , 1- instantiate new objects from our constructor 2- insert this data to the local Database
//===================================
function dataStoreLocation(city, data) {
  const location = new Location(city, data[0]);
  let SQL = `INSERT INTO location (formatted_query, latitude, longitude) 
VALUES ($1, $2, $3) 
RETURNING *
`;
  // adding those values in our table in the Database
  let values = [city, location.latitude, location.longitude];
  return client.query(SQL, values)
    .then(results => results.rows[0]);
}

// Now doing the same thing for weather except with no storing to the DB
//=================================
server.get('/weather', weatherHandler);// intializing the route


// creating the contructor and converting the 'time' to the required type
function Weather(day) {
  this.time = new Date(day.time * 1000).toDateString();
  this.forecast = day.summary;
}
// creating the handler function 
function weatherHandler(request, response) {
  let lat = request.query['latitude'];
  let lng = request.query['longitude'];
  getWeatherData(lat, lng)
    .then((data) => {
      response.status(200).send(data);
    });

}
// getting the data to our constructor function from the url
function getWeatherData(lat, lng) {
  const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
  return superagent.get(url)
    .then((weatherData) => {
      // we used loop through the number of days we have so that we make sure we get data for every single day of the week
      let weather = weatherData.body.daily.data.map((day) => new Weather(day));
      return weather;
    });
}

// doing the same for events 
//===============================
server.get('/events', eventHandler);

function Event(day) {
  this.link = day.url;
  this.name = day.title;
  this.eventDate = day.start_time;
  this.summary = day.description;
}

function eventHandler(request, response) {
  let lat = request.query['latitude'];
  let lng = request.query['longitude'];
  getEventData(lat, lng)
    .then((data) => {
      response.status(200).send(data);
    });

}

function getEventData(lat, lng) {
  const url = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&where=${lat},${lng}`;
  return superagent.get(url)
    .then((eventData) => {
      let data = JSON.parse(eventData.text);// converting the data we get from this website to JSON
      let events = data.events.event.map((day) => new Event(day));// looping through all days to get events for every single day of the week
      return events;
    });
}

// doing the same for movies 
//=============================
server.get('/movies', movieHandler);

function Movie(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
}

function movieHandler(request, response) {
  let city = request.query['city'];
  getMoviesData(city)
    .then((data) => {
      response.status(200).send(data);
    });
}

function getMoviesData(city) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIES_API_KEY}&query=${city}`;
  return superagent.get(url)
    .then((movieData) => {
      let movie = movieData.body.results.map(movie => new Movie(movie));
      return movie;
    })
}

// doing the same for YELP
//=================================
server.get('/yelp', yelpHandler);

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}

function yelpHandler(request, response) {
  let lat = request.query['latitude'];
  let lng = request.query['longitude'];
  lookForYelp(lat, lng)
    .then((data) => {
      response.status(200).send(data);
    });
}

function lookForYelp(lat, lng) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurant&latitude=${lat}&longitude=${lng}`;
  return superagent.get(url)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)// this is how we add authentication to the header so that it prevents error occuring from requesting data from the API
    .then((yelpData) => {
      let yelp = yelpData.body.businesses.map((business) => new Yelp(business))
      return yelp;
    })
};


/*
//===================================
==================================//
*/
// in case if the route doesn't exist
server.use('*', (request, response) => {
  response.status(404).send('Sorry, not found');
});
// in case if the server is down
server.use((error, request, response) => {
  response.status(500).send(error);
});

client.on('error', error => { throw error; })
client.connect().then(() => { server.listen(PORT, () => console.log(`Server runs on ${PORT}`)); })