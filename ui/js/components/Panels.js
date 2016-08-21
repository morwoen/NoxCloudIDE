import React from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import Terminal from './Terminal';
import Editor from './Editor';

export default class Panels extends React.Component {
  render() {
    return (
      <SplitPane style={{ width: '100%', height: '100%' }} split='horizontal' minSize={150} defaultSize={'80%'} onChange={this.context.resize.notify}>
        <Editor path={this.props.openedFiles[1]} />
        <Terminal />
      </SplitPane>
    );
  }
}

Panels.contextTypes = {
  resize: React.PropTypes.object.isRequired
};

function mapStateToProps(state) {
  const { openedFiles } = state;
  return { openedFiles };
}

export default connect(mapStateToProps)(Panels);