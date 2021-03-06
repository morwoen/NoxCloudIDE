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
const DMP = require('diff-match-patch');
const pty = require('pty.js');

const dmp = new DMP();

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
app.use(require('body-parser').json({ limit: '1GB' }));
app.use(express.static('../ui'));

app.get('/file/*', (req, res) => {
  const filePath = path.resolve(path.join(wd, req.url.slice(5)));
  
  res.sendFile(filePath, {}, (err) => {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    } else {
      console.log('Sent:', filePath);
    }
  });

  // try {
  //   var stat = fs.statSync(filePath);
  //   console.log('Fetching:', filePath);
  // } catch(e) {
  //   console.error('Fetching invalid path: ', filePath);
  //   return res.status(403).send('Invalid path');
  // }
  
  // res.writeHead(200, {
  //     'Content-Type': 'text/plain',
  //     'Content-Length': stat.size
  // });

  // fs.createReadStream(filePath).pipe(res);
});

app.post('/file/*', (req, res) => {
  const filePath = path.resolve(path.join(wd, req.url.slice(5)));
  
  const patches = dmp.patch_fromText(req.body.patches);
  fs.readFile(filePath, (err, file) => {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    const appliedDiff = dmp.patch_apply(patches, file);
    fs.writeFile(filePath, appliedDiff[0], () => {
      console.log('Saved:', filePath);
      const hasFails = _.some(_.castArray(appliedDiff[1]), (val) => !val);
      res.status(hasFails ? 206 : 200).send();
    });
  });
});

var server = http.createServer(app);
var iofs = socketio(server, { path: "/fs" });
var ioterm = socketio(server, { path: "/term" });
iofs.on('connection', (socket) => {
  let watcher = {
    filename: rootFolderName,
    path: wd,
    isDirectory: true,
    watcher: watch(wd, (event, filename) => {
      // TODO figure out what event it was and send that as well
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
    fs.readdir(dirPath, (err, files) => {
      if (err) return respond();
      return Promise.all(_.map(files, (file) => {
        return new Promise((resolve, reject) => {
          fs.stat(path.join(dirPath, file), (err, fileStat) => {
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
  
  socket.on('disconnect', () => {
    watcher.watcher.close();
  });
});

ioterm.on('connection', (socket) => {
  const term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: wd,
    env: process.env
  });
  
  console.log(`Created terminal with PID: ${term.pid}`);
  
  socket.on('resize', (data) => {
    var cols = parseInt(data.cols, 10);
    var rows = parseInt(data.rows, 10);
    
    if (!cols || !rows) {
      console.error(`Failed to resize terminal ${term.pid} ${cols}:${rows}.`);
      return;
    }
    
    term.resize(cols, rows);
    // console.log(`Resized terminal ${pid} to ${cols}:${rows}.`);
  });
  
  term.on('data', (data) => {
    socket.emit('data', data);
  });
  
  socket.on('command', (msg) => {
    term.write(msg);
  });
  
  socket.on('disconnect', () => {
    process.kill(term.pid);
    console.log(`Closed terminal ${term.pid}`);
  });
});

server.listen(port);