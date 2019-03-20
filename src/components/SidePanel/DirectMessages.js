import React, { Component } from "react";
import { Menu, Icon } from "semantic-ui-react";

class DirectMessages extends Component {
  state = {
    users: []
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
        {/* Users to Send Direct Messages */}
      </Menu.Menu>
    );
  }
}

export default DirectMessages;
