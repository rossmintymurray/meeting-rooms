import React from 'react';
import moment from 'moment';

import { getBookUntilOptions} from './GraphService';
import { updateEvent } from './GraphService';
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

// Helper function to format time
function formatDateTime(dateTime) {
    return moment.utc(dateTime).local().format('h:mma');
}

export default class ExtendMeeting extends React.Component {

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
            var room_name = this.getRoomName(this.props.match.params.room);

            // Update the array of events in state
            this.setState({room_name: room_name});

            // Get the book until options (times that the room is bookable until in 15 min increments)
            var bookUntil = await getBookUntilOptions(moment().format('YYYY-MM-DDTHH:mm:ss'), this.props.match.params.room );

            // Update the array of events in state
            this.setState({times: bookUntil});

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

        //Set the data to update
        const apiData = {
            end: {
                dateTime: moment(this.state.selectedButton).format(),
                timeZone: "GMT Standard Time"
            }
        };

        event.preventDefault();

        //Resolve access token promise so we can send the accessToken value to MS Graph
                //Post event
        var result =  updateEvent(apiData, this.props.match.params.room, this.props.match.params.id );


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
                            <Row className="section book-until">
                                <Col xs={12}><h6>Select New End Time</h6></Col>
                                <Col>

                                    {this.state.times.map((hours, i) => {

                                        var row = hours.map((time, key) =>
                                            <Col xs={3} key={key}>
                                                <Button key2={key} className={time === this.state.selectedButton ? 'selected' : ''} variant="secondary" size="lg" key={time} onClick={this.buttonSelected(time)}>{formatDateTime(time)}</Button>
                                            </Col>
                                        );
                                        return <Row key={i}>{row}</Row>;
                                    })}
                                </Col>

                            </Row>

                        </fieldset>

                        <input type="submit" className="col-12 btn btn-lg btn-success" value="Extend Meeting" />
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


