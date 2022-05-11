import React from 'react';
import moment from 'moment';
import {getFreeRooms} from './GraphService';

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
            rooms: ["brewery", "stables", "goldfish-bowl"],
            freeRooms: [],
            room_name: "",
            loading: true
        };
    }

    async componentDidMount() {
        try {

            // Get the free rooms and add to state
            let freeRooms =  await getFreeRooms(moment().format('YYYY-MM-DDTHH:mm:ss'), this.state.rooms)
                .then(
                    this.setState({loading: false})
                );

            this.setState({freeRooms: freeRooms});

        }
        catch(err) {
            this.props.showError('ERROR', JSON.stringify(err));
        }
    }

    getRoomName(room) {
        var roomName = "";
        if (room === "brewery") {
            roomName = "Brewery";
        } else  if (room === "stables") {
            roomName = "Stables";
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
                                    <Col xs="8" className="bottom-spacer">
                                        <h2>{this.getRoomName(room.room)}</h2>
                                        <h4><small><span className="light">~ {room.remainingMeetingTime} remaining</span></small></h4>
                                    </Col>
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


