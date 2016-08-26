import React from 'react';
import { connect } from 'react-redux';
import Socket from '../socket';
import utils from '../utils';

let ConnectedFile;

class File extends React.Component {
  render() {
    const rawContents = this.props.file.get('contents');
    let contents = (rawContents && rawContents.toArray() || []).map((f) => {
      return (<ConnectedFile key={f.get('filename')} file={f} path={`${this.props.path}/${f.get('filename')}`} dispatch={this.props.dispatch} />);
    });
    
    // TODO: get it from lastTouched
    const color = this.props.path === (this.props.openedFiles && this.props.openedFiles[1]) ? '#0CBA46' : 'white';
    
    return (
      <div>
        <div style={{ color: color, cursor: 'pointer' }} onTouchTap={() => {
          if (this.props.file.get('isDirectory')) {
            if (contents.length) {
              this.props.dispatch({
                type: 'closeDir',
                folder: this.props.path
              });
            } else {
              Socket.fs.emit('dir', this.props.path, (dir) => {
                this.props.dispatch({
                  type: 'dir',
                  folder: this.props.path,
                  contents: dir
                });
              });  
            }
          } else {
            // Open file
            this.props.dispatch((dispatch, getState) => {
              const fileStore = getState().fileStore;
              
              dispatch({
                type: 'open',
                view: {
                  type: 'editor',
                  path: this.props.path
                }
              });
              
              if (fileStore.get(this.props.path)) {
                // TODO implement refetch & merge / ask for replace if changed
                
              } else {
                utils.fetchFile(this.props.path)
                .then((file) => {
                  dispatch({
                    type: 'loadFile',
                    path: this.props.path,
                    file
                  });
                });
              }
            });
          }
        }}>
          {this.props.file.get('isDirectory') ? 
            <i style={{ paddingRight: 5, fontSize: '0.9em' }} className={!contents.length ? 'fa fa-angle-down fa-fw' : 'fa fa-angle-right fa-fw'} />  
          : <i style={{ paddingLeft: 23 }} />}
          <i style={{ fontSize: '0.9em' }} className={this.props.file.get('isDirectory') ? 'fa fa-folder' : 'fa fa-code' } />
          <span style={{ paddingLeft: 5 }}>{this.props.file.get('filename')}</span>
        </div>
        <div style={{ marginLeft: 20 }}>
          {contents}
        </div>
      </div>
    );
  }
}

ConnectedFile = connect((state) => {
  return {
    openedFiles: state.openedFiles
  };
})(File);

export default ConnectedFile;