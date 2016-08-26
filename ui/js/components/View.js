import React from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import Tabs from './Tabs';

export default class View extends React.Component {
  componentWillMount() {
    this.setState({
      minPaneSize: 100,
      defaultSize: this.props.view && this.props.view.get('size') || '50%'
    });
  }
  
  componentWillReceiveProps(newProps) {
    this.setState({
      defaultSize: this.props.view && this.props.view.get('size') || this.state.defaultSize || '50%'
    });
  }
  
  render() {
    if (!this.props.view) {
      return <div style={{ width: '100%', height: '100%' }} />;
    }
    
    if (this.props.view.get('type') === 'tabs') {
      return (
        <Tabs view={this.props.view} viewPath={this.props.viewPath} />
      );
    } else if (this.props.view.get('type')) {
      const viewPath = this.props.viewPath ? `${this.props.viewPath}.` : '';
      
      return (
        <SplitPane
          style={{ width: '100%', height: '100%' }}
          split={this.props.view.get('type')}
          minSize={this.state.minPaneSize}
          maxSize={-this.state.minPaneSize}
          defaultSize={this.state.defaultSize}
          onChange={(size) => {
            this.props.dispatch({
              type: 'viewSize',
              path: this.props.viewPath,
              size
            });
            this.context.resize.notify();
          }}
        >
          <View view={this.props.view.get('0')} viewPath={`${viewPath}0`} />
          <View view={this.props.view.get('1')} viewPath={`${viewPath}1`} />
        </SplitPane>
      );
    } else {
      return <div style={{ width: '100%', height: '100%' }} />;
    }
  }
}

View.contextTypes = {
  resize: React.PropTypes.object.isRequired
};

export default connect()(View);