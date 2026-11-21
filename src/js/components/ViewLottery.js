import React from "react";
import ReactDOM from "react-dom";
import {
    TextField,
    Button,
    CardTitle,
    DataTable,
    TableHeader,
    TableBody,
    TableRow,
    TableColumn,
    TablePagination,
    Divider
} from 'react-md';
import functions from '../DataFormFunctions'

export default class ViewLottery extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: "nothin g herre foksl",
            loading: true,
            start: 0,
            rowsPerPage: 0,
            winners: [],
            entrants: []
        };
    }

    onChange(name, value) {
        this.setState({
            [name]: value
        });
    }

    componentWillMount() {
        var that = this;
        functions.get('lottery', function (data) {
            console.log(data);
            if (data) {
                that.setState({
                    entrants: data.users,
                    data,
                    loading: false,
                    rowsPerPage: (data.users.length > 10 ? 10 : data.users.length)
                });
            }
        });
    }

    handlePagination = (start, rowsPerPage) => {
        if (rowsPerPage > this.state.data.users.length) {
            this.setState({
                'rowsPerPage': this.state.data.users.length,
                'start': start
            });

        } else {
            this.setState({
                'rowsPerPage': rowsPerPage,
                'start': start
            });
        }
    }

    pickWinner = () => {
        console.log(this.state);
        var copy = this.state.entrants.slice();
        var hat = [];
        for (var i = 0; i < this.state.entrants.length; i++) {
            hat = hat.concat(new Array(this.state.entrants[i].tickets).fill(i));
        }
        var index = Math.floor(Math.random() * hat.length);
        var winner = this.state.entrants[hat[index]].entrant_channel;

        copy.splice(hat[index], 1);
        this.setState({
            winners: this.state.winners.concat(winner),
            entrants: copy
        });
        console.log(this.state.winners);
    }

    closeRaffle = () => {
        functions.save('lottery/close', { 'winners': this.state.winners }, this.props.done);
    }

    render() {
        if (!this.state.loading) {
            var start_date = new Date(this.state.data.lottery.start_time).toLocaleString();
            console.log(this.state.data.lottery.start_date);
            //var start_date = "fuiku";
            return (
                <div className="md-grid">
                    <div className="md-cell md-cell--6">
                        <h1>Raffle settings</h1>
                        <h2>Start date: {start_date}</h2>
                    </div>
                    <div className="md-cell md-cell--6">
                        <h6 className="md-text-right">Ticket cost: {this.state.data.lottery.ticket_cost}</h6>
                        <h6 className="md-text-right">Max tickets: {this.state.data.lottery.ticket_max}</h6>
                    </div>
                    <Button
                        raised primary
                        className="md-cell md-cell--6"
                        disabled={this.state.entrants.length == 0}
                        onClick={this.pickWinner.bind(this)} >
                        Pick a winner
                    </Button>
                    <Button
                        raised secondary
                        className="md-cell md-cell--6"
                        onClick={this.closeRaffle.bind(this)} >
                        Close raffle
                    </Button>
                    {/* <div className="md-cell md-cell--12 md-divider-border md-divider-border--top"> */}
                    {[...new Array(this.state.winners.length)].map((_, i) => {
                        switch (i) {
                            case 0:
                                return (<h1 className="md-display-2 md-cell md-cell--12">First place goes to... {this.state.winners[0]}</h1>);
                            case 1:
                                return (<h2 className="md-display-1 md-cell md-cell--12">Second place: {this.state.winners[1]}</h2>);
                            case 2:
                                return (<h3 className="md-display-1 md-cell md-cell--12">Third place: {this.state.winners[2]}</h3>);
                            default:
                                return (<h6 className="md-cell md-cell--12" key={i}>{i + 1}: {this.state.winners[i]}</h6>);
                        }
                    })}
                    {/* </div> */}
                    <DataTable plain baseId="simple-pagination" className="md-cell md-cell--12 md-divider-border md-divider-border--top">
                        <TableHeader>
                            <TableRow>
                                <TableColumn>Entrants</TableColumn>
                                <TableColumn>Tickets Purchased</TableColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...new Array(this.state.rowsPerPage)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableColumn>{this.state.data.users[this.state.start + i].entrant_channel}</TableColumn>
                                    <TableColumn>{this.state.data.users[this.state.start + i].tickets}</TableColumn>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TablePagination rows={this.state.data.users.length} onPagination={this.handlePagination.bind(this)} />
                    </DataTable>
                </div>
            );
        } else {
            return (<h1>loadiung</h1>);
        }
    }
}