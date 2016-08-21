import Socket from './socket';
import _ from 'lodash';
import ajax from 'client-ajax';
import path from 'path';
import DMP from 'diff-match-patch';

const dmp = new DMP();

const utils = {
  restoreFileExplorer: function(dispatch) {
    const previousState = JSON.parse(window.localStorage.getItem('openPath'));
    
    const fetchDirectoryAndCheckForMore = (dirPath) => {
      Socket.fs.emit('dir', dirPath, function(dir) {
        dispatch({
          type: 'dir',
          folder: dirPath,
          contents: dir
        });
        
        dir.forEach((f) => {
          const newDirPath = `${dirPath}/${f.filename}`;
          if (f.isDirectory && _.includes(previousState, newDirPath)) {
            fetchDirectoryAndCheckForMore(newDirPath);
          }
        });
      });
    };
    
    Socket.fs.emit('root', function(root) {
      dispatch({
        type: 'root',
        root: root
      });
      
      fetchDirectoryAndCheckForMore('');
    });
    
    Socket.fs.on('change', (data) => {
      const folder = data.split('/').pop().join('/');
      Socket.fs.emit('dir', folder, function(dir) {
      dispatch({
        type: 'dir',
        folder: folder,
        contents: dir
      });
    });
    });
  },
  
  updateFileExplorerState: function(state) {
    const openPaths = [];
    if (state.root.contents) {
      const checkFileContents = (f, path) => {
        if (f.contents) {
          var openDir = `${path}/${f.filename}`;
          openPaths.push(openDir);
          f.contents.forEach(_.partial(checkFileContents, _, openDir));
        }
      };
      state.root.contents.forEach(_.partial(checkFileContents, _, ''));
    }
    window.localStorage.setItem('openPath', JSON.stringify(openPaths));
  },
  
  setDirectoryContents: function(state, action) {
    const folders = action.folder.split('/');
    folders.shift();
    const newState = Object.assign({}, state);
    
    let current = newState.root;
    folders.some((folder) => {
      if (!folder) {
        return;
      }
      
      const next = _.find(current.contents, (file) => {
        return file.filename === folder && file.isDirectory;
      });
      
      current = next;
      return !current;
    });
    
    if (current) {
      current.contents = action.contents;
    }
    return newState;
  },
  
  fetchFile: function(p) {
    return ajax({
      url: path.join('/file/', p),
      method: 'get',
      body: true,
      type: 'text'
    });
  },
  
  saveFile: function(p, diffs) {
    return ajax({
      url: path.join('/file/', p),
      method: 'post',
      data: { patches: dmp.patch_toText(dmp.patch_make(diffs)) },
      format: 'json',
      origin: true
    });
  }
};

export default utils;