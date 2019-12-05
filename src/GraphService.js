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
        email = "confroom@aspin.co.uk";
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
        .filter("start/dateTime ge '" +  now +"' & end/dateTime le '"+ now +"'")
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

