/* global monaco */
import React from 'react';
import { connect } from 'react-redux';

export default class FileExplorer extends React.Component {
  
  componentWillMount() {
    this.setState({
      id: Math.random() * 999999999,
      current_scenario_script: "asd",
      page_edited: false
    });
  }
  
  componentDidMount() {
    this.initMonaco();
  }
  
  componentWillUnmount() {
    this.destroyMonaco();
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
        this.editor = monaco.editor.create(document.getElementById(this.state.id.toString()), {
          value: this.state.current_scenario_script,
          language: 'javascript',
          theme: 'vs-dark',
          wrappingIndent: 'same'
        });
        
        // Subscribe for resize events
        this.resizeSubscription = this.context.resize.observable.subscribe(
          () => this.editor.layout(),
          (err) => console.error(err)
        );
        
        // when there is a change save the value
        this.editor.onDidChangeModelContent((e)=> {
          console.log(this.editor.getValue());
          if (!e.target) {
            console.log('shit', e);
            return;
          }
          this.setState({ page_edited: true, current_scenario_script: this.editor.getValue() });
        });
        
        // keybindings
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
          console.log(this.editor.getMode());
            alert('SAVE pressed!');
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
  const { files } = state;
  return { files };
}

export default connect(mapStateToProps)(FileExplorer);