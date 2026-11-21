import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button
} from 'react-md';
import functions from '../DataFormFunctions'
import EditRewardCard from './EditRewardCard'
const _ = require('lodash');
const uuid = require('uuid')

export default class EditRewards extends React.Component {

    constructor(props) {
        super(props);
        console.log('constructing EditRewards');
        this.state = {
            loading: true,
        };
    }

    onChange(name, value, index) {
        var copy = this.state.data.slice();
        copy[index][name] = value;
        console.log(copy);
        // this.setState(prevState => ({
        //     data: copy
        // }));
        console.log(name, value, index);
    }

    componentWillMount() {
        if (this.state.loading == true) {
            this.refresh();
        }
    }

    refresh() {
        var that = this;
        functions.get('rewards/', (data) => {
            that.setState({
                data,
                loading: false
            });
            console.log(data);
        });
    }

    onAdd() {
        console.log('onadd');
        this.setState(prevState => ({
            data: prevState.data.concat({
                reward_name: "New Reward",
                id: uuid(),
                reward_price: 0
            })
        }));
    }

    onDelete(index) {
        console.log(this.state.data)
        console.log(this.state.data.slice(0, index).concat(this.state.data.slice(index + 1)))
        console.log(index)
        this.setState(prevState => ({
            data: prevState.data.slice(0, index).concat(prevState.data.slice(index + 1))
        }));
    }

    onSubmit() {
        console.log(this.state);
        functions.save('rewards', this.state.data);
    }

    render() {
        if (this.state.loading) {
            return (null);
        }
        var cards = [];
        for (var i = 0; i < this.state.data.length; i++) {
            cards = cards.concat(
                <EditRewardCard
                    onAdd={i == this.state.data.length - 1 ? this.onAdd.bind(this) : null}
                    onDelete={this.onDelete.bind(this)}
                    index={i}
                    key={this.state.data[i].id}
                    className="md-cell md-cell--12"
                    onChange={this.onChange.bind(this)}
                    {...this.state.data[i]} />);
        }
        return (
            <div className="md-grid">
                <h1 className="md-cell md-cell--12">Edit Rewards</h1>
                {cards}
                <Button raised primary className="md-cell md-cell--6" onClick={this.onAdd.bind(this)}>Add Reward</Button>
                <Button raised secondary className="md-cell md-cell--6" onClick={this.onSubmit.bind(this)}>Save</Button>
            </div>
        );
    }
}