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
} from 'react-md';

export default class Leaderboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            start: 0,
            rowsPerPage: 10
        };
    }

    componentWillMount() {
        var that = this;
        functions.get('leaderboard/' + this.props.channel, (data) => {
            console.log(data);
            that.setState({
                "data": data,
                rowsPerPage: data.length < 10 ? data.length : 10
            });
        });
        console.log(this.state);
    }

    handlePagination = (start, rowsPerPage) => {
        this.setState({
            'rowsPerPage': this.state.data.length < rowsPerPage ? this.state.data.length : rowsPerPage,
            'start': start
        });
    }

    render() {
        console.log(this.state);
        return (
            <div className="md-grid">
                <h1 className="md-cell md-cell--12">{this.props.channel}'s leaderboard</h1>
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
                                <TableColumn>{this.state.start + i + 1}</TableColumn>
                                <TableColumn>{this.state.data.length > 0 ? this.state.data[this.state.start + i].owner_channel : 'Loading...'}</TableColumn>
                                <TableColumn>{this.state.data.length > 0 ? this.state.data[this.state.start + i].points : 'Loading...'}</TableColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TablePagination rows={this.state.data.length} onPagination={this.handlePagination.bind(this)} />
                </DataTable>
            </div>
        );
    }
}