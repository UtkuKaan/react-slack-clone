import React from "react";
import { Segment, Accordion, Header, Icon, Image } from "semantic-ui-react";

class MetaPanel extends React.Component {
  state = {
    channel: this.props.currentChannel,
    privateChannel: this.props.isPrivateChannel,
    activeIndex: 0
  };

  setActiveIndex = (event, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    this.setState({ activeIndex: newIndex });
  };

  render() {
    if (this.state.privateChannel) return null;

    return (
      <Segment loading={!this.state.channel}>
        <Header as="h3" attached="top">
          About # {this.state.channel && this.state.channel.name}
        </Header>
        <Accordion styled attached="true">
          <Accordion.Title
            active={this.state.activeIndex === 0}
            index={0}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="info" />
            Channel Details
          </Accordion.Title>
          <Accordion.Content active={this.state.activeIndex === 0}>
            {this.state.channel && this.state.channel.details}
          </Accordion.Content>

          <Accordion.Title
            active={this.state.activeIndex === 1}
            index={1}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="user circle" />
            Top Posters
          </Accordion.Title>
          <Accordion.Content active={this.state.activeIndex === 1}>
            posters
          </Accordion.Content>

          <Accordion.Title
            active={this.state.activeIndex === 2}
            index={2}
            onClick={this.setActiveIndex}
          >
            <Icon name="dropdown" />
            <Icon name="pencil alternate" />
            Created By
          </Accordion.Title>
          <Accordion.Content active={this.state.activeIndex === 2}>
            <Header as="h3">
              <Image
                circular
                src={this.state.channel && this.state.channel.createdBy.avatar}
              />
              {this.state.channel && this.state.channel.createdBy.name}
            </Header>
          </Accordion.Content>
        </Accordion>
      </Segment>
    );
  }
}

export default MetaPanel;
