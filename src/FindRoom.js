import React from 'react';
import moment from 'moment';
import {getAPIAccessToken, getFreeRooms} from './GraphService';

import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { Button } from 'react-bootstrap';
import {Link} from "react-router-dom";
import { css } from "@emotion/core";
import BarLoader from "react-spinners/BarLoader";

//Set up the loader spinners
const override = css`
  display: block;
  margin: 200px auto 0 auto;
  border-color: #238276;
`;

export default class FindRoom extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            rooms: ["board-room", "meeting-room", "goldfish-bowl"],
            freeRooms: [],
            room_name: "",
            loading: true
        };
    }

    async componentDidMount() {
        try {

            // Get the user's access token
            var accessToken = await getAPIAccessToken();

            //Iterate over the rooms
            await this.state.rooms.map((room, i) => {
                // Get the user's events (table)
                var freeRooms =  getFreeRooms(accessToken, moment().format('YYYY-MM-DDTHH:mm:ss'), room);

                //Resolve promise
                Promise.resolve(freeRooms).then((res2) => {
                    //Check that the events are not now
                    if(res2.length === 0) {
                        //this.props.history.push('/calendar/' + this.props.match.params.room);
                        this.state.freeRooms.push(room);
                    }


                });

                return false;
            });

            this.setState({loading: false});

        }
        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
    }

    getRoomName(room) {
        var roomName = "";
        if (room === "board-room") {
            roomName = "Board Room";
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
        const  loading  = this.state.loading;

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


