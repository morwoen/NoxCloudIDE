import React from 'react';
import { connect } from 'react-redux';
import Editor from './Editor';

export default class Panels extends React.Component {
  render() {
    return (
      <div style={{width: '100%', height: '100%' }}>
        <Editor />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { files } = state;
  return { files };
}

export default connect(mapStateToProps)(Panels);