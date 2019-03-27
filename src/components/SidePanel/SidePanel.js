import React from "react";
import { Menu } from "semantic-ui-react";
import UserPanel from "./UserPanel";
import Starred from "./Starred";
import Channels from "./Channels";
import DirectMessages from "./DirectMessages";

class SidePanel extends React.Component {
  render() {
    const { currentUser, primaryColor } = this.props;

    return (
      <Menu
        size="large"
        inverted
        fixed="left"
        vertical
        style={{ background: primaryColor, fontSize: "1.2rem" }}
      >
        <UserPanel primaryColor={primaryColor} currentUser={currentUser} />
        <Starred currentUser={currentUser} />
        <Channels currentUser={currentUser} />
        <DirectMessages currentUser={currentUser} />
      </Menu>
    );
  }
}

export default SidePanel;
