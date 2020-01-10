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

    return "/users/" + email + "/events";

}

export async function getUserDetails(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api('/me').get();
    return user;
}


export async function getEvents(accessToken, dayStart, dayEnd, room) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
        .api(getAPIPath(room))
        .filter("start/dateTime ge '" +  dayStart +"'and end/dateTime le '"+ dayEnd +"'")
        .orderby('start/dateTime ASC')
        .get();
    return events;
}

export async function getNowEvent(accessToken, now, room) {

    const client = getAuthenticatedClient(accessToken);

    const events = await client
        .api(getAPIPath(room))
        .filter("start/dateTime le '" +  now +"' and end/dateTime ge '"+ now +"'")
        .orderby('start/dateTime ASC')
        .top(1)
        .get();

    return events;
}

export async function getNextEvent(accessToken, now, room) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
        .api(getAPIPath(room))
        .filter("start/dateTime ge '" +  now +"'")
        .orderby('start/dateTime ASC')
        .top(1)
        .get();

    return events;
}

export async function getBookUntilOptions(accessToken, now, room) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
        .api(getAPIPath(room))
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
    const afterTime = moment('17:30', "HH:mm").add(1, "minute");

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
