const NewsModel = require('../models/News');
const categoryModel = require('../models/Category');
const fs = require('fs');
const path = require('path');
const createError = require('../utils/error-message')
const { validationResult } = require('express-validator');

const allArticle = async (req, res, next) => {
    try {
        let articles;
        if (req.role === 'admin') {
            articles = await NewsModel.find()
                .populate('category', 'name')
                .populate('author', 'fullname')
                .lean();
        } else {
            articles = await NewsModel.find({ author: req.id })
                .populate('category', 'name')
                .populate('author', 'fullname')
                .lean();
        }


        res.render('admin/articles', { role: req.role, articles });
    } catch (err) {
        // console.error(err);
        // res.status(500).send('Server Error');
        next(err);
    }
}
const addArticlePage = async (req, res, next) => {
    try {
        const categories = await categoryModel.find().lean();
        res.render('admin/articles/create', { role: req.role, categories, errors: [] });
    } catch (err) {
        next(err);
    }
}


const addArticle = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const categories = await categoryModel.find().lean();
        return res.render('admin/articles/create', {
            errors: errors.array(),
            role: req.role,
            categories
        });
    }   

    try {
        const { title, content, category } = req.body;
        await NewsModel.create({
            title,
            content,
            category,
            author: req.id,
            image: req.file.filename
        });


        res.redirect('/admin/article');
    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
}


const updateArticlePage = async (req, res, next) => {
    const id = req.params.id;
    

    try {
        const article = await NewsModel.findById(id)
            .populate('category', 'name')
            .populate('author', 'fullname');

        if (!article) {
            return next(createError('Article not found', 404))
            // return res.status(404).json({ error: 'Article not found' });
        }

        if (req.role !== 'admin' && article.author._id.toString() !== req.id) {
            return next(createError('Unauthorized', 401))
        }


        const categories = await categoryModel.find().lean();
        res.render('admin/articles/update', { role: req.role, article, categories, errors: [] });
    } catch (error) {
        
       next(error);
    }
}
const updateArticle = async (req, res, next) => {
    const id = req.params.id;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const categories = await categoryModel.find().lean();
        return res.render('admin/articles/update', {
            article: req.body,
            errors: errors.array(),
            role: req.role,
            categories
        });
    }

    try {
        
        const { title, content, category } = req.body;

        const article = await NewsModel.findById(id);
        if (!article) {
             return next(createError('Article not found', 404))
        }
        
        if (req.role === 'author') {
            if(req.id !== article.author._id.toString()){
                return next(createError('Unauthorized', 401))
            }
        }
           

        article.title = title;
        article.content = content;
        article.category = category;

        if (req.file) {
            const filePath = path.join(__dirname, '../public/uploads', article.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            article.image = req.file.filename
        }
        await article.save();
        res.redirect('/admin/article');

    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
}
const deleteArticle = async (req, res, next) => {
    const id = req.params.id;
    try {

        const article = await NewsModel.findById(id);
        if (!article) {
            return next(createError('Article not found', 404));
        }

        if (req.role !== 'admin' && article.author._id.toString() !== req.id) {
            return next(createError('Unauthorized', 401))
        }

        const filePath = path.join(__dirname, '../public/uploads', article.image);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await article.deleteOne();
        res.json({ success: true });
    } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: err.message });
        next(err);
    }
}


module.exports = {
    allArticle,
    addArticlePage,
    addArticle,
    updateArticlePage,
    updateArticle,
    deleteArticle
}



