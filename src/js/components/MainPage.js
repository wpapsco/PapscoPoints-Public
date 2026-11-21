import React from "react";

import { Button, Paper, Toolbar, ListItem, Drawer } from 'react-md';

export default class Layout extends React.Component {

    constructor(props) {
        super(props);
    }

    login() {
        var url = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id=71thqpiv5kzkdwa8gqwy2d54jyukb7&redirect_uri=http://www.papscopoints.com/twitchsignin&scope=chat_login+user_read";
        window.location = url; //redirect to twitchsignin express where our cookies are set username=xxx, hash=xxx
    }

    render() {
        return (
            <div className="md-grid">
                <h1 className="ppcenter md-cell md-cell--12">Welcome to PapscoPoints!</h1>
                <Button
                    raised
                    primary
                    className="md-cell md-cell--12"
                    onClick={this.login.bind(this)}>
                    Log in or sign up!
                </Button>
            </div>
        );
    }
}