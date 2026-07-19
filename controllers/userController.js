const UserModel = require('../models/User');
const NewsModel = require('../models/News');
const CategoryModel = require('../models/Category');
const settingModel = require('../models/Settings');
const createError = require('../utils/error-message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {validationResult} = require('express-validator');                
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const loginPage = async (req, res) => {
    res.render('admin/login', {
        layout: false,
        errors: 0
    });
}
const adminLogin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       return res.render('admin/login', {
                layout: false,
                errors: errors.array()
            });
    }

    try {
        const { username, password } = req.body;
        const user = await UserModel.findOne({ username });

        if (!user) {
           return next(createError('Invalid UserName or Password', 401))
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
           return next(createError('Invalid UserName or Password', 401))
        }

        const jwtData = { id: user._id, fullname: user.fullname, role: user.role };

        const token = jwt.sign(
            jwtData,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3600000
        });

        res.redirect('/admin/dashboard');

    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
}


const logout = async (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/');
}

//Dashboard
const dashboard = async (req, res, next) => {

    try {
        let articleCount;
        if (req.role === 'author') {
            articleCount = await NewsModel.countDocuments({ author: req.id })
        } else {
            articleCount = await NewsModel.countDocuments();
        }

        const categoryCount = await CategoryModel.countDocuments();
        const userCount = await UserModel.countDocuments();
        res.render('admin/dashboard', {
            role: req.role,
            fullname: req.fullname,
            articleCount,
            categoryCount,
            userCount
        });

    } catch (err) {
        next(err);
    }


}

const settings = async (req, res, next) => {
    try {
        const settings = await settingModel.findOne();
        res.render('admin/settings', { role: req.role, settings });
    } catch (err) {
        next(err);
    }
}


const saveSettings = async (req, res, next) => {

    const { website_title, footer_description } = req.body;
    const website_logo = req.file?.filename;

    try {

        let setting = await settingModel.findOne();
        if (!setting) {
            setting = new settingModel();
        }

        setting.website_title = website_title;
        setting.footer_description = footer_description;

        if (website_logo) {
            if (setting.website_logo) {
                const logoPath = `./public/uploads/${setting.website_logo}`;
                if (fs.existsSync(logoPath)) {
                    fs.unlinkSync(logoPath);
                }
            }
            setting.website_logo = website_logo;
        }

        await setting.save();
        res.redirect('/admin/settings');
    } catch (err) {
        next(err);
    }
}


const allUser = async (req, res, next) => {
    try {
        const users = await UserModel.find().select('-password').lean();
        res.render('admin/users', { users, role: req.role });
    } catch (err) {
        next(err);
    }
}
const addUserPage = async (req, res) => {
    res.render('admin/users/create', { role: req.role, errors: [] });
}

const addUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/users/create', {
            errors: errors.array(),
            role: req.role
        });
    }

    try {
        const { fullname, username, password, role } = req.body;

        const existing = await UserModel.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        await UserModel.create({ fullname, username, role, password });

        res.redirect('/admin/users');
    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
};


const updateUserPage = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.params.id);

        if (!user) {
            return next(createError('User not found', 404))
        }

        res.render('admin/users/update', { user, role: req.role, errors: [] });
    } catch (err) {
        // console.log(err);
        // res.status(500).json({ message: err.message })
        next(err);
    }
}
const updateUser = async (req, res, next) => {

    const id = req.params.id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/users/update', {
            user: req.body,
            errors: errors.array(),
            role: req.role
        });
    }

    try {
        
        const { fullname, password, role } = req.body;

        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = { fullname, role };

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateData.password = hashedPassword;
        }

        await UserModel.findByIdAndUpdate(id, updateData, { new: true });
        res.redirect('/admin/users');
    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
}
const deleteUser = async (req, res, next) => {
    const id = req.params.id;
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return next(createError('User not found', 404))
        }

        const article = await NewsModel.findOne({ author: id });
        if (article) {
            return res.status(400).json({ success: false, message: 'User is associated with an article' });
        }

        await user.deleteOne();
        res.status(200).json({ success: true });
    } catch (err) {
        // console.log(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
};

module.exports = {
    loginPage,
    adminLogin,
    logout,
    allUser,
    addUserPage,
    addUser,
    updateUserPage,
    updateUser,
    deleteUser,
    dashboard,
    settings,
    saveSettings
}


