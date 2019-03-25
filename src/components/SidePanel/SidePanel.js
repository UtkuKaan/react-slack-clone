import React from "react";
import { Menu } from "semantic-ui-react";
import UserPanel from "./UserPanel";
import Starred from "./Starred";
import Channels from "./Channels";
import DirectMessages from "./DirectMessages";

class SidePanel extends React.Component {
  render() {
    return (
      <Menu
        size="large"
        inverted
        fixed="left"
        vertical
        style={{ background: "#4c3c4c", fontSize: "1.2rem" }}
      >
        <UserPanel currentUser={this.props.currentUser} />
        <Starred currentUser={this.props.currentUser} />
        <Channels currentUser={this.props.currentUser} />
        <DirectMessages currentUser={this.props.currentUser} />
      </Menu>
    );
  }
}

export default SidePanel;
