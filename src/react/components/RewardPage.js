import React from "react";
import ReactDOM from "react-dom";
import RewardCard from "./RewardCard";
import { Snackbar } from "react-md";

var functions = require('../DataFormFunctions').default;

export default class RewardPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            toasts: [],
            points: 0
        };
    }

    componentWillMount() {
        var that = this;
        functions.get('rewards/' + this.props.channel, (data) => {
            that.setState({ data });
        });
        functions.get('points/' + this.props.channel, (points) => {
            that.setState({ points: points.points })
            console.log(points)
        });
    }

    onRedeem(price) {
        console.log(price);
        console.log(this.state.points);
        if (price <= this.state.points) {
            this.setState({
                points: this.state.points - price,
            });
            this.addToast('Reward redeemed!');
        } else {
            this.addToast("You don't have enough points!");
        }
    }

    onRedeemFailed() {
        this.addToast('Reward could not be redeemed.');
    }

    addToast(text) {
        this.setState({
            toasts: [
                ...this.state.toasts,
                { text }
            ]
        });
    }

    dismissToast() {
        const [, ...toasts] = this.state.toasts;
        this.setState({ toasts });
    }

    render() {
        return (
            <div className="md-grid">
                <div className="md-cell md-cell--12">
                    <h1>{this.props.channel}'s rewards</h1>
                    {functions.getCookie('username') ?
                        <h2>{functions.getCookie('username')}'s points: {this.state.points}</h2>
                        : null}
                </div>
                {[...new Array(this.state.data.length)].map((_, i) => (
                    <RewardCard
                        channel={this.props.channel}
                        logged_in={functions.getCookie('username').length > 0}
                        onRedeem={this.onRedeem.bind(this)}
                        onRedeemFailed={this.onRedeemFailed.bind(this)}
                        key={i}
                        points={this.state.points}
                        {...this.state.data[i]} />
                ))}
                <Snackbar
                    id="reward-snackbar"
                    toasts={this.state.toasts}
                    autohide
                    onDismiss={this.dismissToast.bind(this)}
                />
            </div>
        );
    }
}