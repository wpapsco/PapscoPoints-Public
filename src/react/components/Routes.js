import ContestPage from "./ContestPage";
import SettingsPage from "./SettingsPage";
import MainPage from "./MainPage";
import UsersPage from "./UsersPage";
import LotteryPage from "./LotteryPage";
import Leaderboard from "./Leaderboard";
import RewardPage from "./RewardPage";
import EditRewards from "./EditRewards";
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import React from "react";

export default class Routes extends React.Component {
    render() {
        return (
            <Switch>
                <Route path="/rewards/:channel" render={(props) => (<RewardPage channel={props.match.params.channel} />)} />
                <Route path="/leaderboards/:channel" render={(props) => (<Leaderboard channel={props.match.params.channel} />)} />
                <Route path="/channels" render={() => (<UsersPage />)} />
                <Route path="/rewards" render={() => (<EditRewards />)} />
                <Route path="/settings" render={() => (<SettingsPage />)} />
                <Route path="/raffle" render={() => (<LotteryPage />)} />
                <Route path="/contest" render={() => (<ContestPage />)} />
                <Route exact path="/" render={() => (<MainPage />)} />
            </Switch>
        );
    }
}