const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const flash = require('connect-flash');

require('dotenv').config();

const pageRouter = require('./routes/page');

const app = express();
const port = 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));   //
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('project1-master'));

// session
app.use(session({
    secret: 'project1',
    resave: false,
    saveUninitialized: true,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

app.use(flash());

app.use('/', pageRouter);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});