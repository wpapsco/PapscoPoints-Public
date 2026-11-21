import React from "react";
import ReactDOM from "react-dom";

import { Paper, Button, TextField } from 'react-md';

import functions from "../DataFormFunctions";

export default class RewardCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reward_info: ""
        };
    }

    onRedeem(reward_id) {
        console.log(this.props.points);
        if (this.props.points >= this.props.reward_price) {
            functions.save('redeem', {
                "reward_id": reward_id,
                "channel": this.props.channel,
                "reward_info": this.state.reward_info
            }, (response) => {
                console.log(response);
                if (response.status == 500) {
                    this.props.onRedeemFailed();
                } else {
                    this.props.onRedeem(this.props.reward_price);
                }
            });
            this.setState({
                reward_info: ""
            });
        }
    }

    onChange(name, value) {
        this.setState({
            [name]: value
        });
    }

    render() {
        return (
            <div className="md-cell md-cell--12">
                <Paper className="md-grid" id="reward-card">
                    <h5 className="md-cell md-cell--12 ppcenter">{this.props.reward_name}</h5>
                    <p className="md-cell md-cell--6 md-cell--middle">{this.props.reward_description}</p>
                    {this.props.logged_in ?
                        <TextField
                            label={this.props.is_songrequest ? "Youtube URL" : "Extra information"}
                            className="md-cell md-cell--6"
                            onChange={this.onChange.bind(this, 'reward_info')}
                            value={this.state.reward_info}
                        /> : null}
                    {this.props.logged_in ?
                        <Button className="md-cell md-cell--12"
                            raised
                            primary
                            onClick={this.onRedeem.bind(this, this.props.id)}
                            disabled={this.props.points <= this.props.reward_price}>
                            Redeem for {this.props.reward_price}
                        </Button> : null}
                </Paper>
            </div>
        );
    }
}