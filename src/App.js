import React, { Component } from 'react';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import { Col, Container, Row } from 'reactstrap';
import ErrorMessage from './ErrorMessage';
import Welcome from './Welcome';
import 'bootstrap/dist/css/bootstrap.css';
import config from './Config';
import { UserAgentApplication } from 'msal';
import { getUserDetails } from './GraphService';
import Calendar from './Calendar';
import StartMeeting from './StartMeeting';
import ExtendMeeting from './ExtendMeeting';
import EndMeeting from './EndMeeting';
import FindRoom from './FindRoom';
import Unsplash from 'react-unsplash-wrapper'
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

        //MS gRaph to get user
        this.userAgentApplication = new UserAgentApplication({
            auth: {
                clientId: config.appId
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: true
            }
        });

        //Set the user
        var user = this.userAgentApplication.getAccount();

        //Set up states
        this.state = {
            isAuthenticated: (user !== null),
            user: {},
            error: null,
            imageUrl: null,
            time: getTime(),
            backgroundImage: ""
        };

        //Get user details from Graph
        if (user) {
            // Enhance user object with data from Graph
            this.getUserProfile();
        }
    }

    //On mount (load)
    async componentDidMount() {

        try {
            // Get the user's access token
            var accessToken = await window.msal.acquireTokenSilent({
                scopes: config.scopes
            });
        }
        catch(err) {
            alert("there has been a problem loading the user")
        }

        this.intervalID = setInterval(
            () => this.refreshBackground(),
            1000
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
            backgroundImage: this.state.backgroundImage + "1"
        });
    }


    //Build the page
    render() {
        let error = null;
        if (this.state.error) {
            error = <ErrorMessage message={this.state.error.message} debug={this.state.error.debug} />;
        }

        const { imageUrl } = this.state.backgroundImage;

        return (

            <Router>
                <div className="bg-image" style={{ backgroundImage: '' }}>
                    <Unsplash
                        width="768"
                        height="1024"
                        keywords="scenic, mountain, mountains, landscape, nature"
                    />
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
                                            user={this.state.user}
                                            authButtonMethod={this.login.bind(this)} />
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

    async login() {
        try {
            await this.userAgentApplication.loginPopup(
                {
                    scopes: config.scopes,
                    prompt: "select_account"
                });
            await this.getUserProfile();
        }
        catch(err) {
            var error = {};

            if (typeof(err) === 'string') {
                var errParts = err.split('|');
                error = errParts.length > 1 ?
                    { message: errParts[1], debug: errParts[0] } :
                    { message: err };
            } else {
                error = {
                    message: err.message,
                    debug: JSON.stringify(err)
                };
            }

            this.setState({
                isAuthenticated: false,
                user: {},
                error: error
            });
        }
    }

    logout() {
        this.userAgentApplication.logout();
    }

    async getUserProfile() {
        try {
            // Get the access token silently
            // If the cache contains a non-expired token, this function
            // will just return the cached token. Otherwise, it will
            // make a request to the Azure OAuth endpoint to get a token

            var accessToken = await this.userAgentApplication.acquireTokenSilent({
                scopes: config.scopes
            });

            if (accessToken) {
                // Get the user's profile from Graph
                var user = await getUserDetails(accessToken);
                this.setState({
                    isAuthenticated: true,
                    user: {
                        displayName: user.displayName,
                        email: user.mail || user.userPrincipalName
                    },
                    error: null
                });
            }
        }
        catch(err) {
            var error = {};
            if (typeof(err) === 'string') {
                var errParts = err.split('|');
                error = errParts.length > 1 ?
                    { message: errParts[1], debug: errParts[0] } :
                    { message: err };
            } else {
                error = {
                    message: err.message,
                    debug: JSON.stringify(err)
                };
            }

            this.setState({
                isAuthenticated: false,
                user: {},
                error: error
            });
        }
    }
}

export default App;
