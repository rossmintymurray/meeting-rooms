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
function getDay(dateTime) {
    return moment.utc(dateTime).local().format('dddd Do MMMM');
}

export default class Calendar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            next:[],
            now:[],
            show: false,
            room_name: ""

        };
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
            // Get the user's events (table)
            var events = await getEvents(accessToken, moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss'), moment().endOf('day').add(1, 'minutes').format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({events: events.value});

            // Now event
            var now = await getNowEvent(accessToken,  moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({now: now.value});

            //Next event
            var next = await getNextEvent(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
            // Update the array of events in state
            this.setState({next: next.value});



            //Set the update interval of events
            this.intervalID = setInterval(
                () => this.updateViewport(accessToken),
                10000
            );
        }
        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    updateViewport() {
        // Get the user's access token
        var accessToken = window.msal.acquireTokenSilent({
            scopes: config.scopes
        });

        this.updateNow(accessToken);
        this.updateNext(accessToken);
        this.updateEvents(accessToken);
    }
    updateNow(accessToken) {
        getNowEvent(accessToken,  moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room).then(result => this.setState({
            now: result.value
        }))
    }

    updateNext(accessToken) {
        getNextEvent(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room).then(result => this.setState({
            next: result.value
        }))
    }

    updateEvents(accessToken) {
        getEvents(accessToken, moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss'), moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room).then(result => this.setState({
            events: result.value
        }))
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
            return "Error - Unknown Room";
        }

        return roomName;
    }

    render() {

        const nowLength = this.state.now.length;
        const startMeetingLink = "/calendar/" + this.props.match.params.room + "/start-meeting";
        const findRoomLink = "/calendar/" + this.props.match.params.room + "/find-room";
        return (
            <div>
                <Container>
                    <Row>
                        <Col xs={12} className="text-center"><h1 className="room-name">{this.state.room_name}</h1></Col>
                    </Row>
                </Container>
                <Container>
                    <Row className="section now">
                        <Col xs={12}><h5>Now</h5></Col>

                        {nowLength > 0 ? (

                            this.state.now.map((event, i) => {
                                const extendMeetingLink = "/calendar/" + this.props.match.params.room + "/" + event.id + "/extend-meeting";
                                const endMeetingLink = "/calendar/" + this.props.match.params.room + "/" + event.id + "/end-meeting";
                                    //Check start date is before now and end date is after now
                                    if(moment().isBetween(moment(event.start.dateTime), moment(event.end.dateTime))){

                                        return(
                                            <>
                                                <Col xs="8"><h2>{event.subject}</h2></Col>
                                                <Col xs="4" className="text-right">
                                                    <h5>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h5>

                                                </Col>
                                                <Col xs="8"><h4><span className="light">Booked by</span> {event.organizer.emailAddress.name}</h4></Col>
                                                <Col xs="2">
                                                    <Link to={extendMeetingLink}>
                                                        <Button className="col-12" variant="success" size="sm">Extend </Button>
                                                    </Link>
                                                </Col>
                                                <Col xs="2">
                                                    <Link to={endMeetingLink}>
                                                        <Button className="col-12" variant="error" size="sm">End</Button>
                                                    </Link>
                                                </Col>



                                            </>
                                        );

                                    } else {

                                        return(
                                            <>
                                                <Col xs="8"><h2>Room Available</h2></Col>
                                                <Col xs="4" className="text-right">
                                                    <Link to={startMeetingLink}>
                                                        <Button variant="success" size="lg">Start Meeting</Button>
                                                    </Link>

                                                </Col>

                                            </>
                                        )

                                    }

                                })

                        ) :
                            (
                            <>
                                <Col xs="8"><h2>Room Available</h2></Col>
                                <Col xs="4" className="text-right">
                                <Link to={startMeetingLink}>
                                    <Button variant="success" size="lg">Start Meeting</Button>
                                </Link>

                                </Col>

                            </>
                            )
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
                                    if(moment(event.start.dateTime).isSame(moment(), 'day')) {
                                        return (
                                            <>
                                                <Col xs="8"><h4>{event.subject}</h4></Col>

                                                {/*If start date is not today*/}

                                                <Col xs="4" className="text-right">
                                                    <h6>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h6>
                                                </Col>
                                                <Col xs={12}><h6><span
                                                    className="light">Booked by</span> {event.organizer.emailAddress.name}
                                                </h6></Col>
                                            </>
                                        )
                                    } else {
                                        return (
                                            <>
                                                <Col xs="8"><h4>{event.subject}</h4></Col>

                                                {/*If start date is not today*/}

                                                <Col xs="4" className="text-right">
                                                    <h6>{getDay(event.start.dateTime)}<br/>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h6>
                                                </Col>
                                                <Col xs={12}><h6><span
                                                    className="light">Booked by</span> {event.organizer.emailAddress.name}
                                                </h6></Col>
                                            </>
                                        )
                                    }
                                } else {
                                    return(
                                        <>
                                            <Col xs="8"><h4>No meetings</h4></Col>
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
                    <Row className="today-table">
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

                <Container>
                    <Row className="section action">
                        <Col xs="12">
                            <Link to={findRoomLink}>
                                <Button className="col-12" variant="primary" size="lg">Find a room</Button>
                            </Link>
                        </Col>
                    </Row>
                </Container>

            </div>
        );
    }


}


