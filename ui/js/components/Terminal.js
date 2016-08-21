/* globals Terminal */
import React from 'react';
import Socket from '../socket';
import ajax from 'client-ajax';
import _ from 'lodash';

export default class TerminalComponent extends React.Component {
  term = new Terminal({
    visualBell: true
  });
  
  componentWillMount() {
    this.setState({
      id: Math.random() * 999999999
    });
  }
  
  ajaxResize =  _.debounce((cols, rows) => {
    ajax({
      url: `/terminals/${this.pid}/size?cols=${cols}&rows=${rows}`,
      method: 'post',
      body: true,
      type: 'text'
    })
    .catch(console.error.bind(console));
  });
  
  resizeListener = () => {
    if (!this.term || !this.pid) {
      return;
    }
    
    const rect = this.element.getBoundingClientRect();
    this.element.style.height = (window.screen.availHeight - rect.top - 3 * 18) + 'px';
    
    this.term.fit();
    this.element.firstChild.style.height = this.element.style.height;
    const geo = this.term.proposeGeometry();
    this.ajaxResize(geo.cols + 1, geo.rows);
  }
  
  componentDidMount() {
    this.element = document.getElementById(this.state.id.toString());
    
    this.term.on('resize', this.resizeListener);
    this.term.open(this.element);
    this.term.fit();
    
    const proposedSize = this.term.proposeGeometry();
    ajax({
      url: `/terminals?cols=${proposedSize.cols}&rows=${proposedSize.rows}`,
      method: 'post',
      body: true,
      type: 'text'
    })
    .then((res) => {
      this.pid = res;
      this.socket = new Socket.connection('term', `pid=${this.pid}`);
      this.socket.connect();
      
      this.receiveListener = (data) => {
        this.term.write(data);
      };
      this.socket.on('data', this.receiveListener);
      
      this.termReceiveListener = (data) => {
        this.socket.emit('command', data);
      };
      this.term.on('data', this.termReceiveListener);
    })
    .catch(console.error.bind(console));
    
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
    this.term.off('resize', this.resizeListener);
    this.ajaxResize.cancel();
    this.term.off('data', this.termReceiveListener);
    this.socket.socket.disconnect();
  }
  
  render() {
    return (
      <div style={{ height: '100%', overflow: 'hidden', backgroundColor: '#111' }} id={this.state.id}></div>
    );
  }
}

TerminalComponent.contextTypes = {
  resize: React.PropTypes.object.isRequired
};