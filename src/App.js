import React, { Component } from 'react';
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container } from 'reactstrap';
import ErrorMessage from './ErrorMessage';
import Welcome from './Welcome';
import 'bootstrap/dist/css/bootstrap.css';
import config from './Config';
import { UserAgentApplication } from 'msal';
import {getEvents, getNextEvent, getNowEvent, getUserDetails} from './GraphService';
import Calendar from './Calendar';
import StartMeeting from './StartMeeting';
import Unsplash from 'react-unsplash-wrapper'

class App extends Component {
    constructor(props) {
        super(props);

        this.userAgentApplication = new UserAgentApplication({
            auth: {
                clientId: config.appId
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: true
            }
        });

        var user = this.userAgentApplication.getAccount();

        this.state = {
            isAuthenticated: (user !== null),
            user: {},
            error: null,
            imageUrl: null
        };

        if (user) {
            // Enhance user object with data from Graph
            this.getUserProfile();
        }
    }



    async componentDidMount() {

        try {
            // Get the user's access token
            var accessToken = await window.msal.acquireTokenSilent({
                scopes: config.scopes
            });

        }
        catch(err) {
                this.props.showError('ERROR', JSON.stringify(err));
            }
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    handleFinishedUploading = imageUrl => {
        this.setState({ imageUrl });
    }

    render() {
        let error = null;
        if (this.state.error) {
            error = <ErrorMessage message={this.state.error.message} debug={this.state.error.debug} />;
        }

        const { imageUrl } = this.state;

        return (


            <Router>
                <div class="bg-image">
                    <Unsplash width="768" height="1024" keywords="scenic, mountain, mountains"/>
                </div>
                <div>
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
                                             user={this.state.user}
                                             showError={this.setErrorMessage.bind(this)} />
                               } />
                        <Route exact path="/calendar/:room/start-meeting"
                               render={(props) =>
                                   <StartMeeting {...props}
                                             user={this.state.user}
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
