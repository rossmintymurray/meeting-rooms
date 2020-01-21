import axios from 'axios';
import moment from "moment";
import {getAdalAccessToken, adalApiFetch} from './adalConfig'

axios.defaults.headers.post['Content-Type'] = 'application/json';

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
export async function getDaysEvents(now, room) {

    //Set up current day start and end vars
    const start = moment(now).startOf("day").add("1", "minute").toISOString();
    const end = moment(now).endOf("day").toISOString();

    let daysEvents = [];

     await adalApiFetch(axios.get,'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
         .then(res => {
                     daysEvents = res;
     });

    //Get the now event
    const nowEvent = await getNowEvent(daysEvents.data.value, now);

    //Get the next event
    const nextEvent =  await getNextEvent(daysEvents.data.value, now, room);

    const bookUntil = await getBookUntilTime(now, room);

    return [
       daysEvents.data,
       nowEvent,
       nextEvent,
        bookUntil
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

async function getNextEvent(daysEvents, now, room) {

    let events = [];
    let nextEvents = [];

    //Check if any daysEvents exist
    let nextEventIsToday = false;

    if(daysEvents ) {
        daysEvents.map((event, key) => {
            if (moment(event.start.dateTime).isSameOrAfter(moment(now))) {
                nextEvents.push(event);
                nextEventIsToday = true;
            }
            return false;

        })
    }

    if(!nextEventIsToday) {
        //Get events up to a week in advance
        //Set up current day start and end vars
        const start = moment(now).toISOString();
        const end = moment(now).add("1", "week").toISOString();

        await adalApiFetch(axios.get,'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end + "&$orderby=start/dateTime asc")
            .then(res => {
                events = res.data.value;

                //Iterate over daysEvents finding the next one
                events.map((event, key) => {
                    if (moment(event.start.dateTime).isSameOrAfter(moment(now))) {
                        nextEvents.push(event);
                    }
                    return false;
                });

                let nextEvent = [];
                nextEvent.push(nextEvents[0]);

                return nextEvent;

            });
    }
    //Remove all but the first item in the array
    let nextEvent = [];
    nextEvent.push(nextEvents[0]);
    return nextEvent;
}

async function getBookUntilTime(now, room) {
    //Set up now start and end vars
    const start = moment(now).toISOString();
    const end = moment(now).endOf("day").toISOString();

    const afterTime = moment('23:30', "HH:mm").add(1, "minute");

    let events = [];

    let bookUntil = [];
    //Post data to api
    await adalApiFetch(axios.get, 'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end + "&$orderby=start/dateTime asc")
        .then(res => {
            events = res.data;

            if (events.value.length > 0) {

                //Iterate over daysEvents finding the next one
                events.value.map((event, key) => {

                    //If the start time of the returned event is after last time - afterTime
                    if (moment(event.start.dateTime).isAfter(moment(afterTime))) {
                        bookUntil.push(afterTime);

                        //If start time of returned event is before now
                    } else if (moment(event.start.dateTime).isBefore(moment(now))) {
                        bookUntil.push(afterTime);
                    } else {
                        bookUntil.push(moment(event.start.dateTime));
                    }

                });
            } else {
                bookUntil.push(afterTime);
            }

        });

    return moment.min(bookUntil);
}

export async function getBookUntilOptions(now, room) {

    //Only show book times between these
    const beforeTime = moment('08:30', "HH:mm");
    const afterTime = moment('23:30', "HH:mm").add(1, "minute");

    //Get book until time
    const bookUntil = await getBookUntilTime(now, room, afterTime);

    //Get the next available 15 minute interval
    const roundedUp = Math.ceil(moment().minute() / 15) * 15;
    let bookTime = moment().minute(roundedUp).second(0);

    let times = [];
        //Iterate over the 15 minute interval until booking time reaches next booking
        while(moment(bookTime).isBefore((bookUntil).add(1, 'minute'))) {

            //Get the hour of the book time (so we can start each hour on new line)
            let hour = moment(bookTime).format("HH");
            if (bookTime.isBetween(beforeTime, afterTime)) {
                //Check if hour array exists
                if(hour in times) {
                    //Set following hours
                    times[parseInt(hour)].push(bookTime);
                } else {
                    //Set first hour
                    times[parseInt(hour)] = [bookTime];
                }
            }

            //Increment the book time by 15 minutes
            bookTime = (moment(bookTime).add(15, 'minutes'));
        }


    return times;

}

export async function createEvent(apiData, room) {

    const accessToken = await getAdalAccessToken();
    let result = [];
    //Set up headers and access token
    let config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + accessToken
        }
    };

    //Post data to api
    await axios.post('https://graph.microsoft.com/v1.0/'  + (getAPIPath(room)) + 'events', apiData,config)
        .then(res => {
            result = res;
        });

    return result;
}

export async function updateEvent(apiData, room, id) {

    const accessToken = await getAdalAccessToken();

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

export async function getFreeRooms(now, room) {

    let daysEvents = [];
    let roomEvent = [];
    //Set up current day start and end vars
    const start = moment(now).toISOString();
    const end = moment(now).endOf("day").toISOString();

    //Post data to api
    await adalApiFetch(axios.get,'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end)
        .then(res => {
            daysEvents = res;
            if(daysEvents.data.value.length > 0) {
                 roomEvent = daysEvents.data.value.filter(function (event) {
                     return moment(event.start.dateTime).isSameOrBefore(moment(now)) && moment(event.end.dateTime).isSameOrAfter(moment(now))
                });
            }
        });

    return roomEvent;
}
