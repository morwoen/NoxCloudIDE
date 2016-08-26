import Socket from './socket';
import _ from 'lodash';
import ajax from 'client-ajax';
import path from 'path';
import DMP from 'diff-match-patch';
import { Map, List } from 'immutable';

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
    if (state.get('contents')) {
      const checkFileContents = (f, path) => {
        if (f.get('contents')) {
          var openDir = `${path}/${f.get('filename')}`;
          openPaths.push(openDir);
          f.get('contents').forEach(_.partial(checkFileContents, _, openDir));
        }
      };
      state.get('contents').forEach(_.partial(checkFileContents, _, ''));
    }
    window.localStorage.setItem('openPath', JSON.stringify(openPaths));
  },
  
  setDirectoryContents: function(state, action) {
    const folders = action.folder.split('/');
    folders.shift();
    
    let current = state.get('root');
    let path = ['root'];
    folders.some((folder) => {
      if (!folder) {
        return;
      }
      
      const next = _.findIndex(current.get('contents').toArray(), (file) => {
        return file.get('filename') === folder && file.get('isDirectory');
      });
      
      if (!~next) {
        current = null;
        return true;
      }
      
      current = current.get('contents').get(next);
      path.push('contents');
      path.push(next);
      return !current;
    });
    
    if (current) {
      path.push('contents');
      return state.setIn(path, List((action.contents || []).map(x => Map(x))));
    }
    return state;
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
    return Map({
      type: 'horizontal',
      size: '80%',
      0: Map({
        type: 'tabs',
        tabs: List([
          Map({
            type: 'editor',
            path: ''
          })
        ])
      }),
      1: Map({
        type: 'tabs',
        tabs: List([
          Map({
            type: 'terminal'
          })
        ])
      })
    });
  },
  
  emptyView: function() {
    return Map({
      type: 'tabs',
      tabs: List([
        Map({
          type: 'editor',
          path: ''
        })
      ])
    });
  },
  
  closeView: function(state, action) {
      const path = action.path.split('.');
      const tabContainer = state.getIn(path.split(0, path.length - 2));
      const lastKey = parseInt(_.last(path), 10) || 0;
      
      if (tabContainer.get('type') !== 'tabs') {
        console.error('Invalid type of closed view container', tabContainer.toJS());
        return state;
      }
      
      if (tabContainer.get('tabs').size < 2) {
        const parent = state.getIn(path.split(0, path.length - 3));
        if (!parent) {
          return utils.emptyView();
        }
        
        const myKey = parseInt(path[path.length - 3], 10) || 0;
        const otherKey = Math.abs(myKey - 1);
        
        const parentParent = state.getIn(path.split(0, path.length - 4));
        if (parentParent) {
          const parentKey = parseInt(path[path.length - 4], 10) || 0;
          return state.setIn(path.split(0, path.length - 4).concat([parentKey]), parent.get(otherKey));
        } else {
          return parent.get(otherKey);
        }
      } else {
        return state.setIn(path.slice(0, path.length - 1), List([
          ...tabContainer.slice(0, lastKey),
          ...tabContainer.slice(lastKey + 1)
        ]));
      }
  },
  
  openView: function(state, action, lastTouched) {
    let usedPath = lastTouched.split('.');
    usedPath = usedPath.slice(0, usedPath.length - 2);
    let component = state.getIn(usedPath);
    if (!component) {
      component = utils.getFirstTabsViewPath(state, '');
      if (!_.isString(component)) {
        console.error('No tabs view found, no last touched view either');
        return state;
      }
      
      usedPath = component.split('.');
      component = state.getIn(usedPath);
    }
    
    if (component.get('type') !== 'tabs') {
      usedPath = usedPath.slice(0, usedPath.length - 1);
      component = state.getIn(usedPath);
      if (!component || component.get('type') !== 'tabs') {
        console.error('Failed to find tabs view');
        return state;
      }
    }
    
    const index = parseInt(_.last(lastTouched.split('.')), 10) || component.get('tabs').size;
    
    return state.setIn(usedPath.concat(['tabs']), List([
      ...component.get('tabs').slice(0, index).toArray(),
      Map(action.view),
      ...component.get('tabs').slice(index + 1).toArray()
    ]));
  },
  
  splitView: function(state, action) {
    const newKey = action.side;
    const currentKey = Math.abs(newKey - 1);
    const direction = action.direction;
    
    const path = action.path.split('.');
    const currentView = state.getIn(path);
    if (currentView.get('type') !== 'tabs') {
      console.error('Failed to split view, view is not tabs', currentView.toJS());
      return state;
    }
    
    const container = Map({
      type: direction,
      [currentKey]: currentView,
      [newKey]: Map({
        type: 'tabs',
        tabs: List()
      })
    });
    
    const parentPath = path.slice(0, path.length - 1);
    const parent = state.getIn(parentPath);
    if (parent) {
      const parentKey = path[path - 2];
      return state.setIn(parentPath.concat([parentKey]), container);
    } else {
      return container;
    }
  },
  
  getFirstTabsViewPath: function(state, path) {
    if (!state || state.get('type') === 'tabs') {
      return path;
    }
    
    if (path) {
      path += '.';
    }
    
    if (state.get('0')) {
      return utils.getFirstTabsViewPath(state.get('0'), `${path}0`);
    } else if (state.get('1')) {
      return utils.getFirstTabsViewPath(state.get('1'), `${path}1`);
    }
    
    return path;
  }
};

export default utils;