import React from 'react';
import moment from 'moment';
import config from './Config';

import { getBookUntilOptions } from './GraphService';

import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";

// Helper function to get available booking times
function formatDateTime(dateTime) {
    return moment.utc(dateTime).local().format('h:mma');
}

function getTodaysDate() {
    return moment.utc().local().format('dddd, Do MMMM YYYY');
}

function getTime() {
    return moment.utc().local().format(' h:mma');
}


export default class StartMeeting extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            next:[],
            now:[],
            bookUntil:[],
            times:[],
            show: false,
            time: getTime(),
            email: '',
            subject: '',
            selectedButton: null
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {

        //Set the interval for the clock tick
        this.intervalID = setInterval(
            () => this.tick(),
             1000
        );
        try {
            // Get the user's access token
            var accessToken = await window.msal.acquireTokenSilent({
                scopes: config.scopes
            });

            // Get the book until options (times that the room is bookable until in 15 min increments)
            var bookUntil = await getBookUntilOptions(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room );

            // Update the array of events in state
            this.setState({bookUntil: bookUntil.value});

            var times = [];

            const rounded = Math.round(moment().minute() / 15) * 15;
            const roundedDown = Math.floor(moment().minute() / 15) * 15;
            const roundedUp = Math.ceil(moment().minute() / 15) * 15;

            var now = moment().minute(roundedUp).second(0);
            
            var  beforeTime = moment('08:30', "HH:mm");
            var afterTime = moment('23:30', "HH:mm");

            while(moment(now).isBefore(moment(this.state.bookUntil[0].start.dateTime))) {

// var time = moment() gives you current time. no format required.
                var hour = moment(now).format("HH");
                var minute = moment(now).format("mm");

                if (now.isBetween(beforeTime, afterTime)) {

                    //Check if hour array exists
                    if(hour in times) {
                        console.log(minute);
                        times[hour].push(now);
                    } else {
                        console.log(hour);
                        times[hour] = [now];
                    }
                }

                now = (moment(now).add(15, 'minutes'));
            }

            // Update the array of events in state
            this.setState({times: times});
        }

        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    tick() {
        this.setState({
            time: getTime()
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
        const value = event.target.value;
        this.setState({
            [event.target.name]: value
        });
    }

    handleSubmit(event) {

        //Call the Graph command to create a new booking from now

        //Validate form inputs

        //Get start date (now)

        //Send to Graph

        //Return confirm message (sweetalert)

        var event = {
            "subject": this.state.subject,
            "body": {
                "contentType": "HTML",
                "content": ""
            },
            "start": {
                "dateTime": moment(this.state.time),
                "timeZone": "GMT"
            },
            "end": {
                "dateTime": moment(this.state.selectedButton),
                "timeZone": "GMT"
            },
            "location": {
                "displayName": this.getRoomName(this.props.match.params.room)
            },
            "attendees": [{
                "emailAddress": {
                    "address": "rossm@aspin.co.uk",
                    "name": "Ross Murray"
                },
                "type": "required"
            }]
        }

        alert('A name was submitted: ' + this.state.time  + " - " + this.state.subject +" - " + this.state.email + " - " + moment(this.state.selectedButton).format("HH:mm"));
        //Prevent the default submit
        event.preventDefault();
    }

    getRoomName(room) {
        var roomName = "";
        if (room === "conference-room") {
            roomName = "Conference Room";
        } else  if (room === "meeting-room") {
            roomName = "Meeting Room";
        } else  if (room === "goldfish-bowl") {
            roomName = "Goldfish Bowl";
        } else {
            return "/me/events";
        }
        return roomName;
    }

    buttonSelected = selectedButton => ev => {
        this.setState({ selectedButton })
    }

    render() {

        return (
            <div>
                <Container>
                    <Row className="header d-flex align-items-end" >
                        <Col xs={9}><h2><Link className="home-link" to="/">{getTodaysDate()}</Link></h2></Col>
                        <Col xs={3} className="text-right"><h1>{this.state.time}</h1></Col>
                    </Row>
                    <Row>
                        <Col xs={12} className="text-center"><h1 className="room-name">{this.getRoomName(this.props.match.params.room)}</h1></Col>
                    </Row>
                </Container>
                <Container>

                    <form onSubmit={this.handleSubmit}>
                        <fieldset>
                        <Row className="section book-until">
                            <Col xs={12}><h6>Select Meeting End Time</h6></Col>
                            <Col>

                                {this.state.times.map((hours) => {

                                    var row = hours.map(time =>
                                        <Col xs={3}>
                                            <Button className={time === this.state.selectedButton ? 'selected' : ''} variant="secondary" size="lg" key={time} onClick={this.buttonSelected(time)}>{formatDateTime(time)}</Button>
                                        </Col>
                                    );
                                    return <Row>{row}</Row>;
                                })}
                            </Col>

                        </Row>
                        <Row className="section booker">
                            <Col xs={12}><h6>Your Aspin Email</h6></Col>
                            <Col xs={12}><input className="form-control form-control-lg" type="text" name="email" value={this.state.email} onChange={this.handleChange} /></Col>
                        </Row>

                        <Row className="section subject">
                            <Col xs={12}><h6>Meeting Subject</h6></Col>
                            <Col xs={12}><input className="form-control form-control-lg" type="text" name="subject" value={this.state.subject} onChange={this.handleChange} /></Col>
                        </Row>

                        </fieldset>

                        <input type="submit" className="col-12 btn btn-lg btn-success" value="Start Meeting" />
                    </form>
                </Container>
            </div>
        );
    }


}


