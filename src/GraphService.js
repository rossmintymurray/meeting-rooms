import axios from 'axios';
import moment from "moment";
var graph = require('@microsoft/microsoft-graph-client');


function getAuthenticatedClient(accessToken) {
    // Initialize Graph client
    const client = graph.Client.init({
        // Use the provided access token to authenticate
        // requests
        authProvider: (done) => {
            done(null, accessToken.accessToken);
        }
    });

    return client;
}

function getAPIPath(room) {
    var email = "";
    //Get email address flr selected room
    if (room === "board-room") {
        email = "newconfroom3@aspin4.onmicrosoft.com";
    } else  if (room === "meeting-room") {
        email = "oldconfroom3@aspin4.onmicrosoft.com";
    } else  if (room === "goldfish-bowl") {
        email = "goldfishbowl@aspin4.onmicrosoft.com";
    } else {
        return "/me/events";
    }

    return "/users/" + email + "/";

}

export async function getUserDetails(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api('/me').get();
    return user;
}

//Get all events for the day and place in an array
export async function getDaysEvents(accessToken, now, room) {

    //Get the client
    const client = getAuthenticatedClient(accessToken);

    //Set up current day start and end vars
    const start = moment(now).startOf("day").toISOString();
    const end = moment(now).endOf("day").toISOString();

    //Get all events for the day
    const daysEvents = await client
        .api(getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
        .orderby('start/DateTime ASC')
        .get();

    //Get the now event
    const nowEvent = getNowEvent(daysEvents.value, now);

    //Get the next event
    const nextEvent = getNextEvent(daysEvents.value, now);

    return [
        daysEvents,
        nowEvent,
        nextEvent
    ];

}

//Get all events for the day and place in an array -- Called asyncronously
export async function updateDaysEvents(accessToken, now, room) {

    //Get the client
    const client = getAuthenticatedClient(accessToken);

    //Set up current day start and end vars
    const start = moment(now).startOf("day").toISOString();
    const end = moment(now).endOf("day").toISOString();

    //Get all events for the day
    const daysEvents = await client
        .api(getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
        .orderby('start/DateTime ASC')
        .get();

    //Get the now event
    const nowEvent = getNowEvent(daysEvents.value, now);

    //Get the next event
    const nextEvent = getNextEvent(daysEvents.value, now);

    return [
        daysEvents,
        nowEvent,
        nextEvent
    ];
}

function getNowEvent(daysEvents, now) {

    var nowEvent =  daysEvents.filter(function(event) {
        return moment(event.start.dateTime).isSameOrBefore(moment(now)) &&  moment(event.end.dateTime).isSameOrAfter(moment(now))
    });

    //Iterate over daysEvents checking if there is one now
    //  daysEvents.map((event, key) => {
    //      if (moment(event.start.dateTime).isSameOrBefore(moment(now)) &&  moment(event.end.dateTime).isSameOrAfter(moment(now))) {
    //          nowEvent = event;
    //      }
    //  });

    return nowEvent;
}

function getNextEvent(daysEvents, now, ) {

    let nextEvent = [];
    //Iterate over daysEvents finding the next one
    daysEvents.map((event, key) => {
        if (moment(event.start.dateTime).isSameOrAfter(moment(now))) {
            nextEvent.push(event);
        }
    });

    //Remove all but the first item in the array
    nextEvent.splice(1, nextEvent.length);

    return nextEvent;
}

export async function getBookUntilOptions(accessToken, now, room) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
        .api(getAPIPath(room) + "events")
        .filter("start/dateTime ge '" +  now +"'")
        .orderby('start/dateTime ASC')
        .top(1)
        .get();

    //Set up times array
    let times = [];

    //Get the next available 15 minute interval
    const roundedUp = Math.ceil(moment().minute() / 15) * 15;
    let bookTime = moment().minute(roundedUp).second(0);

    //Only show book times between these
    const beforeTime = moment('08:30', "HH:mm");
    const afterTime = moment('23:30', "HH:mm").add(1, "minute");

    //Iterate over the 15 minute interval until booking time reaches next booking
    while(moment(bookTime).isBefore(moment(events.value[0].start.dateTime).add(1, 'minute'))) {

        //Get the hour of the book time (so we can start each hour on new line)
        let hour = moment(bookTime).format("HH");
        if (bookTime.isBetween(beforeTime, afterTime)) {
            //Check if hour array exists
            if(hour in times) {
                //Set following hours
                times[hour].push(bookTime);
            } else {
                //Set first hour
                times[hour] = [bookTime];
            }
        }

        //Increment the book time by 15 minutes
        bookTime = (moment(bookTime).add(15, 'minutes'));
    }

    return times;
}

export async function createEvent(accessToken, apiData, room) {

    let result = [];
    //Set up headers and access token
    let config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + accessToken
        }
    };

    //Post data to api
    await axios.post('https://graph.microsoft.com/v1.0/'  + (getAPIPath(room)), apiData,config)
        .then(res => {
            result = res;
        });

    return result;

}

export async function updateEvent(accessToken, apiData, room, id) {

    let result = [];
    //Set up headers and access token
    let config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + accessToken
        }
    };

    //Post data to api
    await axios.patch('https://graph.microsoft.com/v1.0'  + (getAPIPath(room)) + '/' + id, apiData,config)
        .then(res => {
            result = res;
        });

    return result;

}

export async function getFreeRooms(accessToken, now, room) {

    const client = getAuthenticatedClient(accessToken);

        var roomEvent = client
            .api(getAPIPath(room))
            .filter("start/dateTime le '" +  now +"' and end/dateTime ge '"+ now +"'")
            .orderby('start/dateTime ASC')
            .top(1)
            .get();

    return roomEvent;
}
