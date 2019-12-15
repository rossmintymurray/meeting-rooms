import React from 'react';
import moment from 'moment';
import config from './Config';

import { getBookUntilOptions } from './GraphService';
import { createEvent } from './GraphService';
import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { FormControl } from 'react-bootstrap';
import { InputGroup } from 'react-bootstrap';
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
            this.setState({times: bookUntil});
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

        const apiData = {
            subject: this.state.subject,
            body: {
                contentType: "HTML",
                content: "AMR Booked meeting"
            },
            start: {
                dateTime: moment(this.props.time, "H:mma").format(),
                timeZone: "GMT Standard Time"
            },
            end: {
                dateTime: moment(this.state.selectedButton).format(),
                timeZone: "GMT Standard Time"
            },
            location: {
                displayName: this.getRoomName(this.props.match.params.room)
            },
            attendees: [{
                emailAddress: {
                    address: this.state.email + "@aspin.co.uk",
                    name: ""
                },
                type: "required"
            }]
        }


        var accessToken =  window.msal.acquireTokenSilent({
            scopes: config.scopes
        });

        event.preventDefault();

        //Resolve access token promise so we can send the accessToken value to MS Graph
        Promise.resolve(accessToken)
            .then((res) => {
                //Post event
                var result =  createEvent(res.accessToken,  apiData, this.props.match.params.room );

                Promise.resolve(result)
                    .then((res2) => {

                        //Check for success
                        if(res2.status === 201) {
                            //Redirect to calendar page
                            this.props.history.push('/calendar/' + this.props.match.params.room);
                        }
                //Check iff reseult was successful and return to
                    });

            });


        //alert('A name was submitted: ' + this.props.time  + " - " + this.state.subject +" - " + this.state.email + " - " + moment(this.state.selectedButton).format("HH:mm"));
        //Prevent the default submit

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
                            <Col xs={12}>
                                <InputGroup className="mb-3">
                                    <FormControl
                                        className="form-control-lg"
                                        aria-label="Recipient's username"
                                        aria-describedby="basic-addon2"
                                        type="text"
                                        name="email"
                                        value={this.state.email}
                                        onChange={this.handleChange}
                                    />
                                    <InputGroup.Append>
                                        <InputGroup.Text id="basic-addon2">@aspin.co.uk</InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Col>
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


