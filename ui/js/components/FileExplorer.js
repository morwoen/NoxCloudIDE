import React from 'react';
import { connect } from 'react-redux';
import File from './File';

export default class FileExplorer extends React.Component {
  render() {
    return (
      <div className='bg-1' style={{ height: '100%', padding: 10, whiteSpace: 'nowrap' }}>
        {this.props.fileExplorer.root ?
          <File file={this.props.fileExplorer.root} path="" dispatch={(val) => this.props.dispatch(val)} />
          :
          <i style={{ color: 'white', width: '100%', margin: 'auto' }} className='fa fa-refresh fa-spin fa-3x fa-fw'/>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { fileExplorer } = state;
  return { fileExplorer };
}

export default connect(mapStateToProps)(FileExplorer);