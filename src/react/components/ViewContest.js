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
    Divider,
    Paper
} from 'react-md';
import { PieChart, Pie, Text } from 'recharts';
import functions from '../DataFormFunctions';

export default class ViewLottery extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            selected: false,
            betsclosed: false
        };
    }

    onChange(name, value) {
        this.setState({
            [name]: value
        });
    }

    componentWillMount() {
        this.refresh();
    }

    refresh() {
        var that = this;
        functions.get('contest', function (data) {
            if (data) {
                var data01 = [];
                var jackpot = 0;
                console.log(data.options);
                for (var i = 0; i < data.options.length; i++) {
                    data01 = data01.concat({ name: data.options[i].text, value: 0 });
                }
                console.log(data01);
                for (var i = 0; i < data.entrants.length; i++) {
                    data01[data.entrants[i].bet_option].value += data.entrants[i].points;
                    jackpot += data.entrants[i].points;
                }
                console.log(data01);
                that.setState({
                    data,
                    loading: false,
                    jackpot,
                    pie_data: data01
                });
            }
        });
    }

    customPieLabels({ cx, x, y, name, index, value }) {
        return (
            <Text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'}>
                {name}
            </Text>
        );
    }

    onSelection(option) {
        console.log(option);
        var selection = this.state.data.options[option].text;
        var winners = [];
        var winner_total = 0;
        for (var i = 0; i < this.state.data.entrants.length; i++) {
            var entrant = this.state.data.entrants[i];
            if (entrant.bet_option == option) {
                winners = winners.concat(entrant);
                winner_total += entrant.points;
            }
        }
        var payouts = [];
        for (var i = 0; i < winners.length; i++) {
            var payout = (winners[i].points / winner_total) * this.state.jackpot;
            payouts = payouts.concat({ 'name': winners[i].entrant_channel, payout });
        }
        console.log(winners);
        console.log(payouts);
        this.setState({
            winners,
            payouts,
            selected: true,
            selection,
            option
        });
    }

    onClose() {
        functions.save('contest/close', { selection: this.state.selection, option: this.state.option }, this.props.done);
    }

    closeBets() {
        functions.save('contest/closebets', {});
        this.setState({
            betsclosed: true
        });
    }

    render() {
        const data = this.state.data;
        console.log(data);
        // const data01 = [{name: 'Group A', value: 400}, {name: 'Group B', value: 300},
        // {name: 'Group C', value: 300}, {name: 'Group D', value: 200}];
        if (!this.state.loading) {
            var start_date = new Date(data.contest.start_time).toLocaleString();
            return (
                <div className="md-grid">
                    <div className="md-cell md-cell--6 md-cell--8-desktop">
                        <h1>{data.contest.description}</h1>
                        <h2>Start date: {start_date}</h2>
                    </div>
                    <div className="md-cell md-cell--4 md-cell--2-tablet">
                        <h6 className="md-text-right">Total jackpot: {this.state.jackpot}</h6>
                        <h6 className="md-text-right">Users in contest: {data.entrants.length}</h6>
                        <h6 className="md-text-right">Max bet: {data.contest.max_bet}</h6>
                    </div>
                    {this.state.jackpot > 0 ?
                        <div className='md-cell md-cell--8 md-cell--7-desktop pp-card md-paper md-paper--2' >
                            <PieChart width={310} height={300} className="ppinner">
                                <Pie label={this.customPieLabels} data={this.state.pie_data} cx="50%" cy="50%" outerRadius="55%" fill="#EC407A" />
                            </PieChart>
                        </div> : null
                    }
                    {this.state.selected ?
                        (<h1 className="md-cell md-cell--12">Selection: {this.state.selection}</h1>)
                        :
                        [...new Array(data.options.length)].map((_, i) => (
                            <Button raised
                                primary={i % 2 == 0}
                                secondary={i % 2 == 1}
                                onClick={this.onSelection.bind(this, i)}
                                className="md-cell md-cell--12">Option {i + 1}: {data.options[i].text}</Button>
                        ))
                    }
                    {!this.state.betsclosed && !this.state.selected && !data.contest.is_started &&
                        <Button raised
                            primary={data.options.length % 2 == 0}
                            secondary={data.options.length % 2 == 1}
                            className="md-cell md-cell--12"
                            onClick={this.closeBets.bind(this)}>
                            Close bets
                        </Button>
                    }
                    {!this.state.selected ? null :
                        [(<DataTable plain className='md-cell md-cell--8 md-cell--5-desktop md-paper md-paper--2 pp-card'>
                            <TableHeader>
                                <TableRow>
                                    <TableColumn grow>Username</TableColumn>
                                    <TableColumn>Payout</TableColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...new Array(this.state.payouts.length)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableColumn>{this.state.payouts[i].name}</TableColumn>
                                        <TableColumn>{Math.round(this.state.payouts[i].payout)}</TableColumn>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </DataTable>),
                        (<Button raised primary
                            className='md-cell md-cell--12'
                            onClick={this.onClose.bind(this)}>
                            Close Contest</Button>)
                        ]}
                </div>
            );
        } else {
            return (<h1>loadiung</h1>);
        }
    }
}