'use strict';
const express = require('express');
const superagent = require('superagent')
const server = express();

const cors = require('cors');
server.use(cors());

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTFUL_API_KEY = process.env.EVENTFUL_APP_KEY;

server.listen(PORT, () => {
    console.log('its work');
})

server.get('/', (request, response) => {
    response.status(200).send('Okay its found');
});
// ///////////////////////////
server.get('/location', locationRndering);

function Location(city, locationData) {
    this.formatted_query = locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
    this.search_query = city;
}

function locationRndering(request, response) {
    let city = request.query['city'];
    getLocationData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}
function getLocationData(city) {
    const locationUrl = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;
    return superagent.get(locationUrl)
        .then((data) => {
            // console.log(data.body)
            const location = new Location(city, data.body);
            return location;
        });
}
// //////////////////////
server.get('/weather', weatherrenderring);

function Weather(day) {
    this.time = new Date(day.time * 1000).toDateString()
    this.forecast = day.summary;
}
function weatherrenderring(request,response){
    let lat = request.query['latitude'];
    let lng = request.query['longitude'];
    getWeatherData(lat,lng)
    .then((data) =>{
        response.status(200).send(data);
    });
    }
function getWeatherData(lat,lng){
    const weatherUrl = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
    return superagent.get(weatherUrl)
    .then((weatherData) =>{
        let weather = weatherData.body.daily.data.map((day) => new Weather(day));
        return weather;
    });
}
// ///////////////////////////

//     {
    //       "link": "http://seattle.eventful.com/events/seattle-code-101-explore-software-development-/E0-001-126675997-3?utm_source=apis&utm_medium=apim&utm_campaign=apic",
    //       "name": "Seattle Code 101: Explore Software Development",
    //       "event_date": "Sat Dec 7 2019",
    //       "summary": "Thinking about a new career in software development? Start here! In this one-day workshop, you&#39;ll get a taste of a day in the life of a software developer. Code 101 helps you learn what it’s like to be a software developer through a day-long immersive course for beginners that focuses on front-end web development technologies. "
    //     },
    server.get('/events', eventfulRndering);

function Eventful(eventData) {
    this.link  = eventData[0].url;                                                                                                                                               
    this.name = eventData[0].title;
    this.event_date = eventData[0].start_time;
    this.summary = eventData[0].description;
}

function eventfulRndering(request, response) {
    let city = request.query.formatted_query;
    getEventfulData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}
function getEventfulData(city) {
    const eventfulUrl = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&location=${city}`;
    // console.log(eventfulUrl)
    return superagent.get(eventfulUrl)
    .then((eventfulData) => {
        let jsonData = JSON.parse(eventfulData.text).events.event;
        console.log(jsonData);
        const eventful = jsonData.map((day) => new Eventful(jsonData));

            return eventful;
        });
}


// http://api.eventful.com/json/events/search?app_key=PNCrgkt3XvWJFfQm&location=${amman}/limit=1

server.use('*', (request, response) => {
    response.status(404).send('its not found ')
});
// //////////////////////////////////
server.use((error, request, response) => {
    response.status(500).send("Sorry, something went wrong");
});
