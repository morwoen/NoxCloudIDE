import React from 'react';
import { Provider } from 'react-redux';
import Rx from 'rx';
import Socket from '../socket';
import SplitPane from 'react-split-pane';
import FileExplorer from './FileExplorer';
import Panels from './Panels';
import utils from '../utils';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from '../reducers';

const middlewares = [thunkMiddleware];

// Remove this in production
import createLogger from 'redux-logger';
const loggerMiddleware = createLogger();
middlewares.push(loggerMiddleware);

const store = createStore(
  rootReducer,
  {},
  applyMiddleware(...middlewares)
);

const source = new Rx.Subject();

export default class Root extends React.Component {
  getChildContext() {
    return {
      resize: {
        observable: source,
        notify: function() {
          source.onNext('resize');
        }
      }
    };
  }
  
  componentDidMount() {
    Socket.connect();
    utils.restoreFileExplorer(store.dispatch.bind(store));
  }
  
  componentWillUnmount() {
    window.localStorage.setItem('openPath', store.getState().files);
  }
  
  render() {
    return (
      <Provider store={store}>
        <SplitPane split='vertical' minSize={50} defaultSize={200} onChange={() => source.onNext('resize')}>
          <FileExplorer />
          <Panels />
        </SplitPane>
      </Provider>
    );
  }
}

Root.childContextTypes = {
  resize: React.PropTypes.object.isRequired
};

