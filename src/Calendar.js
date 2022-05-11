import React from 'react';
import { Table } from 'reactstrap';
import moment from 'moment';
import { getDaysEvents} from './GraphService';
import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import  {Link} from "react-router-dom";
import { css } from "@emotion/core";
import BarLoader from "react-spinners/BarLoader";

//Set up the loader spinners
const override = css`
  display: block;
  margin: 200px auto 0 auto;
  border-color: #238276;
`;
// Helper function to format Graph date/time
function formatDateTime(dateTime) {
    return moment.utc(dateTime).format('h:mma');
}
function getDay(dateTime) {
    return moment.utc(dateTime).format('dddd Do MMMM');
}

export default class Calendar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            next:[],
            now:[],
            show: false,
            room_name: [],
            loading: true

        };
    }

    async componentDidMount() {
        try {

            //Get room name
            var room_name = await this.getRoomName(this.props.match.params.room);
            // Update the array of events in state
            this.setState({room_name: room_name});

            //Get Calendar view data
            var events = await getDaysEvents(moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);


            // Update the array of events in state
            this.setState({events: events[0].value});
            this.setState({now: events[1]});
            this.setState({next: events[2]});
            this.setState({bookUntil: events[3]});

            //Set the update interval of events
            this.intervalID = setInterval(
                () => this.updateViewport(),
                5000
            );

            //Update loading stated to hide loader image
            this.setState({loading: false});

        }
        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    //Call to update all calendar screen information
    async updateViewport() {

        //Get Calendar view data
        var events = await getDaysEvents(moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room);

        Promise.resolve(events).then((res2) => {
            // Update the array of events in state
            this.setState({events: res2[0].value});
            this.setState({now: res2[1]});
            this.setState({next: res2[2]});
            this.setState({bookUntil: events[3]});
        });

    }

    getRoomName(room) {
        var roomName = [];
        if (room === "brewery") {
            roomName["display"] = "Brewery";
            roomName["organiser"] = "Brewery3";
        } else  if (room === "stables") {
            roomName["display"] = "Stables";
            roomName["organiser"] = "Stables4";
        } else  if (room === "goldfish-bowl") {
            roomName["display"] = "Goldfish Bowl";
            roomName["organiser"] = "Goldfish Bowl";
        } else {
            return "Error - Unknown Room";
        }

        return roomName;
    }

    render() {

        //Work out time remaining for a free room
        var duration = moment.duration(moment().diff(moment(this.state.bookUntil)));
        let remainingMeetingTime = duration.humanize(); //duration.hours() + " hrs and " + duration.minutes() +"mins";

        const nowLength = this.state.now.length;
        const startMeetingLink = "/calendar/" + this.props.match.params.room + "/start-meeting";
        const findRoomLink = "/calendar/" + this.props.match.params.room + "/find-room";
        const loading  = this.state.loading;

        return (
            loading ?  <div>
                <Container>
                    <Row>
                        <Col xs={12}>
                            <BarLoader
                                css={override}
                                size={150}
                                //size={"150px"} this also works
                                color={"#238276"}
                                loading={this.state.loading}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
                :
                    <div>
                        <Container>
                            <Row>
                                <Col xs={12} className="text-center"><h1
                                    className="room-name">{this.state.room_name.display}</h1></Col>
                            </Row>
                        </Container>

                        <Container>
                            <Row className="section now">
                                <Col xs={12}><h5>Now</h5></Col>



                                {nowLength > 0 ? (

                                        this.state.now.map((event, i) => {
                                            const extendMeetingLink = "/calendar/" + this.props.match.params.room + "/" + event.id + "/extend-meeting";
                                            const endMeetingLink = "/calendar/" + this.props.match.params.room + "/" + event.id + "/end-meeting";

                                            //Check if booked by the room, display 1st attendee if so.
                                            let nowBookerName = "";
                                            if (event.organizer.emailAddress.name === this.state.room_name.organiser && event.attendees.length > 0) {
                                                nowBookerName = event.attendees[0].emailAddress.name;
                                                ;
                                            } else {
                                                nowBookerName = event.organizer.emailAddress.name;
                                            }


                                            //Check start date is before now and end date is after now
                                            if (moment().isBetween(moment(event.start.dateTime), moment(event.end.dateTime))) {

                                                return (
                                                    <>
                                                        <Col xs="7"><h2>{event.subject}</h2></Col>
                                                        <Col xs="5" className="text-right">
                                                            <h4>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h4>

                                                        </Col>
                                                        <Col xs="8"><h4><span
                                                            className="light">Booked by</span> {nowBookerName}</h4></Col>
                                                        <Col xs="2">
                                                            <Link to={extendMeetingLink}>
                                                                <Button className="col-12" variant="success"
                                                                        size="sm">Extend </Button>
                                                            </Link>
                                                        </Col>
                                                        <Col xs="2">
                                                            <Link to={endMeetingLink}>
                                                                <Button className="col-12" variant="error"
                                                                        size="sm">End</Button>
                                                            </Link>
                                                        </Col>


                                                    </>
                                                );

                                            } else {

                                                return (
                                                    <>
                                                        <Col xs="8">
                                                            <h2>Room Available</h2>
                                                            <h4><span className="light">~ {remainingMeetingTime} remaining</span></h4>
                                                        </Col>
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
                                            <Col xs="8">
                                                <h2>Room Available</h2>
                                                <h4><small><span className="light">~ {remainingMeetingTime} remaining</span></small></h4>
                                            </Col>
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
                                    if(typeof event !== 'undefined') {
                                        var startTime = moment(event.start.dateTime);
                                        var now = moment();

                                        //Check if booked by the room, display 1st attendee if so.
                                        let nextbookerName = "";
                                        if (event.organizer.emailAddress.name === this.state.room_name.organiser && event.attendees.length > 0) {
                                            nextbookerName = event.attendees[0].emailAddress.name;
                                        } else {
                                            nextbookerName = event.organizer.emailAddress.name;
                                        }

                                        if (now.isBefore(startTime)) {
                                            if (moment(event.start.dateTime).isSame(moment(), 'day')) {
                                                return (
                                                    <>
                                                        <Col xs="7"><h4>{event.subject}</h4></Col>

                                                        {/*If start date is not today*/}

                                                        <Col xs="5" className="text-right">
                                                            <h4>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h4>
                                                        </Col>
                                                        <Col xs={12}><h6><span
                                                            className="light">Booked by</span> {nextbookerName}
                                                        </h6></Col>
                                                    </>
                                                )
                                            } else {
                                                return (
                                                    <>
                                                        <Col xs="8"><h4>{event.subject}</h4></Col>

                                                        {/*If start date is not today*/}

                                                        <Col xs="4" className="text-right">
                                                            <h6 className="small next-event-alt-day-date">{getDay(event.start.dateTime)}</h6>
                                                            <h5>{formatDateTime(event.start.dateTime)} - {formatDateTime(event.end.dateTime)}</h5>
                                                        </Col>
                                                        <Col xs={12}><h6><span
                                                            className="light">Booked by</span> {nextbookerName}
                                                        </h6></Col>
                                                    </>
                                                )
                                            }
                                        } else {
                                            return (
                                                <>
                                                    <Col xs="8"><h4>No meetings</h4></Col>
                                                </>
                                            )
                                        }
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
                                        {this.state.events.map((event, i) => {

                                            var style = "";

                                            //If event in the past
                                            if (moment(event.end.dateTime).isBefore(moment())) {
                                                style = "expired";

                                            //If current event
                                            } else if (moment(event.start.dateTime).isSameOrBefore(moment()) && (moment(event.end.dateTime).isSameOrAfter(moment()) )) {
                                                style = "current";
                                            }

                                            //Check if booked by the room, display 1st attendee if so.
                                            let bookerName = "";
                                            if (event.organizer.emailAddress.name === this.state.room_name.organiser && event.attendees.length > 0) {
                                                bookerName = event.attendees[0].emailAddress.name;
                                                ;
                                            } else {
                                                bookerName = event.organizer.emailAddress.name;
                                            }
                                            return (
                                                <tr className={style} key={event.id}>
                                                    <td>{bookerName}</td>
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


