import React from "react";
import ReactDOM from "react-dom";
import webfontloader from "webfontloader";
import { BrowserRouter, Switch, Route, withRouter } from 'react-router-dom'

import { Button, Paper, Toolbar, ListItem, Drawer } from 'react-md';

import Leaderboard from "./components/Leaderboard";
import RewardPage from "./components/RewardPage";
import EditRewards from "./components/EditRewards";
import CreateLottery from "./components/CreateLottery";
import ViewLottery from "./components/ViewLottery";
import LotteryPage from "./components/LotteryPage";
import CreateContest from "./components/CreateContest";
import ViewContest from "./components/ViewContest";
import ContestPage from "./components/ContestPage";
import SettingsPage from "./components/SettingsPage";
import MainPage from "./components/MainPage";
import UsersPage from "./components/UsersPage";
import RedeemedRewards from "./components/RedeemedRewards";
import SongRequest from "./components/SongRequest";

import functions from "./DataFormFunctions";


webfontloader.load({
    google: {
        families: ['Roboto:100,200,300,400,500,600,700', 'Material Icons']
    },
})

class Layout extends React.Component {
    constructor(props) {
        super(props);
        var pages = {
            'Homepage': '/',
            'View Other Users': '/channels'
        };

        this.state = {
            drawer_visible: false,
            pages,
            logged_in: (functions.getCookie("username") ? true : false),
            username: functions.getCookie("username"),
            loaded: false
        };
    }

    componentWillMount() {
        this.refresh();
    }

    refresh() {
        console.log(this.state);
        var pages = {
            'Homepage': '/',
            'View Other Users': '/channels'
        };
        if (this.state.logged_in) {
            pages['Account Settings'] = '/settings';
            pages['Raffles'] = '/raffle';
            pages['Contests'] = '/contest';
            pages['Edit Rewards'] = '/rewards';
            pages['Redeemed Rewards'] = '/redeemed';
            pages['Play Song Requests'] = '/songrequest';
        }
        console.log(pages);
        this.setState({
            pages
        });
    }

    onVisibilityChange(change) {
        this.setState({
            drawer_visible: change
        });
    }

    onDrawerClicked(index) {
        console.log(index);
        console.log(this.state.pages[index]);
        this.props.history.push(this.state.pages[index]);
    }

    openDrawer() {
        this.setState({
            drawer_visible: true
        });
    }

    logout() {
        window.location = 'http://www.papscopoints.com/logout';
    }

    render() {
        var pages_list = [];
        for (var i in this.state.pages) {
            console.log(i);
            pages_list = pages_list.concat(
                <ListItem primaryText={i} onClick={this.onDrawerClicked.bind(this, i)} />
            );
            console.log(pages_list);
        }
        if (this.state.logged_in) {
            pages_list = pages_list.concat(
                <ListItem primaryText="Log Out" onClick={this.logout.bind(this)} />
            );
        }
        console.log(this.props.history);
        return (
            <div id="layout" className="dark-theme">
                <Toolbar colored fixed
                    title="PapscoPoints"
                    nav={(<Button icon onClick={this.openDrawer.bind(this)}>menu</Button>)}
                    actions={this.state.logged_in && <h4>Logged in as {this.state.username}</h4>} />
                <div className="md-toolbar-relative dark-theme">
                    <Paper className="md-text-container" id="main">
                        <Switch>
                            <Route path="/rewards/:channel" render={(props) => (<RewardPage channel={props.match.params.channel} />)} />
                            <Route path="/leaderboards/:channel" render={(props) => (<Leaderboard channel={props.match.params.channel} />)} />
                            <Route path="/channels" render={({ history }) => (<UsersPage history={history} />)} />
                            <Route path="/rewards" render={() => (<EditRewards />)} />
                            <Route path="/settings" render={() => (<SettingsPage />)} />
                            <Route path="/settingss" render={() => (<SettingsPage streamlabs/>)} />
                            <Route path="/raffle" render={() => (<LotteryPage />)} />
                            <Route path="/contest" render={() => (<ContestPage />)} />
                            <Route path="/redeemed" render={() => (<RedeemedRewards />)} />
                            <Route path="/songrequest" render={() => (<SongRequest />)} />
                            <Route exact path="/" render={() => (<MainPage />)} />
                        </Switch>
                    </Paper>
                </div>
                <Drawer
                    id="main-drawer"
                    className="md-toolbar-relative"
                    type={Drawer.DrawerTypes.TEMPORARY}
                    visible={this.state.drawer_visible}
                    onVisibilityChange={this.onVisibilityChange.bind(this)}
                    navItems={pages_list} />
            </div>
        );
    }
}

const app = document.getElementById('app');
ReactDOM.render(
    <BrowserRouter>
        <Route render={({ history }) => <Layout history={history} />} />
    </BrowserRouter>
    , app);