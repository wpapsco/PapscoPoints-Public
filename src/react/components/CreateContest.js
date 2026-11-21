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
            options: 1,
            option_list: ['']
        };
    }

    onChange(name, value) {
        this.setState({
            [name]: value
        });
    }

    onOption(index, value) {
        var copy = this.state.option_list.slice();
        copy[index] = value;
        this.setState(prevState => ({
            ...prevState,
            option_list: copy
        }));
    }

    removeOption(index) {
        var copy = this.state.option_list.slice();
        copy.splice(index, 1);
        this.setState(prevState => ({
            ...prevState,
            options: prevState.options - 1,
            option_list: copy
        }));
    }

    addOption() {
        this.setState(prevState => ({
            ...prevState,
            options: prevState.options + 1,
            option_list: prevState.option_list.concat('')
        }));
    }

    onSubmit() {
        console.log(this.state);
        functions.save('contest/start', this.state, this.props.done)
    }

    render() {
        return (
            <div className="md-grid">
                <h1 className="md-cell md-cell--12">Create Contest</h1>
                <TextField
                    required
                    id="contest-title"
                    label="Contest Title"
                    placeholder="Tell your viewers what they're betting on!"
                    className="md-cell md-cell--10"
                    onChange={this.onChange.bind(this, "contest_title")}
                />
                <TextField
                    required
                    id="contest-max-bet"
                    label="Maximum Bet"
                    type="number"
                    className="md-cell md-cell--2-desktop md-cell--12-tablet"
                    onChange={this.onChange.bind(this, "max_bet")}
                />
                {[...new Array(this.state.options)].map((_, i) => (
                    <TextField
                        required
                        id="contest-option"
                        label={"Option " + (i + 1)}
                        className="md-cell md-cell--12 md-cell--bottom"
                        onChange={this.onOption.bind(this, i)}
                        value={this.state.option_list[i]}
                        inlineIndicator={this.state.options != 1 ?
                            <Button icon mini
                                onClick={this.removeOption.bind(this, i)}
                                className="text-fields__inline-btn">
                                clear
                        </Button> : null
                        }
                        leftIcon={<h1>{i + 1}.</h1>}
                    />))}
                <Button
                    raised primary
                    onClick={this.addOption.bind(this)}
                    className="md-cell md-cell--6 md-cell--bottom">
                    Add Option
                </Button>
                <Button
                    raised secondary
                    onClick={this.onSubmit.bind(this)}
                    className="md-cell md-cell--6 md-cell--bottom">
                    Start Contest
                </Button>
            </div>
        );
    }
}