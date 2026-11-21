import React from "react";
import ReactDOM from "react-dom";
import functions from '../DataFormFunctions'
import {
    DataTable,
    TableHeader,
    TableBody,
    TableRow,
    TableColumn,
    TablePagination,
    TextField,
    Button
} from 'react-md';

export default class Leaderboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            start: 1,
            rowsPerPage: 10,
            length: 0,
            toSearch: "",
            searching: false
        };
    }

    componentWillMount() {
        var that = this;
        // functions.get('leaderboard/' + this.props.channel, (data) => {
        //     console.log(data);
        //     that.setState({
        //         "data": data,
        //         rowsPerPage: data.length < 10 ? data.length : 10
        //     });
        // });
        functions.get('leaderboard/' + this.props.channel + "?f=0&l=10", (data) => {
            that.setState({
                data: data.leaderboard,
                rowsPerPage: data.length < 10 ? data.length : 10,
                length: data.count
            })
        })
        console.log(this.state);
    }

    handleChange(toSearch) {
        this.setState({
            toSearch
        })
    }

    handlePagination = (start, rowsPerPage) => {
        const that = this;
        functions.get('leaderboard/' + this.props.channel + "?f=" + start + "&l=" + rowsPerPage, (data) => {
            that.setState({
                data: data.leaderboard,
                rowsPerPage: data.leaderboard.length < rowsPerPage ? data.leaderboard.length : rowsPerPage,
                length: data.count,
                start: Math.ceil(start / rowsPerPage) + 1,
                searching: false
            })
        })
    }

    search() {
        this.setState({
            searching: true
        })
        functions.getP('rank/' + this.props.channel + '/' + this.state.toSearch)
            .then(data => {
                this.handlePagination(data.rank, this.state.rowsPerPage)
            }).catch(() => this.setState({ searching: false }))
    }

    render() {
        console.log(this.state)
        return (
            <div className="md-grid">
                <h1 className="md-cell md-cell--12">{this.props.channel}'s leaderboard</h1>
                <TextField className="md-cell md-cell--8" id="find-me" label="Search for user" onChange={this.handleChange.bind(this)} />
                <Button raised secondary className="md-cell md-cell--4 md-cell--bottom" id="search" label={this.state.searching ? "Searching..." : "Find"} onClick={this.search.bind(this)} />
                <DataTable plain baseId="simple-pagination" className="md-cell md-cell--12">
                    <TableHeader>
                        <TableRow>
                            <TableColumn>Ranking</TableColumn>
                            <TableColumn>Username</TableColumn>
                            <TableColumn>Points</TableColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...new Array(this.state.rowsPerPage)].map((_, i) => (
                            <TableRow key={i}>
                                <TableColumn>{((this.state.start - 1) * this.state.rowsPerPage) + i + 1}</TableColumn>
                                <TableColumn>{this.state.data.length > 0 ? this.state.data[i].owner_channel : 'Loading...'}</TableColumn>
                                <TableColumn>{this.state.data.length > 0 ? this.state.data[i].points : 'Loading...'}</TableColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TablePagination page={this.state.start} rows={this.state.length} onPagination={this.handlePagination.bind(this)} />
                </DataTable>
            </div>
        );
    }
}