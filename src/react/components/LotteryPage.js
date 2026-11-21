import React from "react";

import { Button, Paper, Toolbar, ListItem, Drawer } from 'react-md';
import ViewLottery from "./ViewLottery";
import CreateLottery from "./CreateLottery";
import functions from "../DataFormFunctions";

export default class LotteryPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentWillMount() {
        var that = this;
        functions.get("lottery", function (data) {
            that.setState({ lottery: data.lottery ? true : false, loading: false });
        });
    }

    done() {
        this.setState(prevState => ({
            lottery: !prevState.lottery
        }));
    }

    render() {
        if (!this.state.loading) {
            console.log(this.state.lottery);
            return (this.state.lottery ? (<ViewLottery done={this.done.bind(this)} />) : (<CreateLottery done={this.done.bind(this)} />));
        } else {
            return (<div />);
        }
    }
}