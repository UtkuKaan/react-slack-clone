import React from "react";
import { connect } from "react-redux";
import { Segment, Comment } from "semantic-ui-react";
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";
import Skeleton from "./Skeleton";
import Typing from "./Typing";
import firebase from "../../firebase";
import { setUserPosts } from "../../actions";

class Messages extends React.Component {
  state = {
    usersRef: firebase.database().ref("users"),
    typingRef: firebase.database().ref("typing"),
    privateMessagesRef: firebase.database().ref("privateMessages"),
    messagesRef: firebase.database().ref("messages"),
    connectedRef: firebase.database().ref(".info/connected"),
    privateChannel: this.props.isPrivateChannel,
    searchTerm: "",
    searchLoading: false,
    searchResults: [],
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
    isChannelStarred: false,
    numUniqueUsers: "",
    typingUsers: [],
    user: this.props.currentUser,
    listeners: []
  };

  componentDidMount() {
    const { channel, user, listeners } = this.state;

    if (channel && user) {
      this.removeListeners(listeners);
      this.addListeners(this.state.channel.id);
      this.addUserStarsListener(this.state.channel.id, this.state.user.uid);
    }
  }

  componentWillUnmount() {
    const { listeners, connectedRef } = this.state;

    this.removeListeners(listeners);
    connectedRef.off();
  }

  removeListeners = listeners => {
    listeners.forEach(listener => {
      listener.ref.child(listener.id).off(listener.event);
    });
  };

  componentDidUpdate() {
    if (this.messagesEnd) {
      this.scrollToBottom();
    }
  }

  addToListeners = (id, ref, event) => {
    const { listeners } = this.state;

    const index = listeners.findIndex(
      listener =>
        listener.id === id && listener.ref === ref && listener.event === event
    );

    if (index === -1) {
      const newListener = { id, ref, event };
      const updatedListeners = listeners.concat(newListener);

      this.setState({ listeners: updatedListeners });
    }
  };

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  };

  addListeners = channelId => {
    this.addMessageListener(channelId);
    this.addTypingListeners(channelId);
  };

  addTypingListeners = channelId => {
    const { typingRef, connectedRef, user } = this.state;
    let typingUsers = [];

    typingRef.child(channelId).on("child_added", snap => {
      if (snap.key !== user.uid) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val()
        });
        this.setState({ typingUsers });
      }
    });

    this.addToListeners(channelId, typingRef, "child_added");

    typingRef.child(channelId).on("child_removed", snap => {
      const index = typingUsers.findIndex(user => user.id === snap.key);
      if (index !== -1) {
        typingUsers = typingUsers.filter(user => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });

    this.addToListeners(channelId, typingRef, "child_removed");

    connectedRef.on("value", snap => {
      if (snap.val() === true) {
        typingRef
          .child(channelId)
          .child(user.uid)
          .onDisconnect()
          .remove(err => {
            if (err) console.log(err);
          });
      }
    });
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
      this.countUserPosts(loadedMessages);
    });

    this.addToListeners(channelId, ref, "child_added");
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

  countUserPosts = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        };
      }

      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
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

  displayTypingUsers = users =>
    users.length > 0 &&
    users.map(user => (
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "0.2em" }}
        key={user.id}
      >
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ));

  displayMessagesSkeleton = loading =>
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;

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

        <Segment>
          <Comment.Group className="messages disable-max-width">
            {this.displayMessagesSkeleton(this.state.messagesLoading)}
            {this.state.searchTerm
              ? this.displayMessages(this.state.searchResults)
              : this.displayMessages(this.state.messages)}
            {this.displayTypingUsers(this.state.typingUsers)}
            <div ref={node => (this.messagesEnd = node)} />
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

const mapDispatchToProps = dispatch => ({
  setUserPosts: userPosts => dispatch(setUserPosts(userPosts))
});

export default connect(
  null,
  mapDispatchToProps
)(Messages);
