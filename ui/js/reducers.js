import { combineReducers } from "redux";
import utils from './utils';

function fileExplorer(state = {}, action) {
  switch(action.type) {
    case 'root':
      return {
        root: action.root
      };

    case 'dir':
    case 'closeDir':
      const newState = utils.setDirectoryContents(state, action);
      utils.updateFileExplorerState(newState);
      return newState;
      
    default:
      return state;
  }
}

function fileStore(state = {}, action) {
  switch(action.type) {
    case 'loadFile':
      return {
        ...state,
        [action.path]: {
          original: String(action.file),
          diffs: []
        }
      };
    
    case 'editFile':
      return {
        ...state,
        [action.path]: {
          original: state[action.path].original,
          diffs: action.diffs
        }
      };
    
    case 'updateFile':
      return {
        ...state,
        [action.path]: {
          original: action.file,
          diffs: []
        }
      };
    
    default:
      return state;
  }
}

// lastTouched should store the path to the last touched editor/image (not terminal)'s tabs component
// lastTouchedIndex should store the index to the last touched tab
//
// spit { type: vertical/horizontal, 0: left/top, 1: right/bottom }
// tabs { type: tabs, tabs: [] }
//
// tabs would be leaf nodes
let lastTouched = '0.0';
function view(state = {}, action) {
  switch(action.type) {
    case 'init':
      return utils.defaultView();
      
    case 'close':
      return utils.closeView(state, action);
      
    case 'open':
      return utils.openView(state, action, lastTouched);
      
    case 'split':
      return utils.splitView(state, action);
      
    case 'touchView':
      lastTouched = action.path;
      return state;
      
    case 'viewSize':
      const resizedView = utils.getView(state, action.path);
      if (!resizedView) {
        return state;
      }
      resizedView.size = action.size;
      return state;
    
    case 'selectTab':
      const tabsView = utils.getView(state, action.path);
      if (!tabsView) {
        return state;
      }
      tabsView.selected = action.selected;
      return state;
      
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  fileExplorer,
  fileStore,
  view
});

export default rootReducer;