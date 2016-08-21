/* global monaco */
import React from 'react';
import { connect } from 'react-redux';
import DMP from 'diff-match-patch';
import _ from 'lodash';
import utils from '../utils';

export default class FileExplorer extends React.Component {
  dmp = new DMP();
  
  componentWillMount() {
    this.setState({
      id: Math.random() * 999999999
    });
  }
  
  componentDidMount() {
    this.initMonaco();
  }
  
  componentWillUnmount() {
    this.destroyMonaco();
  }
  
  componentWillReceiveProps(newProps) {
    if (this.props.path !== newProps.path) {
      this.loading = true;
      if (!newProps.fileStore[this.props.path] && (!this.editor || this.editor.getValue()) || newProps.fileStore[this.props.path] && !_.isEmpty(newProps.fileStore[this.props.path].diffs)) {
        alert('not empty file, do you want to save (not implemented lol)');
      }
    }
    if (this.loading && newProps.fileStore[newProps.path]) {
      this.loading = false;
      if (this.editor) {
        this.changedFile = true;
        this.editor.setValue(newProps.fileStore[newProps.path].original);
      } else {
        console.error('no editor loaded on change');
      }
    }
  }
  
  initMonaco() {
    let monacoPromise = Promise.resolve();
    if (typeof monaco === "undefined") {
        monacoPromise = new Promise((resolve, reject) => {
          window.require(['vs/editor/editor.main'], () => resolve());
        });
    }
    
    monacoPromise.then(() => {
      if (typeof monaco !== "undefined") {
        if (!this.editor) {
          this.editor = monaco.editor.create(document.getElementById(this.state.id.toString()), {
            value: this.props.fileStore[this.props.path] ? this.props.fileStore[this.props.path].original : "",
            language: 'javascript',
            theme: 'vs-dark',
            wrappingIndent: 'same'
          });
        } else {
          this.editor.setValue(this.props.fileStore[this.props.path].original);
        }
        
        // Subscribe for resize events
        this.resizeSubscription = this.context.resize.observable.subscribe(
          () => this.editor.layout(),
          (err) => console.error(err)
        );
        
        // when there is a change save the value
        this.editor.onDidChangeModelContent((e)=> {
          if (this.changedFile) {
            this.changedFile = false;
            return;
          }
          
          const storedFile = this.props.fileStore[this.props.path];
          if (!storedFile) {
            return;
          }
          
          const diffs = this.dmp.diff_main(storedFile.original, this.editor.getValue());
          this.dmp.diff_cleanupEfficiency(diffs);
          this.props.dispatch({
            type: 'editFile',
            path: this.props.path,
            diffs
          });
        });
        
        // keybindings
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, (res) => {
          var currentEditorContent = this.editor.getValue();
          utils.saveFile(this.props.path, this.props.fileStore[this.props.path].diffs)
          .then((res) => {
            if (res.status === 200) {
              this.props.dispatch({
                type: 'updateFile',
                path: this.props.path,
                file: currentEditorContent
              });
              console.log('Saved');
            } else {
              throw new Error();
            }
          })
          .catch(() => {
            alert('Saving failed. Copy the text from the editor, refresh, paste and try saving again');
          });
        });
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P, () => {
          alert('Quick search not yet implemented!');
        });
      }
    });
  }
  
  destroyMonaco() {
    if (typeof this.resizeSubscription !== "undefined") {
      this.resizeSubscription.dispose();
    }
    
    if (typeof this.editor !== "undefined") {
      this.editor.destroy();
    }
  }

  render() {
    return (
      <div style={{ width: '100%', height: '100%' }} id={this.state.id}>
      </div>
    );
  }
}

FileExplorer.contextTypes = {
  resize: React.PropTypes.object.isRequired
};

function mapStateToProps(state) {
  const { fileStore } = state;
  return { fileStore };
}

export default connect(mapStateToProps)(FileExplorer);