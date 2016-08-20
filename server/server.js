'use strict';
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');
const watch = require('node-watch');
const flags = require('flags');
const clk = require('chalk');
const _ = require('lodash');

// Make logs colourful!
const consoleLog = console.log;
const consoleInfo = console.info;
const consoleError = console.error;
const consoleWarn = console.warn;
console.log = function() { consoleLog.apply(console, _.map(arguments, (val) => clk.blue(val))); };
console.info = function() { consoleInfo.apply(console, _.map(arguments, (val) => clk.green(val))); };
console.error = function() { consoleError.apply(console, _.map(arguments, (val) => clk.red(val))); };
console.warn = function() { consoleWarn.apply(console, _.map(arguments, (val) => clk.yellow(val))); };

// Define and parse flags
flags.defineString('workspace', process.cwd(), 'Working directory');
flags.defineInteger('port', 8080, 'Port');
flags.parse();

const wd = path.resolve(process.cwd(), flags.get('workspace'));
const port = flags.get('port');
console.info(`NoxCloud IDE starting`);
console.info(`Port ${port} Workspace ${wd}`);

let rootFolderName = path.basename(wd);

var app = require('express')();
app.use(express.static('../ui'));
var server = http.createServer(app);
var io = socketio(server, { path: "/socket" });

io.on('connection', function(socket){
  let watcher = {
    filename: rootFolderName,
    path: wd,
    isDirectory: true,
    watcher: watch(wd, (event, filename) => {
      socket.emit('change', event);
      console.log(event, filename);
    })
  };
  
  socket.on('root', (data, respond) => {
    respond({
      filename: rootFolderName,
      isDirectory: true
    });
  });
  
  socket.on('dir', (data, respond) => {
    const dirPath = path.join(wd, data);
    console.log('Listing:', dirPath);
    fs.readdir(dirPath, function(err, files) {
      if (err) return respond();
      return Promise.all(_.map(files, (file) => {
        return new Promise((resolve, reject) => {
          fs.stat(path.join(dirPath, file), function(err, fileStat) {
            if (err) return reject(err);
            resolve({
              filename: file,
              isDirectory: fileStat.isDirectory()
            });
          });
        });
      }))
      .then(respond)
      .catch(console.error);
    });
  });
  
  socket.on('disconnect', function() {
    watcher.watcher.close();
  });
});
server.listen(port);