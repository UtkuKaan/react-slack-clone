import React from "react";
import { Segment, Comment } from "semantic-ui-react";
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";
import firebase from "../../firebase";

class Messages extends React.Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref("privateMessages"),
    searchTerm: "",
    searchLoading: false,
    searchResults: [],
    messagesRef: firebase.database().ref("messages"),
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
    isChannelStarred: false,
    numUniqueUsers: "",
    usersRef: firebase.database().ref("users"),
    user: this.props.currentUser
  };

  componentDidMount() {
    if (this.state.channel && this.state.user) {
      this.addListeners(this.state.channel.id);
      this.addUserStarsListener(this.state.channel.id, this.state.user.uid);
    }
  }

  addListeners = channelId => {
    this.addMessageListener(channelId);
  };

  addUserStarsListener = (channelID, userID) => {
    this.state.usersRef
      .child(userID)
      .child("starred")
      .once("value")
      .then(data => {
        if (data.val() !== null) {
          const channelIDs = Object.keys(data.val());
          const prevStarred = channelIDs.includes(channelID);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();

    ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
    });
  };

  getMessagesRef = () => {
    return this.state.privateChannel
      ? this.state.privateMessagesRef
      : this.state.messagesRef;
  };

  handleStar = () => {
    this.setState(
      prevState => ({
        isChannelStarred: !prevState.isChannelStarred
      }),
      () => this.starChannel()
    );
  };

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          details: this.state.channel.details,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar
          }
        }
      });
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err) {
            console.error(err);
          }
        });
    }
  };

  handleSearchChange = event => {
    this.setState({ searchTerm: event.target.value, searchLoading: true }, () =>
      this.handleSearchMessages()
    );
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, "gi");

    const searchResults = channelMessages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message);
      }

      return acc;
    }, []);
    this.setState({ searchResults });
    setTimeout(() => this.setState({ searchLoading: false }), 700);
  };

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);

    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
    this.setState({ numUniqueUsers });
  };

  displayMessages = messages =>
    messages.length > 0 &&
    messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ));

  displayChannelName = channel => {
    return channel
      ? `${this.state.privateChannel ? "@" : "#"}${channel.name}`
      : "";
  };

  render() {
    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(this.state.channel)}
          numUniqueUsers={this.state.numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={this.state.searchLoading}
          isPrivateChannel={this.state.privateChannel}
          handleStar={this.handleStar}
          isChannelStarred={this.state.isChannelStarred}
        />

        <Segment className="messages">
          <Comment.Group>
            {this.state.searchTerm
              ? this.displayMessages(this.state.searchResults)
              : this.displayMessages(this.state.messages)}
          </Comment.Group>
        </Segment>

        <MessageForm
          messagesRef={this.state.messagesRef}
          currentChannel={this.state.channel}
          currentUser={this.state.user}
          isPrivateChannel={this.state.privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    );
  }
}

export default Messages;
