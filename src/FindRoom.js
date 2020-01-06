import React from 'react';
import moment from 'moment';
import config from './Config';
import { getFreeRooms } from './GraphService';

import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";


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

            //Set up the free rooms array
            let freeRoomsArray = [];

            //Iterate over the rooms
            this.state.rooms.map((room, i) => {
                // Get the user's events (table)
                var freeRooms =  getFreeRooms(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), room);

                //Resolve promise
                Promise.resolve(freeRooms).then((res2) => {
                    //Check that the events are not now
                    if(res2.value.length === 0) {
                        //this.props.history.push('/calendar/' + this.props.match.params.room);
                        freeRoomsArray.push(room);
                    }
                });
                return true;
            });

            this.setState({freeRooms: freeRoomsArray});

        }
        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
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
        const backLink = "/calendar/" + this.props.match.params.room ;
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

                        {/*Iterate over each room*/}
                        {this.state.freeRooms.map((room, i) => {
                            return (
                                <>
                                    <Col xs="8" className="bottom-spacer"><h2>{this.getRoomName(room)}</h2></Col>
                                </>
                            )
                        })}

                    </Row>
                </Container>
                <Container>
                    <Row className="section action">
                        <Col xs="12">
                            <Link to={backLink}>
                                <Button className="col-12" variant="primary" size="lg">Back</Button>
                            </Link>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}


