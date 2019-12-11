import React from 'react';
import {
    Button,
    Row, Col, Container
} from 'reactstrap';
import { Link } from 'react-router-dom'
import moment from "moment";

function WelcomeContent(props) {
    // If authenticated, greet the user
    if (props.isAuthenticated) {
        return (
            <div>
                <Row className="text-center">
                    <Col>
                        <Link className="btn btn-primary btn-lg" to="/calendar/conference-room">Conference Room</Link>
                    </Col>
                    <Col>
                        <Link className="btn btn-primary btn-lg" to="/calendar/meeting-room">Meeting Room</Link>
                    </Col>
                    <Col>
                        <Link className="btn btn-primary btn-lg" to="/calendar/goldfish-bowl">Goldfish Bowl</Link>
                    </Col>
                    <Col>
                        <Link className="btn btn-primary btn-lg" to="/calendar/ross-test">Ross Test</Link>
                    </Col>
                </Row>
            </div>
        );
    }

    // Not authenticated, present a sign in button
    return <Button color="primary" onClick={props.authButtonMethod}>Click here to sign in</Button>;
}

function getTodaysDate() {
    return moment.utc().local().format('dddd, Do MMMM YYYY');
}

function getTime() {
    return moment.utc().local().format(' h:mma');
}

export default class Welcome extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            time: getTime()
        };
    }

    async componentDidMount() {
        this.intervalID = setInterval(
            () => this.tick(),
            1000
        );
    }

    tick() {
        this.setState({
            time: getTime()
        });
    }

    render() {
        return (
            <div>
                <Container>

                    <Row>
                        <Col>
                            <Col xs={12} className="text-center"><h1 className="room-name">Aspin Meeting Rooms</h1></Col>
                            <p className="lead text-center">
                                Please select a room to display on this device.
                            </p>

                            <WelcomeContent
                                isAuthenticated={this.props.isAuthenticated}
                                user={this.props.user}
                                authButtonMethod={this.props.authButtonMethod} />
                        </Col>
                    </Row>
                </Container>
            </div>


        );
    }
}
