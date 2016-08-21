import io from 'socket.io-client';
import _ from 'lodash';

class Socket {
  socketName = 'socket';
  query = '';
  socket = undefined;
  onCache = [];
  emitCache = [];
  
  constructor(name, query) {
    this.socketName = name;
    this.query = query || '';
  }
  
  connect() {
    if (!this.socket) {
      this.socket = io({ path: `/${this.socketName}`, query: this.query }).connect();
      this.onCache.forEach((item) => {
        this.on(item.evt, item.callback);
      });
      this.emitCache.forEach((item) => {
        this.emit(item.evt, item.data, item.callback);
      });
    }
  }
  
  on(eventName, callback, ignoreError) {
    if (this.socket) {
      this.socket.on(eventName, function (message) {
        let isJson = false;
        // try {
        //   if (typeof message === "object") {
        //     isJson = true;
        //   } else {
        //     message = JSON.parse(message);
        //     isJson = true;
        //   }
        // } catch(e) {
        //   if (!ignoreError) {
        //     console.error("Failed to parse JSON from socket message");
        //   }
        // }
        callback(message, isJson);
      });
    } else {
      this.onCache.push({
        evt: eventName,
        callback
      });
    }
  }
  
  emit(eventName, data, callback) {
    if (_.isFunction(data)) {
      callback = data;
      data = '';
    }
    if(this.socket) {
      this.socket.emit(eventName, data, function () {
        callback.apply(this, arguments);
      });
    } else {
      this.emitCache.push({
        evt: eventName,
        data,
        callback
      });
    }
  }
}

const sockets = {
  connection: Socket,
  fs: new Socket('fs')
};

export default sockets;