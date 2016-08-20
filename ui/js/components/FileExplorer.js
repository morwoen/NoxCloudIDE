import React from 'react';
import { connect } from 'react-redux';
import File from './File';

export default class FileExplorer extends React.Component {
  render() {
    return (
      <div className='bg-1' style={{ height: '100%', padding: 10, whiteSpace: 'nowrap' }}>
        {this.props.files.root ?
          <File file={this.props.files.root} path="" dispatch={(val) => this.props.dispatch(val)} />
          :
          <i style={{ color: 'white' }} className='fa fa-spinner fa-spin fa-3x fa-fw'/>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { files } = state;
  return { files };
}

export default connect(mapStateToProps)(FileExplorer);