import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import decode from 'jwt-decode';

import Channels from '../components/Channels';
import Teams from '../components/Teams';
import AddChannelModal from '../components/UI/AddChannelModal';
import InvitePeopleModal from '../components/UI/InvitePeopleModal';
import { GET_ALL_TEAMS } from '../graphql/team';


const CREATE_CHANNEL_MUTATION = gql`
  mutation createChannel($teamId: Int!, $name: String!) {
  createChannel(teamId:$teamId, name:$name) {
    ok
    channel {
      id
      name
    }
  }
}
`;

const ADD_TEAM_MEMBER_MUTATION = gql`
mutation($email: String!, $teamId: Int!) {
  addTeamMember(email: $email, teamId: $teamId) {
    ok
    errors {
      path
      message
    }
  }
}
`;


export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openAddChannelModal: false,
      openInvitePeopleModal: false,
    };
  }

  handleAddChanelClick = () => {
    this.setState({ openAddChannelModal: !this.state.openAddChannelModal });
  }

  handleInvitePeopleClick = () => {
    this.setState({ openInvitePeopleModal: !this.state.openInvitePeopleModal });
  }


  render() {
    const { teams, team, teamIdx } = this.props;
    const { openAddChannelModal, openInvitePeopleModal } = this.state;

    let username = '';
    try {
      const token = localStorage.getItem('token');
      const { user } = decode(token);
      username = user.username;
    } catch (err) { }

    return (
      <React.Fragment>
        <Teams teams={teams} />
        <Channels
          onAddChannelClick={this.handleAddChanelClick}
          teamName={team.name}
          username={username}
          teamId={team.id}
          onInvitePeopleClick={this.handleInvitePeopleClick}
          channels={team.channels}
          users={[{ id: 1, name: 'slackbot' }, { id: 2, name: 'user1' }]}
        />
        <Mutation
          mutation={CREATE_CHANNEL_MUTATION}
          update={(cache, { data: { createChannel } }) => {
            const { ok, channel } = createChannel;
            if (!ok) {
              return;
            }
            const response = cache.readQuery({ query: GET_ALL_TEAMS });
            const channelToUpdate = response.allTeams[teamIdx].channels;

            cache.writeQuery({
              query: GET_ALL_TEAMS,
              data: channelToUpdate.push(channel),
            });
          }}
        >
          {createChannel => (
            <AddChannelModal
              createChannel={createChannel}
              teamId={team.id}
              onClose={this.handleAddChanelClick}
              open={openAddChannelModal}
              key="sidebar-add-channel-modal"
            />
          )}
        </Mutation>
        <Mutation mutation={ADD_TEAM_MEMBER_MUTATION}>
          {addTeamMember => (
            <InvitePeopleModal
              addTeamMember={addTeamMember}
              teamId={team.id}
              onClose={this.handleInvitePeopleClick}
              open={openInvitePeopleModal}
              key="invite-people-modal"
            />
          )}
        </Mutation>
      </React.Fragment>
    );
  }
}
