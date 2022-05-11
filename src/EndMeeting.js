import React from 'react';
import moment from 'moment';

import { updateEvent } from './GraphService';
import { Container } from 'reactstrap';
import { Row } from 'reactstrap';
import { Col } from 'reactstrap';
import { css } from "@emotion/core";
import BarLoader from "react-spinners/BarLoader";
import {Link} from "react-router-dom";
import {Button} from "react-bootstrap";

//Set up the loader spinners
const override = css`
  display: block;
  margin: 200px auto 0 auto;
  border-color: #238276;
`;

export default class EndMeeting extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            bookUntil:[],
            times:[],
            show: false,
            selectedButton: null,
            room_name: "",
            loading: true
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

            this.setState({loading: false});
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

    async handleSubmit(event) {

        //Show loading div
        this.setState({loading: true});

        event.preventDefault();

        //Set the data to update
        const apiData = {
            end: {
                dateTime: moment().format(),
                timeZone: "GMT Standard Time"
            }
        };

        var result = await updateEvent(apiData, this.props.match.params.room, this.props.match.params.id );

            Promise.resolve(result)
                .then((res2) => {

                    //Check for success
                    if(res2.status === 200) {
                        //Redirect to calendar page
                        this.props.history.push('/calendar/' + this.props.match.params.room);
                    }
                    //Check iff reseult was successful and return to
                });




        //alert('A name was submitted: ' + this.props.time  + " - " + this.state.subject +" - " + this.state.email + " - " + moment(this.state.selectedButton).format("HH:mm"));
        //Prevent the default submit

    }

    getRoomName(room) {
        var roomName = "";
        if (room === "brewery") {
            roomName = "Brewery";
        } else  if (room === "stables") {
            roomName = "Stables";
        } else  if (room === "goldfish-bowl") {
            roomName = "Goldfish Bowl";
        } else  if (room === "skylight-room") {
            roomName = "Skylight";
        } else {
            return "Ross Murray 2";
        }
        return roomName;
    }

    buttonSelected = selectedButton => ev => {
        this.setState({ selectedButton })
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
                        <Col xs={12} className="text-center"><h1 className="room-name">{this.state.room_name}</h1></Col>
                    </Row>
                </Container>
                <Container>

                    <form onSubmit={this.handleSubmit}>
                        <fieldset>
                            <Row className="text-center section book-until">
                                <Col xs={12}><h3>Are you sure you want to end the current meeting?</h3></Col>
                            </Row>


                        </fieldset>

                        <input type="submit" className="col-12 btn btn-lg btn-error" value="End Meeting" />
                    </form>
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


