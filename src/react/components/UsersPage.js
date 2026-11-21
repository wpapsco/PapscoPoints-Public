import React from "react";
import ReactDOM from "react-dom";
import {
    DataTable,
    TableHeader,
    TableBody,
    TableRow,
    TableColumn,
    TextField,
    Button,
    SelectionControl
} from 'react-md';
import functions from '../DataFormFunctions'

export default class UsersPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentWillMount() {
        var that = this;
        functions.get('users', function (users) {
            console.log(users);
            that.setState({ users, loading: false });
        });
    }

    viewLeaderboard(user) {
        console.log(user);
        this.props.history.push('/leaderboards/' + user);
    }
    
    viewRewards(user) {
        this.props.history.push('/rewards/' + user);
    }

    render() {
        let { loading, users } = this.state;
        if (!loading) {
            return (
                <DataTable plain>
                    <TableHeader>
                        <TableRow>
                            <TableColumn>Channel</TableColumn>
                            <TableColumn>View Leaderboard</TableColumn>
                            <TableColumn>View Rewards</TableColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...new Array(users.length)].map((user, i) => (
                            <TableRow key={i}>
                                <TableColumn>{users[i]}</TableColumn>
                                <TableColumn>
                                    <Button raised primary onClick={this.viewLeaderboard.bind(this, users[i])}>View Leaderboard</Button>
                                </TableColumn>
                                <TableColumn>
                                    <Button raised secondary onClick={this.viewRewards.bind(this, users[i])}>View Rewards</Button>
                                </TableColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                </DataTable>
            );
        } else {
            return (<div />);
        }
    }
}