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

const rootReducer = combineReducers({
  files
});

export default rootReducer;