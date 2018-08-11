const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const hbs = require('hbs');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'hbs');
// parse application/json
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.render('index', {});
});

module.exports = app;
