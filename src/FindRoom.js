import React from 'react';
import { Table } from 'reactstrap';
import moment, {now} from 'moment';
import config from './Config';
import { getFreeRooms } from './GraphService';

import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";

// Helper function to format Graph date/time
function formatDateTime(dateTime) {
    return moment.utc(dateTime).local().format('h:mma');
}

export default class FindRoom extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            rooms: ["conference-room", "meeting-room", "goldfish-bowl"],
            freeRooms: [],
            room_name: ""

        };
    }

    async componentDidMount() {
        try {

            // Get the user's access token
            var accessToken = await window.msal.acquireTokenSilent({
                scopes: config.scopes
            });
            // Get the user's events (table)
            var freeRooms = await getFreeRooms(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'));
            // Update the array of events in state
            this.setState({freeRooms: freeRooms.value});

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

    //Update content every 10 seconds
    updateViewport(accessToken) {
        this.updateFreeRooms(accessToken);
    }
    updateFreeRooms(accessToken) {
        getFreeRooms(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss')).then(result => this.setState({
            now: result.value
        }))
    }

    render() {

        const nowLength = this.state.freeRooms.length;
        const startMeetingLink = "/calendar/" + this.props.match.params.room + "/start-meeting/";

        return (
            <div>
                <Container>
                    <Row>
                        <Col xs={12} className="text-center"><h1 className="room-name">Find a Room</h1></Col>
                    </Row>
                </Container>
                <Container>
                    <Row className="section free-room">
                        <Col xs={12}><h5>Available Now</h5></Col>

                        {nowLength > 0 ? (
                                <>
                                    <Col xs="8"><h2>Room Available</h2></Col>
                                    <Col xs="4" className="text-right">
                                        <Link to={startMeetingLink}>
                                            <Button variant="success" size="lg">Start Meeting</Button>
                                        </Link>

                                    </Col>

                                </>


                            ) :
                            (
                                <>
                                    <Col xs="8"><h2>No rooms currently available</h2></Col>


                                </>
                            )
                        }




                    </Row>
                </Container>
                <Container>
                    <Row className="section action">
                        <Col xs="12">
                            <Link to="/calendar/{this.state.room_name}">
                                <Button className="col-12" variant="primary" size="lg">Back</Button>
                            </Link>
                        </Col>
                    </Row>
                </Container>





            </div>
        );
    }


}


