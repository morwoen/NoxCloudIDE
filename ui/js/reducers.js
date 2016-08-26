import { combineReducers } from "redux";
import utils from './utils';
import { Map, List } from 'immutable';

function fileExplorer(state = Map(), action) {
  switch(action.type) {
    case 'root':
      return state.set('root', Map(action.root));

    case 'dir':
    case 'closeDir':
      const newState = utils.setDirectoryContents(state, action);
      utils.updateFileExplorerState(newState.get('root'));
      return newState;
      
    default:
      return state;
  }
}

function fileStore(state = Map(), action) {
  switch(action.type) {
    case 'loadFile':
      return state.set(action.path, Map({
        original: String(action.file),
        diffs: List()
      }));
    
    case 'editFile':
      return state.setIn([action.path, 'diffs'], List(action.diffs));
    
    case 'updateFile':
      return state.set(action.path, Map({
        original: action.file,
        diffs: List()
      }));
    
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
let lastTouched = '0.tabs.0';
function view(state = Map(), action) {
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
      return state.setIn(action.path.split('.').concat(['size']), action.size);
    
    case 'selectTab':
      // set lastTouch here as well
      return state.setIn(action.path.split('.').concat(['selected']), action.selected);
      
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