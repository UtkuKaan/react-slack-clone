import React, { Component } from "react";
import { Menu, Icon } from "semantic-ui-react";
import { connect } from "react-redux";
import { setCurrentChannel, setPrivateChannel } from "../../actions";
import firebase from "../../firebase";

class Starred extends Component {
  state = {
    user: this.props.currentUser,
    usersRef: firebase.database().ref("users"),
    activeChannel: "",
    starredChannels: []
  };

  componentDidMount() {
    const { user } = this.state;

    if (user) {
      this.addListeners(user.uid);
    }
  }

  componentWillUnmount() {
    this.removeListener();
  }

  removeListener = () => {
    const { usersRef, user } = this.state;

    usersRef.child(`${user.uid}/starred`).off();
  };

  addListeners = userID => {
    this.state.usersRef
      .child(userID)
      .child("starred")
      .on("child_added", snap => {
        const starredChannel = {
          id: snap.key,
          ...snap.val()
        };
        this.setState({
          starredChannels: [...this.state.starredChannels, starredChannel]
        });
      });

    this.state.usersRef
      .child(userID)
      .child("starred")
      .on("child_removed", snap => {
        const channelToRemove = { id: snap.key, ...snap.val() };
        const filteredChannels = this.state.starredChannels.filter(
          channel => channel.id !== channelToRemove.id
        );

        this.setState({ starredChannels: filteredChannels });
      });
  };

  setActiveChannel = channel => {
    this.setState({ activeChannel: channel.id });
  };

  changeChannel = channel => {
    this.setActiveChannel(channel);
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
  };

  displayChannels = starredChannels =>
    starredChannels.length > 0 &&
    starredChannels.map(channel => (
      <Menu.Item
        key={channel.id}
        onClick={() => this.changeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === this.state.activeChannel}
      >
        # {channel.name}
      </Menu.Item>
    ));

  render() {
    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="star" /> STARRED
          </span>{" "}
          ({this.state.starredChannels.length}){" "}
        </Menu.Item>
        {this.displayChannels(this.state.starredChannels)}
      </Menu.Menu>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  setCurrentChannel: channel => dispatch(setCurrentChannel(channel)),
  setPrivateChannel: bool => dispatch(setPrivateChannel(bool))
});

export default connect(
  null,
  mapDispatchToProps
)(Starred);
