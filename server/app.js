const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const hbs = require('hbs');

const app = express();
app.use(cors());
app.use(express.static('public'))
app.set('view engine', 'hbs');
// parse application/json
app.use(bodyParser.json());

/*
app.put('/v2/rtn/users/:userId(\\d+)', async (req, res, next) => {
  try {
    req.appResponseData = await UserController.update(req);
    next();
  } catch (error) {
    req.appResponseError = error;
    next();
  }
});
*/

app.get('/', (req, res, next) => {
  res.render('index',{});
});

/*
app.use((req, res) => {
  if (req.appResponseData) {
    res.status(200).json(req.appResponseData);
  } else if (req.appResponseError) {
    res.status(400).json({
      error: req.appResponseError,
    });
  } else {
    res.status(404).send('Not Found');
  }
});
*/

module.exports = app;
