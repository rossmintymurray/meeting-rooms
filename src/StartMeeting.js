import React from 'react';
import moment from 'moment';
import config from './Config';

import { getBookUntilOptions } from './GraphService';
import { createEvent } from './GraphService';
import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";

// Helper function to get available booking times
function formatDateTime(dateTime) {
    return moment.utc(dateTime).local().format('h:mma');
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
            email: '',
            subject: '',
            selectedButton: null,
            room_name: ""
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {

        try {
            //Get room name
            var room_name = await this.getRoomName(this.props.match.params.room);
            // Update the array of events in state
            this.setState({room_name: room_name});

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
                        times[hour].push(now);
                    } else {
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

        var apiData = {
            "subject": this.state.subject,
            "body": {
                "contentType": "HTML",
                "content": "AMR Booked meeting"
            },
            "start": {
                "dateTime": moment(this.props.time, "H:mma").format(),
                "timeZone": "Europe/London"
            },
            "end": {
                "dateTime": moment(this.state.selectedButton).format(),
                "timeZone": "Europe/London"
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


        var accessToken =  window.msal.acquireTokenSilent({
            scopes: config.scopes
        });

        console.log(apiData);

        var result =  createEvent(accessToken,  apiData );

        console.log(result);
        alert('A name was submitted: ' + this.props.time  + " - " + this.state.subject +" - " + this.state.email + " - " + moment(this.state.selectedButton).format("HH:mm"));
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
            return "Ross Murray 2";
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
                    <Row>
                        <Col xs={12} className="text-center"><h1 className="room-name">{this.state.room_name}</h1></Col>
                    </Row>
                </Container>
                <Container>

                    <form onSubmit={this.handleSubmit}>
                        <fieldset>
                        <Row className="section book-until">
                            <Col xs={12}><h6>Select Meeting End Time</h6></Col>
                            <Col>

                                {this.state.times.map((hours, i) => {

                                    var row = hours.map((time, key) =>
                                        <Col xs={3} key={key}>
                                            <Button key={key} className={time === this.state.selectedButton ? 'selected' : ''} variant="secondary" size="lg" key={time} onClick={this.buttonSelected(time)}>{formatDateTime(time)}</Button>
                                        </Col>
                                    );
                                    return <Row key={i}>{row}</Row>;
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


