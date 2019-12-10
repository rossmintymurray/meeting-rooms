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
            var events = await getEvents(accessToken, moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss'), moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);
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

    updateViewport(accessToken) {
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
            return "Ross Murray";
        }

        return roomName;
    }

    render() {

        const nowLength = this.state.now.length;
        const link = "/calendar/" + this.props.match.params.room + "/start-meeting";
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
                                    //Check start date is before now and end date is after now

                                    if(moment().isBetween(moment(event.start.dateTime), moment(event.end.dateTime))){

                                        return(
                                            <>
                                                <Col xs="8"><h2>{event.subject}</h2></Col>
                                                <Col xs="4" className="text-right">
                                                    <h4>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h4>

                                                </Col>
                                                <Col xs="12"><h4><span className="light">Booked by</span> {event.organizer.emailAddress.name}</h4></Col>
                                                <Col xs="3"><Button variant="secondary" size="md">Extend Meeting</Button></Col>
                                                <Col xs="3"><Button variant="secondary" size="md">End Meeting</Button></Col>



                                            </>
                                        );

                                    } else {

                                        return(
                                            <>
                                                <Col xs="8"><h2>Room Available</h2></Col>
                                                <Col xs="4" className="text-right">
                                                    <Link to={link}>
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
                                <Link to={link}>
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
                                    return(
                                        <>
                                            <Col xs="8"><h4>{event.subject}</h4></Col>
                                            <Col xs="4" className="text-right"><h6>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h6></Col>
                                            <Col xs={12}><h6><span className="light">Booked by</span> {event.organizer.emailAddress.name}</h6></Col>
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

                {/*<Container>*/}
                {/*    <Row className="section tomorrow">*/}
                {/*        <Col xs={12}><h6>Tomorrow</h6></Col>*/}
                {/*    </Row>*/}
                {/*    <Row>*/}
                {/*        <Col>*/}
                {/*            <Table>*/}
                {/*                <thead>*/}
                {/*                <tr>*/}
                {/*                    <th scope="col">Organiser</th>*/}
                {/*                    <th scope="col">Subject</th>*/}
                {/*                    <th scope="col">Start</th>*/}
                {/*                    <th scope="col">End</th>*/}
                {/*                </tr>*/}
                {/*                </thead>*/}
                {/*                <tbody>*/}
                {/*                {this.state.events.map(*/}
                {/*                    function(event){*/}

                {/*                        var style = "";*/}
                {/*                        if(moment(event.start.dateTime).isAfter(moment(now()).add(1, 'day').startOf('day'))) {*/}

                {/*                            return (*/}
                {/*                                <tr className={style} key={event.id}>*/}
                {/*                                    <td>{event.organizer.emailAddress.name}</td>*/}
                {/*                                    <td>{event.subject}</td>*/}
                {/*                                    <td>{formatDateTime(event.start.dateTime)}</td>*/}
                {/*                                    <td>{formatDateTime(event.end.dateTime)}</td>*/}
                {/*                                </tr>*/}
                {/*                            );*/}
                {/*                        }*/}
                {/*                    })}*/}
                {/*                </tbody>*/}
                {/*            </Table>*/}
                {/*        </Col>*/}
                {/*    </Row>*/}
                {/*</Container>*/}

                <Container>
                    <Row className="section action">
                        <Col xs="4">
                            <Link to="/">
                                <Button className="col-12" variant="secondary" size="lg">Back</Button>
                            </Link>

                        </Col>
                        <Col xs="4">
                            <Link to={link}>
                                <Button className="col-12" variant="primary" size="lg">Book</Button>
                            </Link>
                        </Col>
                        <Col xs="4">
                            <Link to={link}>
                                <Button className="col-12" variant="success" size="lg">Find a room</Button>
                            </Link>
                        </Col>
                    </Row>
                </Container>

            </div>
        );
    }


}


