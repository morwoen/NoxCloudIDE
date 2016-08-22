/* globals Terminal */
import React from 'react';
import Socket from '../socket';

export default class TerminalComponent extends React.Component {
  term = new Terminal({
    visualBell: true
  });
  
  componentWillMount() {
    this.setState({
      id: Math.random() * 999999999
    });
    
    this.socket = new Socket.connection('term');
  }
  
  resizeListener = () => {
    if (!this.term) {
      return;
    }
    
    const rect = this.element.getBoundingClientRect();
    let height = window.screen.availHeight - rect.top - 3 * 18;
    if (height < 28) {
      height = 28;
    }
    this.element.style.height = `${height}px`;
    
    this.term.fit();
    this.element.firstChild.style.height = this.element.style.height;
    
    const geo = this.term.proposeGeometry();
    if (this.cols !== geo.cols || this.rows !== geo.rows) {
      this.socket.emit('resize', { cols: geo.cols, rows: geo.rows });
      this.cols = geo.cols;
      this.rows = geo.rows;
    }
  }
  
  componentDidMount() {
    this.element = document.getElementById(this.state.id.toString());
    
    this.term.open(this.element);
    
    this.socket.connect();
    
    this.receiveListener = (data) => {
      this.term.write(data);
    };
    this.socket.on('data', this.receiveListener);
    
    this.termReceiveListener = (data) => {
      this.socket.emit('command', data);
    };
    this.term.on('data', this.termReceiveListener);
    
    setTimeout(() => this.resizeListener());
    
    // Subscribe for resize events
    this.resizeSubscription = this.context.resize.observable.subscribe(
      () => this.resizeListener(),
      (err) => console.error(err)
    );
  }
  
  componentWillUnmount() {
    if (typeof this.resizeSubscription !== "undefined") {
      this.resizeSubscription.dispose();
    }
    this.socket.socket.removeListener('data', this.receiveListener);
    this.term.off('data', this.termReceiveListener);
    this.socket.socket.disconnect();
  }
  
  render() {
    return (
      <div style={{ minHeight: 18, backgroundColor: '#111' }} id={this.state.id}></div>
    );
  }
}

TerminalComponent.contextTypes = {
  resize: React.PropTypes.object.isRequired
};