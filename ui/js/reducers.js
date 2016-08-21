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

const rootReducer = combineReducers({
  files,
  fileStore,
  openedFiles
});

export default rootReducer;