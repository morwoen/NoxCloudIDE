import React from 'react';
import { connect } from 'react-redux';
import Socket from '../socket';

export default class File extends React.Component {
  render() {
    let contents = (this.props.file.contents || []).map((f) => {
      return (<File key={f.filename} file={f} path={`${this.props.path}/${f.filename}`} dispatch={this.props.dispatch} />);
    });
    
    return (
      <div>
        <div style={{ color: 'white', cursor: 'pointer' }} onTouchTap={() => {
          if (this.props.file.isDirectory) {
            if (this.props.file.contents) {
              this.props.dispatch({
                type: 'close',
                folder: this.props.path
              });
            } else {
              Socket.emit('dir', this.props.path, (dir) => {
                this.props.dispatch({
                  type: 'dir',
                  folder: this.props.path,
                  contents: dir
                });
              });  
            }
          } else {
            // TODO: Implement file opening
          }
        }}>
          {this.props.file.isDirectory ? 
            <i style={{ paddingRight: 5, fontSize: '0.9em' }} className={this.props.file.contents ? 'fa fa-angle-down fa-fw' : 'fa fa-angle-right fa-fw'} />  
          : <i style={{ paddingLeft: 23 }} />}
          <i style={{ fontSize: '0.9em' }} className={this.props.file.isDirectory ? 'fa fa-folder' : 'fa fa-code' } />
          <span style={{ paddingLeft: 5 }}>{this.props.file.filename}</span>
        </div>
        <div style={{ marginLeft: 20 }}>
          {contents}
        </div>
      </div>
    );
  }
}

//export default connect()(File);