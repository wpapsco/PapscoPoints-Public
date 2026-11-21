import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button,
    SelectionControl
} from 'react-md';
import functions from '../DataFormFunctions'
import YouTube from "react-youtube";
import getYoutubeId from "get-youtube-id";
import { setTimeout } from "timers";

export default class SongRequest extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            currentVideo: "",
            songs: [],
            rewards: [],
            timeout: 30000
        }
    }

    loadRewards() {
        let that = this;
        functions.get('redeemedrewards', function (rewards) {
            let songs = [];
            let song_rewards = []
            for (let reward of rewards) {
                if (reward.is_songrequest && reward.reward_info) {
                    let id = getYoutubeId(reward.reward_info);
                    console.log(id);
                    if (id) {
                        songs.push(id);
                        song_rewards.push(reward);
                    }
                }
            }
            that.setState({
                currentVideo: songs[0],
                songs: songs.slice(1),
                rewards: song_rewards
            });
        });
    }

    componentWillMount() {
        const timer = setInterval(this.loadRewards.bind(this), this.state.timeout);
        this.loadRewards()
        this.setState({ timer })
    }

    componentWillUnmount() {
        clearInterval(this.state.timer)
    }

    removeReward(reward_id, redeemer, reward_info) {
        let i = this.state.rewards.findIndex(reward => reward.reward_id == reward_id && reward.redeemer_channel == redeemer && reward.reward_info == reward_info);
        let copy = this.state.rewards.slice();
        copy.splice(i, 1);
        this.setState({
            rewards: copy
        });
    }

    completeReward = () => {
        let { reward_id, redeemer_channel, reward_info } = this.state.rewards[0];
        functions.save('redeemed/done', { reward_id, redeemer: redeemer_channel, reward_info });
        this.setState({
            rewards: this.state.rewards.slice(1)
        });
    }

    playNextVideo() {
        //play next video
        this.setState({
            currentVideo: this.state.songs[0],
            songs: this.state.songs.slice(1)
        });

        //set reward as done
        this.completeReward();

        //see if there are more songrequests
        if (this.state.songs.length == 0) {
            this.loadRewards();
        }
    }

    refund = () => {
        let { reward_id, redeemer_channel, reward_info } = this.state.rewards[0];
        functions.save('redeemed/refund', { reward_id, redeemer: redeemer_channel, reward_info });
        this.playNextVideo();
    }

    render() {
        let reward = this.state.rewards[0];
        console.log(this.state.currentVideo)
        return (
            <div>
                <div className="md-grid">
                    {reward && <h1 className="md-cell md-cell--12">{reward.reward_name} redeemed by {reward.redeemer_channel}</h1>}
                </div>
                {this.state.currentVideo === undefined ?
                    <div className="md-grid">
                        <p className="md-cell md-cell--12 md-text-center"> You have watched everything! </p>
                    </div> :
                    <YouTube
                        videoId={this.state.currentVideo}
                        onEnd={this.playNextVideo.bind(this)}
                        opts={{ playerVars: { autoplay: 1 } }}
                    />}
                <div className="md-grid">
                    {reward && <Button raised primary className="md-cell md-cell--12" onClick={this.refund.bind(this)}>Refund and skip for {reward.refund_cost}</Button>}
                </div>
            </div>
        );
    }
}