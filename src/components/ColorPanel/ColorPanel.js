/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from "react";
import { connect } from "react-redux";
import { setColors } from "../../actions";
import {
  Sidebar,
  Menu,
  Divider,
  Button,
  Modal,
  Icon,
  Label,
  Segment
} from "semantic-ui-react";
import { SliderPicker } from "react-color";
import firebase from "../../firebase";

class ColorPanel extends React.Component {
  state = {
    modal: false,
    primary: "",
    secondary: "",
    user: this.props.currentUser,
    usersRef: firebase.database().ref("users"),
    userColors: []
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

    usersRef.child(`${user.uid}/colors`).off();
  };

  addListeners = userID => {
    const { usersRef } = this.state;
    const userColors = [];

    usersRef.child(`${userID}/colors`).on("child_added", snap => {
      userColors.unshift(snap.val());
      this.setState({ userColors });
    });
  };

  handleChangePrimary = color => this.setState({ primary: color.hex });

  handleChangeSecondary = color => this.setState({ secondary: color.hex });

  handleSaveColors = () => {
    const { primary, secondary } = this.state;

    if (primary && secondary) {
      this.saveColors(primary, secondary);
    }
  };

  saveColors = (primary, secondary) => {
    const { usersRef, user } = this.state;

    usersRef
      .child(`${user.uid}/colors`)
      .push()
      .update({
        primary,
        secondary
      })
      .then(() => {
        this.closeModal();
      })
      .catch(err => console.error(err));
  };

  displayUserColors = colors =>
    colors.length > 0 &&
    colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div
          className="color__container"
          onClick={() => this.props.setColors(color.primary, color.secondary)}
        >
          <div className="color__square" style={{ background: color.primary }}>
            <div
              className="color__overlay"
              style={{ background: color.secondary }}
            />
          </div>
        </div>
      </React.Fragment>
    ));

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  render() {
    const { modal, primary, secondary, userColors } = this.state;

    return (
      <Sidebar
        as={Menu}
        icon="labeled"
        inverted
        vertical
        visible
        width="very thin"
      >
        <Divider />
        <Button icon="add" size="small" color="blue" onClick={this.openModal} />

        {this.displayUserColors(userColors)}

        {/* Color Picker Modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content="Primary Color" className="color__label" />
              <SliderPicker
                color={primary}
                onChange={this.handleChangePrimary}
              />
            </Segment>
            <Segment inverted>
              <Label content="Secondary Color" className="color__label" />
              <SliderPicker
                color={secondary}
                onChange={this.handleChangeSecondary}
              />
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleSaveColors}>
              <Icon name="checkmark" /> Save Colors
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  setColors: (primary, secondary) => dispatch(setColors(primary, secondary))
});

export default connect(
  null,
  mapDispatchToProps
)(ColorPanel);
