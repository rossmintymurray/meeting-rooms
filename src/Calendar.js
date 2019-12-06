import React from 'react';
import { Table } from 'reactstrap';
import moment, {now} from 'moment';
import config from './Config';
import { getEvents } from './GraphService';
import { getNextEvent } from './GraphService';
import { getNowEvent } from './GraphService';
import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";

// Helper function to format Graph date/time
function formatDateTime(dateTime) {
    return moment.utc(dateTime).local().format('h:mma');
}

function getTodaysDate() {
    return moment.utc().local().format('dddd, Do MMMM YYYY');
}

function getTime() {
    return moment.utc().local().format(' h:mma');
}


export default class Calendar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            next:[],
            now:[],
            show: false,
            time: getTime()
        };
    }

    async componentDidMount() {
        this.intervalID = setInterval(
            () => this.tick(),
            1000
        );
        try {
            // Get the user's access token
            var accessToken = await window.msal.acquireTokenSilent({
                scopes: config.scopes
            });
            // Get the user's events
            var events = await getEvents(accessToken, moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss'), moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({events: events.value});

            var now = await getNowEvent(accessToken,  moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({now: now.value});

            var next = await getNextEvent(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({next: next.value});

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
                    <Row className="section now">
                        <Col xs={12}><h6>Now</h6></Col>

                        {this.state.now.map((event, i) => {
                                //Check start date is before now and end date is after now

                                var startTime = moment(event.start.dateTime);
                                var endTime = moment(event.end.dateTime);
                                var now = moment();

                                let link = "/calendar/" + this.props.match.params.room + "/start-meeting";

                                if(now.isBetween(startTime, endTime)){
                                    console.log("DONE");
                                    return(
                                        <>
                                            <Col xs="8"><h3>{event.subject}</h3></Col>
                                            <Col xs="4" className="text-right"><h5>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h5></Col>
                                            <Col xs={12}><h5><span className="light">Booked by</span> {event.organizer.emailAddress.name}</h5></Col>
                                        </>
                                    );

                                } else {

                                    return(
                                        <>
                                            <Col xs="8"><h3>Room Available</h3></Col>
                                            <Col xs="4" className="text-right">
                                                <Link to={link}>
                                                    <Button variant="success" size="lg">Start Meeting</Button>
                                                </Link>

                                            </Col>

                                        </>
                                    )

                                }

                            })
                        }


                    </Row>
                </Container>
                <Container>
                    <Row className="section next">
                        <Col xs={12}><h6>Next</h6></Col>


                        {this.state.next.map((event, i) => {

                                var startTime = moment(event.start.dateTime);
                                var now = moment();

                                if(now.isBefore(startTime)){
                                    return(
                                        <>
                                            <Col xs="8"><h3>{event.subject}</h3></Col>
                                            <Col xs="4" className="text-right"><h5>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h5></Col>
                                            <Col xs={12}><h5><span className="light">Booked by</span> {event.organizer.emailAddress.name}</h5></Col>
                                        </>
                                    )
                                }

                            })
                        }


                    </Row>
                    <Row>

                    </Row>
                </Container>



                <Container>
                    <Row className="section today">
                        <Col xs={12}><h6>Today</h6></Col>
                    </Row>
                    <Row>
                        <Col>
                            <Table>
                                <thead>
                                <tr>
                                    <th scope="col">Organiser</th>
                                    <th scope="col">Subject</th>
                                    <th scope="col">Start</th>
                                    <th scope="col">End</th>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.events.map(
                                    function(event){

                                        var style = "";
                                        if(moment(event.end.dateTime).isBefore(moment(now()))) {
                                            style = "expired";
                                        }
                                        return(
                                            <tr className={style} key={event.id}>
                                                <td>{event.organizer.emailAddress.name}</td>
                                                <td>{event.subject}</td>
                                                <td>{formatDateTime(event.start.dateTime)}</td>
                                                <td>{formatDateTime(event.end.dateTime)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }


}


