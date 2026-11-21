import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button,
    Switch,
    SelectionControl,
    Paper
} from 'react-md';
import functions from '../DataFormFunctions'

export default class SettingsPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentWillMount() {
        var that = this;
        functions.get('settings', function (data) {
            console.log(data.settings);
            data.settings.bits_mul = data.settings.bits_mul * 100;
            that.setState({
                settings: data.settings,
                loading: false,
                points_name: data.settings.points_name
            });
        });
    }

    onChange(name, value) {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                [name]: value
            }
        }));
        if (this.props.onChange) {
            this.props.onChange(name, value, this.props.index);
        }
    }

    startBot() {
        functions.save('bot/start');
    }

    openStreamlabs() {
        window.location="https://www.streamlabs.com/api/v1.0/authorize?client_id=F9HckpMwb4rG7EnnrlMFnLgt1hwuMsBwPTnJxQH4&redirect_uri=http://www.papscopoints.com/streamlabssignup&response_type=code&scope=donations.read+alerts.create";
    }

    saveSettings() {
        console.log(this.state.settings);
        functions.save('settings', {
            settings: this.state.settings
        });
    }

    render() {
        if (!this.state.loading) {
            var { settings } = this.state;
            var points = (this.state.settings.points_name ? this.state.settings.points_name : "Points");
            var halfsize = "md-cell md-cell--6 md-cell--12-tablet";
            return (
                <div className="md-grid">
                    <h1 className="md-cell md-cell--12">{settings.channel}'s settings</h1>
                    <TextField
                        id="points-name"
                        label="Name for Points"
                        value={settings.points_name}
                        className="md-cell"
                        onChange={this.onChange.bind(this, "points_name")}
                    />
                    <TextField
                        id="points-pm"
                        label={points + " given per minute"}
                        value={settings.points_per_minute}
                        className="md-cell"
                        onChange={this.onChange.bind(this, "points_per_minute")}
                    />
                    <Button
                        raised primary
                        id="start-bot"
                        name="start-bot"
                        className="md-cell md-cell--middle"
                        onClick={this.startBot.bind(this)}>
                        Start Bot
                    </Button>
                    <Paper className="md-cell md-cell--12 md-grid pp-card">
                        <div className="md-cell md-cell--12">
                            <h4>When viewers donate to your channel, they are given {points}{points == "Points" ? "" : " (points)"}.</h4>
                            <h5>These values control how many {points} are given per donation.</h5>
                        </div>
                        <TextField
                            id="bits-mul"
                            label={points + " per 100 bits"}
                            value={settings.bits_mul}
                            className="md-cell md-cell--12"
                            type="number"
                            onChange={this.onChange.bind(this, "bits_mul")}
                        />
                        <TextField
                            id="subs-mul"
                            label={points + " per month of a $5 subscription"}
                            value={settings.subs_mul}
                            className="md-cell md-cell--12"
                            type="number"
                            onChange={this.onChange.bind(this, "subs_mul")}
                        />
                        <TextField
                            id="cents-mul"
                            label={points + " per dollar of a donation"}
                            value={settings.donations_mul}
                            className="md-cell md-cell--12"
                            type="number"
                            onChange={this.onChange.bind(this, "donations_mul")}
                        />
                    </Paper>
                    <Button raised primary onClick={this.saveSettings.bind(this)} className={halfsize}>Save settings</Button>
                    <Button raised secondary onClick={this.openStreamlabs.bind(this)} className={halfsize}>Re-link Streamlabs account</Button>
                </div>
            );
        } else {
            return (<div />);
        }
    }
}