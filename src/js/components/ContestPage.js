import React from "react";

import { Button, Paper, Toolbar, ListItem, Drawer } from 'react-md';
import ViewContest from "./ViewContest";
import CreateContest from "./CreateContest";
import functions from "../DataFormFunctions";

export default class ContestPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentWillMount() {
        var that = this;
        functions.get("contest", function (data) {
            that.setState({ contest: data.contest ? true : false, loading: false });
        });
    }

    done() {
        this.setState(prevState => ({
            contest: !prevState.contest
        }));
    }

    render() {
        if (!this.state.loading) {
            console.log(this.state.contest);
            return (this.state.contest ? (<ViewContest done={this.done.bind(this)} />) : (<CreateContest done={this.done.bind(this)} />));
        } else {
            return (<div />);
        }
    }
}