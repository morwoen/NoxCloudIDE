import Socket from './socket';
import _ from 'lodash';

const utils = {
  restoreFileExplorer: function(dispatch) {
    const previousState = JSON.parse(window.localStorage.getItem('openPath'));
    
    const fetchDirectoryAndCheckForMore = (dirPath) => {
      Socket.emit('dir', dirPath, function(dir) {
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
    
    Socket.emit('root', function(root) {
      dispatch({
        type: 'root',
        root: root
      });
      
      fetchDirectoryAndCheckForMore('');
    });
    
    Socket.on('change', (data) => {
      const folder = data.split('/').pop().join('/');
      Socket.emit('dir', folder, function(dir) {
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
  }
};

export default utils;