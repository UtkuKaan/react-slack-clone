import React, { Component } from "react";
import { connect } from "react-redux";
import { Menu, Icon } from "semantic-ui-react";
import { setCurrentChannel, setPrivateChannel } from "../../actions";
import firebase from "../../firebase";

class DirectMessages extends Component {
  state = {
    activeChannel: "",
    user: this.props.currentUser,
    users: [],
    usersRef: firebase.database().ref("users"),
    connectedRef: firebase.database().ref(".info/connected"),
    presenceRef: firebase.database().ref("presence")
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid);
    }
  }

  addListeners = currentUserUID => {
    let loadedUsers = [];
    this.state.usersRef.on("child_added", snap => {
      if (currentUserUID !== snap.key) {
        let user = snap.val();
        user["uid"] = snap.key;
        user["status"] = "offline";
        loadedUsers.push(user);
        this.setState({ users: loadedUsers });
      }
    });

    this.state.connectedRef.on("value", snap => {
      if (snap.val() === true) {
        const ref = this.state.presenceRef.child(currentUserUID);
        ref.set(true);
        ref.onDisconnect().remove(err => {
          if (err !== null) {
            console.error(err);
          }
        });
      }
    });

    this.state.presenceRef.on("child_added", snap => {
      if (currentUserUID !== snap.key) {
        this.addStatusToUser(snap.key);
      }
    });

    this.state.presenceRef.on("child_removed", snap => {
      if (currentUserUID !== snap.key) {
        this.addStatusToUser(snap.key, false);
      }
    });
  };

  addStatusToUser = (userID, connected = true) => {
    const updatedUsers = this.state.users.reduce((acc, user) => {
      if (user.uid === userID) {
        user["status"] = `${connected ? "online" : "offline"}`;
      }
      return acc.concat(user);
    }, []);
    this.setState({ users: updatedUsers });
  };

  isUserOnline = user => user.status === "online";

  changeChannel = user => {
    const channelID = this.getChannelID(user.uid);
    const channelData = {
      id: channelID,
      name: user.name
    };

    this.props.setCurrentChannel(channelData);
    this.props.setPrivateChannel(true);
    this.setActiveChannel(user.uid);
  };

  getChannelID = userID => {
    const currentUserID = this.state.user.uid;
    return userID < currentUserID
      ? `${userID}/${currentUserID}`
      : `${currentUserID}/${userID}`;
  };

  setActiveChannel = userID => {
    this.setState({ activeChannel: userID });
  };

  render() {
    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="mail" /> DIRECT MESSAGES
          </span>{" "}
          ({this.state.users.length})
        </Menu.Item>
        {this.state.users.map(user => (
          <Menu.Item
            key={user.uid}
            active={this.state.activeChannel === user.uid}
            onClick={() => this.changeChannel(user)}
            style={{ opacity: 0.7, fontStyle: "italic" }}
          >
            <Icon
              name="circle"
              color={this.isUserOnline(user) ? "green" : "red"}
            />
            @ {user.name}
          </Menu.Item>
        ))}
      </Menu.Menu>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  setCurrentChannel: channelData => dispatch(setCurrentChannel(channelData)),
  setPrivateChannel: isPrivate => dispatch(setPrivateChannel(isPrivate))
});

export default connect(
  null,
  mapDispatchToProps
)(DirectMessages);
