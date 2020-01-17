import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import { Col, Container, Row } from 'reactstrap';
import ErrorMessage from './ErrorMessage';
import Welcome from './Welcome';
import 'bootstrap/dist/css/bootstrap.css';
import Calendar from './Calendar';
import StartMeeting from './StartMeeting';
import ExtendMeeting from './ExtendMeeting';
import EndMeeting from './EndMeeting';
import FindRoom from './FindRoom';
import moment from "moment";

//Date and time functions (for displaying the header
function getTodaysDate() {
    return moment.utc().local().format('dddd, Do MMMM YYYY');
}

function getTime() {
    return moment.utc().local().format(' h:mma');
}

//Start Class
class App extends Component {

    //Constructor
    constructor(props) {
        super(props);

        //Set up states
        this.state = {
            isAuthenticated: true,
            user: {},
            error: null,
            imageUrl: null,
            time: getTime(),
            backgroundImage: "https://source.unsplash.com/768x1024/?nature,mountains,water,mountain,snow,lakes,lake,travel",
        };

    }

    //On mount (load)
    async componentDidMount() {

        this.intervalID = setInterval(
            () =>this.tick(),
            1000
        );

        this.intervalID = setInterval(
            () => this.refreshBackground(),
            60 * 60000 //1 Hour
        );

    }

    //On un mount
    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    //Ticking clock
    tick() {
        this.setState({
            time: getTime()
        });
    }

    //Refresh background picture
    refreshBackground() {

        this.setState({
            backgroundImage: this.state.backgroundImage + 1
        });
        this.tick();
    }


    //Build the page
    render() {
        let error = null;
        if (this.state.error) {
            error = <ErrorMessage message={this.state.error.message} debug={this.state.error.debug} />;
        }

        const  imageUrl = this.state.backgroundImage;

        return (

            <Router>
                <div className="bg-image" style={{backgroundImage: "url(' " + imageUrl + "')" }}>
                </div>

                <div>
                    <Container>
                        <Row className="header d-flex align-items-end" >
                            <Col xs={9}><h2><Link className="home-link" to="/">{getTodaysDate()}</Link></h2></Col>
                            <Col xs={3} className="text-right"><h1>{this.state.time}</h1></Col>
                        </Row>
                    </Container>
                    <Container>
                        {error}
                        <Route exact path="/"
                               render={(props) =>
                                   <Welcome {...props}
                                            isAuthenticated={this.state.isAuthenticated}
                                            user={this.state.user} />
                               } />
                        <Route exact path="/calendar/:room"
                               render={(props) =>
                                   <Calendar {...props}
                                             isAuthenticated={this.state.isAuthenticated}
                                             user={this.state.user}
                                             showError={this.setErrorMessage.bind(this)} />
                               } />
                        <Route exact path="/calendar/:room/start-meeting"
                               render={(props) =>
                                   <StartMeeting {...props}
                                             isAuthenticated={this.state.isAuthenticated}
                                             user={this.state.user}
                                             time={this.state.time}
                                             showError={this.setErrorMessage.bind(this)} />
                               } />
                        <Route exact path="/calendar/:room/:id/extend-meeting"
                               render={(props) =>
                                   <ExtendMeeting {...props}
                                                  isAuthenticated={this.state.isAuthenticated}
                                                  user={this.state.user}
                                                  time={this.state.time}
                                                  showError={this.setErrorMessage.bind(this)} />
                               } />
                        <Route exact path="/calendar/:room/:id/end-meeting"
                               render={(props) =>
                                   <EndMeeting {...props}
                                               isAuthenticated={this.state.isAuthenticated}
                                               user={this.state.user}
                                               time={this.state.time}
                                               showError={this.setErrorMessage.bind(this)} />
                               } />
                        <Route exact path="/calendar/:room/find-room"
                               render={(props) =>
                                   <FindRoom {...props}
                                               isAuthenticated={this.state.isAuthenticated}
                                               user={this.state.user}
                                               time={this.state.time}
                                               showError={this.setErrorMessage.bind(this)} />
                               } />
                    </Container>
                </div>
            </Router>
        );
    }

    setErrorMessage(message, debug) {
        this.setState({
            error: {message: message, debug: debug}
        });
    }

}

export default App;
