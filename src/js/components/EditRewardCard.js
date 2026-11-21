import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button,
    SelectionControl
} from 'react-md';
import functions from '../DataFormFunctions'

export default class EditRewardCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    onChange(name, value) {
        this.setState({
            [name]: value
        });
        if (this.props.onChange) {
            this.props.onChange(name, value, this.props.index);
        }
    }

    componentWillMount() {
        this.refresh();
    }

    refresh() {
        console.log(this.props);
    }

    onDelete() {
        if (this.props.onDelete) {
            this.props.onDelete(this.props.index);
        }
    }

    render() {
        //https://www.npmjs.com/package/react-youtube get this
        return (
            <div className={this.props.className}>
                <div className="md-grid md-paper md-paper--2 pp-card">
                    <TextField
                        id="reward_price"
                        onChange={this.onChange.bind(this, "reward_price")}
                        label="Reward Price"
                        className="md-cell md-cell--2"
                        defaultValue={this.props.reward_price}
                    />
                    <TextField
                        id="reward_name"
                        onChange={this.onChange.bind(this, "reward_name")}
                        label="Reward Name"
                        className="md-cell md-cell--4"
                        defaultValue={this.props.reward_name}
                    />
                    <TextField
                        id="reward_description"
                        onChange={this.onChange.bind(this, "reward_description")}
                        label="Reward Description"
                        className="md-cell md-cell--6"
                        defaultValue={this.props.reward_description}
                    />
                    <SelectionControl
                        id={"switch-twitchalert"+this.props.index}
                        type="switch"
                        label="Triggers a Twitchalert when redeemed"
                        onChange={this.onChange.bind(this, "do_twitchalert")}
                        className="md-cell md-cell--6"
                        defaultChecked={this.props.do_twitchalert == 1}
                    />
                    <SelectionControl
                        id={"switch-songrequest"+this.props.index}
                        type="switch"
                        label="Links Play in the Playlist"
                        onChange={this.onChange.bind(this, "is_songrequest")}
                        className="md-cell md-cell--6"
                        defaultChecked={this.props.is_songrequest == 1}
                    />
                    {!this.props.onDelete ? null :
                        <Button raised secondary
                            onClick={this.onDelete.bind(this)}
                            className="md-cell md-cell--12">
                            Delete This Reward
                        </Button>}
                </div>
            </div>
        );
    }
}