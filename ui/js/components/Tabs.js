import React from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Terminal from './Terminal';
import Editor from './Editor';
import _ from 'lodash';

export default class TabsView extends React.Component {
  componentWillMount() {
    this.setState({
      selected: this.props.view.selected || 0
    });
    
    if (this.props.view.type !== 'tabs') {
      console.error('Invalid view loaded into tabs component', this.props.view);
    }
  }
  
  render() {
    return (
      <Tabs
        onSelect={(index) => {
          this.setState({ selected: index });
          this.props.dispatch({
            type: 'selectTab',
            path: this.props.viewPath,
            selected: index
          });
        }}
        selectedIndex={this.state.selected}
      >
        <TabList>
          {this.props.view.tabs.map((tab, index) => {
            let title = 'Untitled';
            if (tab.type === 'terminal') {
              title = 'Terminal';
            } else if (tab.type === 'editor') {
              if (tab.path) {
                title = _.last(tab.path.split('/'));
              } 
            } else {
              console.error('Unknown tab type', tab);
            }
            
            return (
              <Tab key={index}>
                {title} <i className='fa fa-close fa-fw' />
              </Tab>
            );
          })}
        </TabList>

        {this.props.view.tabs.map((tab, index) => {
          let element = 'Ops, Something went wrong';
          if (tab.type === 'terminal') {
            element = <Terminal view={tab} viewPath={`${this.props.viewPath}.${index}`} />;
          } else if (tab.type === 'editor') {
            element = <Editor path={tab.path} view={tab} viewPath={`${this.props.viewPath}.${index}`} />;
          } else {
            console.error('Unknown tab type', tab);
          }
          
          return (
            <TabPanel key={index}>
              {element}
            </TabPanel>
          );
        })}
      </Tabs>
    );
  }
}

TabsView.contextTypes = {
  resize: React.PropTypes.object.isRequired
};

export default connect()(TabsView);