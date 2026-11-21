import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button,
    Paper
} from 'react-md';
import functions from '../DataFormFunctions'

export default class RedeemedRewards extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            redeemed: [],
            username: functions.getCookie('username')
        }
    }

    componentWillMount() {
        let that = this;
        functions.get('redeemedrewards', function (redeemed) {
            that.setState({
                redeemed,
                loading: false
            });
        });
    }
    
    removeReward(reward_id, redeemer, reward_info) {
        let i = this.state.redeemed.findIndex(reward => reward.reward_id == reward_id && reward.redeemer_channel == redeemer && reward.reward_info == reward_info);
        let copy = this.state.redeemed.slice();
        copy.splice(i, 1);
        this.setState({
            redeemed: copy
        });
    }

    refund = (reward_id, redeemer, reward_info) => () => {
        functions.save('redeemed/refund', { reward_id, redeemer, reward_info });
        this.removeReward(reward_id, redeemer, reward_info);
    }

    completeReward = (reward_id, redeemer, reward_info) => () => {
        console.log(reward_info);
        functions.save('redeemed/done', { reward_id, redeemer, reward_info });
        this.removeReward(reward_id, redeemer, reward_info);
    }


    render() {
        if (!this.state.loading) {
            return (
                <div className="md-grid">
                    <h1 className="md-cell md-cell--12">Redeemed rewards for {this.state.username}</h1>
                    {this.state.redeemed.map((reward, i) => (
                        <Paper className="md-cell md-cell--12 md-grid pp-card" key={i}>
                            <h3 className="md-cell md-cell--12">{reward.redeemer_channel} redeemed {reward.reward_name ? reward.reward_name : '-deleted reward-'}</h3>
                            <h4 className="md-cell md-cell--12">At {new Date(reward.redeem_time).toLocaleString()}</h4>
                            {reward.reward_info.length > 0 && <p className="md-cell md-cell--12">With info: "{reward.reward_info}"</p>}
                            <Button raised primary
                                className="md-cell md-cell--6"
                                onClick={this.refund(reward.reward_id, reward.redeemer_channel, reward.reward_info)}>
                                Refund for {reward.refund_cost}
                            </Button>
                            <Button raised secondary
                                className="md-cell md-cell--6"
                                onClick={this.completeReward(reward.reward_id, reward.redeemer_channel, reward.reward_info)}>
                                Mark as completed
                            </Button>
                        </Paper>
                    ))}
                    {this.state.redeemed.length == 0 && <p className="md-cell md-cell--12 md-text-center">All rewards fulfilled!</p>}
                </div>
            );
        } else {
            return (<h1>loadinge</h1>);
        }
    }
}