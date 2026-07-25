const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const minifyHTML = require('express-minify-html-terser');
const session = require('express-session');
const flash = require('connect-flash');
const compression = require('compression');
const multer = require('multer');
const app = express();
require('dotenv').config();

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true }));

//Middleware
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public'), {maxAge: '2d'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.set('layout', 'layout');
app.use(compression({
        level: 9,
        threshold: 10*1024,
        filter: (req, res) => {
            if(req.headers['x-no-compression']) {
                return false
            }

            return compression.filter(req, res);
        }
}));

app.use(minifyHTML({
    override:      true,
    exception_url: false,
    htmlMinifier: {
        removeComments:            true,
        collapseWhitespace:        true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes:     true,
        removeEmptyAttributes:     true,
        minifyJS:                  true
    }
}));
 

mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err));

app.use(flash());
app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        next();
});

const port = process.env.PORT || 3000;


//Routes


app.use('/admin', (req, res, next) => {
        res.locals.layout = 'admin/layout';
        next();
});


app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/frontend'));

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: `Maximum file size is ${err.limit / 1024 / 1024} MB`
            });
        }
    }

    next(err);
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
