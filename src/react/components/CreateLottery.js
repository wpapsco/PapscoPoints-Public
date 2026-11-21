import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button
} from 'react-md';
import functions from '../DataFormFunctions'

export default class CreateLottery extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    onChange(name, value) {
        this.setState({
            [name]:value
        });
    }

    onStart() {
        console.log(this.state);
        functions.save('lottery/start', this.state, this.props.done);
    }

    render() {
        return (
            <div className="md-grid">
                <h1 className="md-cell md-cell--12">Create a new raffle</h1>
                <TextField
                    className="md-cell md-cell--6" 
                    label="Max tickets for viewers to buy"
                    type="number"
                    maxLength={3}
                    onChange={this.onChange.bind(this, 'max')}
                />
                <TextField
                    className="md-cell md-cell--6"
                    label="Ticket cost"
                    type="number"
                    onChange={this.onChange.bind(this, 'cost')}
                />
                <Button 
                    label="Create and Start"
                    raised primary
                    className="md-cell md-cell--12"
                    onClick={this.onStart.bind(this)}
                />
            </div>
        );
    }
}