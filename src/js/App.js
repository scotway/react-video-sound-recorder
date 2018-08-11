import ReactDOM from 'react-dom';
import React from 'react';
// import { Router, Route, browserHistory } from 'react-router';

import Recorder from './Recorder';

const App = () => (
  <div className="app">
    <div className="header">
      <div className="grid-container">
        <div className="grid-x grid-margin-x">
          <header className="cell medium-10 large-8">
            <h1>Audio Recorder</h1>
          </header>
        </div>
      </div>
    </div>
    <div className="grid-container">
      <div className="grid-x grid-margin-x">
        <Recorder className="recorder cell medium-12" />
      </div>
    </div>
  </div>
);

App.propTypes = { };

ReactDOM.render(<App />, document.getElementById('app'));
