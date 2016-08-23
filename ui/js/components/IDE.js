import React from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import View from './View';
import FileExplorer from './FileExplorer';

export default class IDE extends React.Component {
  render() {
    return (
      <SplitPane split='vertical' minSize={50} maxSize={-50} defaultSize={200} onChange={() => this.context.resize.notify()}>
        <FileExplorer />
        <View viewPath='' view={this.props.view} />
      </SplitPane>
    );
  }
}

IDE.contextTypes = {
  resize: React.PropTypes.object.isRequired
};

export default connect((state) => {
  return { view: state.view };
})(IDE);