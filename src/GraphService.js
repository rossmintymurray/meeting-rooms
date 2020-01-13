import axios from 'axios';
import moment from "moment";
import config from './Config';
var graph = require('@microsoft/microsoft-graph-client');
const qs = require('qs');

export async function getAPIAccessToken() {
    const APP_ID = config.appId;
    const APP_SECRET = config.appSecret;
    const TOKEN_ENDPOINT ='https://login.microsoftonline.com/' + config.tenantId + '/oauth2/v2.0/token';
    const MS_GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

    const postData = {
        grant_type:'client_credentials',
        client_id: APP_ID,
        scope: MS_GRAPH_SCOPE,
        client_secret: APP_SECRET,
    };

    let result = "";

    axios.defaults.headers.post['Content-Type'] =
        'application/x-www-form-urlencoded';

    await axios.post(TOKEN_ENDPOINT, qs.stringify(postData))
        .then(response => {
            result = response.data["access_token"];
        })
        .catch(error => {
            console.log(error);
    });

    return result;

}

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

//Get all events for the day and place in an array
export async function getDaysEvents(accessToken, now, room) {

    //Set up current day start and end vars
    const start = moment(now).startOf("day").toISOString();
    const end = moment(now).endOf("day").toISOString();

    let daysEvents = [];

    //Set up headers and access token
    axios.defaults.headers.get['Authorization'] =
        'Bearer ' + accessToken;

    //Post data to api
    await axios.get('https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
        .then(res => {
            daysEvents = res;
        });

    //Get all events for the day
    // const daysEvents = await client
    //     .api(getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
    //     .orderby('start/DateTime ASC')
    //     .get();


    //Get the now event
    const nowEvent = await getNowEvent(daysEvents.data.value, now);
    console.log(nowEvent);
    //Get the next event
    const nextEvent = await getNextEvent(accessToken, daysEvents.value, now, room);

    return [
        daysEvents.data,
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

async function getNextEvent(accessToken, daysEvents, now, room) {
    console.log(daysEvents);

    let events = [];
    let nextEvents = [];

    //Check if any daysEvents exist
    if(!daysEvents) {
        //Get events up to a week in advance
        //Set up current day start and end vars
        const start = moment(now).toISOString();
        const end = moment(now).add("1", "week").toISOString();

        //Set up headers and access token
        axios.defaults.headers.get['Authorization'] =
            'Bearer ' + accessToken;

        //Post data to api
        await axios.get('https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
            .then(res => {
                events = res.data.value;

                //Iterate over daysEvents finding the next one
                events.map((event, key) => {
                    if (moment(event.start.dateTime).isSameOrAfter(moment(now))) {
                        nextEvents.push(event);
                    }
                });

                let nextEvent = [];
                nextEvent.push(nextEvents[0]);
                console.log(nextEvent);
                return nextEvent;

            });
    } else {
        //Next event is today
        events = daysEvents;

        //Iterate over daysEvents finding the next one
        events.map((event, key) => {
            if (moment(event.start.dateTime).isSameOrAfter(moment(now))) {
                nextEvents.push(event);
            }
        });
    }
    //Remove all but the first item in the array
    let nextEvent = [];
    nextEvent.push(nextEvents[0]);
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
    await axios.patch('https://graph.microsoft.com/v1.0'  + (getAPIPath(room)) + 'events/' + id, apiData,config)
        .then(res => {
            result = res;
        });

    return result;

}

export async function getFreeRooms(accessToken, now, room) {

    const client = getAuthenticatedClient(accessToken);

    //Set up current day start and end vars
    const start = moment(now).startOf("day").toISOString();
    const end = moment(now).endOf("day").toISOString();

    //Get all events for the day
    const daysEvents = await client
        .api(getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
        .orderby('start/DateTime ASC')
        .get();

    if(daysEvents.length > 0) {
        var roomEvent = daysEvents.filter(function (event) {
            return moment(event.start.dateTime).isSameOrBefore(moment(now)) && moment(event.end.dateTime).isSameOrAfter(moment(now))
        });
    }

    return daysEvents;
}
