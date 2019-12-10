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
    if (room === "conference-room") {
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


    return events;
}

export async function createEvent(accessToken, apiData) {



    const client = getAuthenticatedClient(accessToken);

    const event = {
        subject: "Let's go for lunch",
        body: {
            contentType: "HTML",
            content: "Does late morning work for you?"
        },
        start: {
            dateTime: "2019-12-16T12:00:00",
            timeZone: "Pacific Standard Time"
        },
        end: {
            dateTime: "2019-12-16T14:00:00",
            timeZone: "Pacific Standard Time"
        },
        location:{
            displayName:"Harry's Bar"
        },
        attendees: [
            {
                emailAddress: {
                    address:"rossm@aspin.co.uk",
                    name: "Ross Murray"
                },
                type: "required"
            }
        ]
    };
    //
    // let res = await client.api('/groups/01d4ee64-15ce-491e-bad1-b91aa3223df4/events')
    //     .post(event);

    let res = await client
        .api('/me/events')
        .post(event);

console.log(res);

    return res;
}

