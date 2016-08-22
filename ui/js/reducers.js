import { combineReducers } from "redux";
import utils from './utils';

function files(state = {}, action) {
  switch(action.type) {
    case 'root':
      return {
        root: action.root
      };

    case 'dir':
    case 'close':
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

function openedFiles(state = {}, action) {
  switch(action.type) {
    case 'openFile':
      return {
        1: action.path
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
let nextId = 1;
let lastTouched = '';
let lastTouchedIndex = 0;
function view(state = {}, action) {
  switch(action.type) {
    case 'init':
      return {
        [nextId++]: {
          type: 'horizontal',
          views: {
            [nextId++]: {
              type: 'editor',
              path: ''
            },
            [nextId++]: {
              type: 'terminal'
            }
          }
        }
      };
      
    case 'close':
      const newState = {...state};
      
      return newState;
      
    case 'open':
      const newState = {...state};
      
      
      return newState;
      
    case 'split':
      const newState = {...state};
      
      
      return newState;
      
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  files,
  fileStore,
  openedFiles,
  view
});

export default rootReducer;