'use strict';
// Express
const express = require('express');

// initialize a server
const server = express();


// Cross Origin Resource Sharing
const cors = require('cors');
server.use(cors()); // give access

// get all environment variable you need
require('dotenv').config();
const PORT = process.env.PORT || 3000;

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
 
 function Location(city, locationData){
     this.formatted_query = locationData[0].display_name;
     this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
    this.search_query = city;
}





//=============================================================
const DaysWeather = function(forecast,time){
    this.forecast = forecast;
    console.log(this.forecast)
    this.time = new Date(time * 1000).toDateString();
};
  //=================================================================
  // Function for getting all the daily weather
function getDailyWeather(weatherData){
        let dailyWeather = [];
        let weatherLength = weatherData.daily.data.length;
    console.log(weatherLength)
    for (let i = 0; i < weatherLength; i++) {
          let day = new DaysWeather(weatherData.daily.data[i].summary, weatherData.daily.data[i].time);
          dailyWeather.push(day);
        }
        return dailyWeather;
      }

    
    server.get('/location', (request, response) => {
        // Read the city from the user (request)
    // find the city in geo.json
    
    const locationData = require('./data/geo.json');
    let location = new Location("lynwood", locationData);
    response.status(200).send(location);
});





//==============================================================



server.get('/weather', (request, response) => {
    //check for json file
    let weatherData = require('./data/darksky.json');
    let weather = getDailyWeather(weatherData);
    console.log(weather)
      response.status(200).send(weather);
    });

















    server.use('*', (request, response) => {
        response.status(404).send('Sorry, not found');
    });
    
    server.use((error, request, response) => {
        response.status(500).send(error);
    });
    
    
    