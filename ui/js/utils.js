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
  
  // FILE MANIPULATION HELPRES
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
  },
  
  // VIEW HELPERS
  defaultView: function() {
    const root = {
      type: 'horizontal',
      size: '80%'
    };
    
    root[0] = {
      type: 'tabs',
      parent: root
    };
    
    root[0].tabs = [{
      type: 'editor',
      path: '',
      parent: root[0]
    }];
    
    root[1] = {
      type: 'tabs',
      parent: 'root'
    };
    
    root[1].tabs = [{
      type: 'terminal',
      parent: root[1]
    }];
    
    return root;
  },
  
  emptyView: function() {
    const root = {
      type: 'tabs'
    };
    
    root.tabs = [{
      type: 'editor',
      path: '',
      parent: root
    }];
    
    return root;
  },
  
  closeView: function(state, action) {
      const newState = {...state};
      
      const path = action.path.split('.');
      const tabContainer = utils.getView(newState, path.split(0, path.length - 1).join('.'));
      const lastKey = parseInt(_.last(path), 10) || 0;
      
      if (tabContainer.type !== 'tabs') {
        console.error('Invalid type of closed view container', tabContainer);
        return state;
      }
      
      if (_.size(tabContainer.tabs) < 2) {
        const parent = tabContainer.parent;
        if (!parent) {
          return utils.emptyView();
        }
        
        const myKey = parseInt(path[path.length - 2], 10) || 0;
        const otherKey = Math.abs(myKey - 1);
          
        if (parent.parent) {
          const parentKey = parseInt(path[path.length - 3], 10) || 0;
          parent.parent = {
            ...parent.parent,
            [parentKey]: parent[otherKey] 
          };
          return newState;
        } else {
          return parent[otherKey];
        }
      } else {
        tabContainer.tabs = [
          ...tabContainer.split(0, lastKey),
          ...tabContainer.split(lastKey + 1)
        ];
      }
      
      return newState;
  },
  
  openView: function(state, action, lastTouched) {
    const newState = {...state};
    
    let component = utils.getView(newState, lastTouched);
    if (!component) {
      component = utils.getFirstTabsView(newState);
      if (!component) {
        console.error('No tabs view found, no last touched view either');
        return state;
      }
    }
    
    if (component.type !== 'tabs') {
      component = component.parent;
      if (!component || component.type !== 'tabs') {
        console.error('Failed to find tabs view');
      }
    }
    
    const index = parseInt(_.last(lastTouched.split('.')), 10) || component.tabs.length;
    action.view.parent = component;
    component.tabs = [
      ...component.tabs.slice(0, index),
      action.view,
      ...component.tabs.slice(index + 1)
    ];
      
    return newState;
  },
  
  splitView: function(state, action) {
    const newState = {...state};
    
    const newKey = action.side;
    const currentKey = Math.abs(newKey - 1);
    const direction = action.direction;
    
    const currentView = utils.getView(newState, action.path);
    if (currentView.type !== 'tabs') {
      console.error('Failed to split view, view is not tabs', currentView);
      return state;
    }
    
    const newTabsView = {
      type: 'tabs',
      tabs: []
    };

    const container = {
      type: direction,
      [currentKey]: currentView,
      [newKey]: newTabsView
    };
    
    newTabsView.parent = container;
    
    if (currentView.parent) {
      const path = action.path.split('.');
      const parentKey = path[path - 2];
      
      currentView.parent[parentKey] = container;
    } else {
      return container;
    }
    
    currentView.parent = container;
      
    return newState;
  },
  
  getView: function(state, path) {
    if (!state || !path) {
      return state;
    }
    
    _.some(path.split('.'), (key) => {
      if (!state) {
        return true;
      }
      
      if (state.type === 'tabs') {
        state = state.tabs[key];
      } else {
        state = state[key];
      }
    });
    
    return state;
  },
  
  getFirstTabsView: function(state) {
    if (!state || state.type === 'tabs') {
      return state;
    }
    
    if (state[0]) {
      return utils.getFirstTabsView(state[0]);
    } else if (state[1]) {
      return utils.getFirstTabsView(state[1]);
    }
    
    return null;
  }
};

export default utils;