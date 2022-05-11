import axios from 'axios';
import moment from "moment";
import {getAdalAccessToken, adalApiFetch} from './adalConfig'

axios.defaults.headers.post['Content-Type'] = 'application/json';

function getAPIPath(room) {
    var email = "";
    //Get email address flr selected room
    if (room === "brewery") {
        email = "brewery3@aspin.co.uk";
    } else  if (room === "stables") {
        email = "stables4@aspin.co.uk";
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
    const start = moment.utc().startOf("day").add("1", "minute").toISOString();
    const end = moment.utc().endOf("day").toISOString();

    let daysEvents = [];

    let config = {
        headers: {
            "Content-Type": "application/json",
            "Prefer": "outlook.timezone=\"Europe/London\""
        }
    };

    //Post data to api
     await adalApiFetch(axios.get,'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end + "&$orderby=start/dateTime asc", config)
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

    let nowEvent = false;

    nowEvent = daysEvents.filter(function(event) {
        return moment(event.start.dateTime).isSameOrBefore(moment(now)) &&  moment(event.end.dateTime).isSameOrAfter(moment(now))
    });

    return nowEvent;
}

async function getNextEvent(daysEvents, now, room) {

    let events = [];
    let nextEvents = [];

    //Check if any daysEvents exist
    let nextEventIsToday = false;

    if(daysEvents) {
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

        let config = {
            headers: {
                "Content-Type": "application/json",
                "Prefer": "outlook.timezone=\"Europe/London\""
            }
        };

        await adalApiFetch(axios.get,'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end + "&$orderby=start/dateTime asc", config)
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

                //Add the first one (the next) to the return array
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

    const afterTime = moment('18:00', "HH:mm").add(1, "minute");

    let config = {
        headers: {
            "Content-Type": "application/json",
            "Prefer": "outlook.timezone=\"Europe/London\""
        }
    };


    let events = [];

    let bookUntil = [];
    //Post data to api
    await adalApiFetch(axios.get, 'https://graph.microsoft.com/v1.0' + getAPIPath(room) + "calendarView?startDateTime=" + start + "&endDateTime=" + end + "&$orderby=start/dateTime asc", config)
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
                    return false;
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
    const afterTime = moment('18:00', "HH:mm");

    //Get book until time
    const bookUntil = await getBookUntilTime(now, room, afterTime);
    console.log(bookUntil);

    //Get the next available 15 minute interval
    const roundedUp = Math.ceil(moment().minute() / 15) * 15;
    let bookTime = moment().minute(roundedUp).second(0);

    let times = [];
        //Iterate over the 15 minute interval until booking time reaches next booking
        while(moment(bookTime).isSameOrBefore((bookUntil))) {

            console.log(bookTime);
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

export async function getFreeRooms(now, rooms) {

    let freeRooms = [];
    //Iterate over each room
     await rooms.map(async (room, i) => {

        const daysEvents = await getDaysEvents(now, room);

        //Determine if the room is free
        if(await getNowEvent(daysEvents[0].value, now).length === 0) {

            //Work out time remaining for a free room
            var duration = moment.duration(moment().diff(daysEvents[3]));
            let remainingMeetingTime = duration.humanize();

            //Add the room and its bookUntil time, to the array
            freeRooms.push({room: room, remainingMeetingTime: remainingMeetingTime});
        }

    });

    return freeRooms;

}
