import React from 'react';
import { Provider } from 'react-redux';
import Rx from 'rx';
import Socket from '../socket';
import IDE from './IDE';
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
        notify: () => {
          source.onNext('resize');
        }
      }
    };
  }
  
  componentDidMount() {
    Socket.fs.connect();
    utils.restoreFileExplorer(store.dispatch.bind(store));
    window.addEventListener('resize', () => source.onNext('resize'));
    store.dispatch({
      type: 'init'
    });
  }
  
  componentWillUnmount() {
    window.localStorage.setItem('openPath', store.getState().fileExplorer);
  }
  
  render() {
    return (
      <Provider store={store}>
        <IDE />
      </Provider>
    );
  }
}

Root.childContextTypes = {
  resize: React.PropTypes.object.isRequired
};

