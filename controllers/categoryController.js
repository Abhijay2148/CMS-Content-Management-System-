const categoryModel = require('../models/Category');
const createError = require('../utils/error-message');
const { validationResult } = require('express-validator');
const newsModel = require('../models/News')

const allCategory = async (req, res, next) => {
        try {
                const categories = await categoryModel.find().lean();
                res.render('admin/categories', { categories, role: req.role });
        } catch (err) {
                next(err);
        }
}
const addCategoryPage = async (req, res) => {
        res.render('admin/categories/create', { role: req.role, errors: 0 });  
}

const addCategory = async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
                return res.render('admin/categories/create', {
                        role: req.role,
                        errors: errors.array()
                });
        }

        try {
                await categoryModel.create(req.body);
                res.redirect('/admin/category');
        } catch (err) {
                // console.error(err);
                // res.status(500).json({ message: err.message });
                next(err);
        }
}


const updateCategoryPage = async (req, res, next) => {
        try {
                const id = req.params.id;
                const category = await categoryModel.findById(id);
                if (!category) {
                         return next(createError('Category not found', 404))
                }

                res.render('admin/categories/update', { category, role: req.role, errors: [] });
        } catch (err) {
                // console.error(err);
                // res.status(500).json({ message: err.message });
                next(err);
        }
}


const updateCategory = async (req, res, next) => {
        
        const id = req.params.id;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
                const category = await categoryModel.findById(id);
                return res.render('admin/categories/update', {
                        category,
                        errors: errors.array(),
                        role: req.role
                });
        }
        
        try {
                const category = await categoryModel.findById(req.params.id);
                if (!category) return next(createError('Category not found', 404))

                category.name = req.body.name;
                category.description = req.body.description;
                await category.save(); // ✅ triggers pre('validate') hook, regenerates slug

                res.redirect('/admin/category');
        } catch (err) {
                // console.error(err);
                // res.status(500).send('Server Error');
                next(err);
        }
};


const deleteCategory = async (req, res, next) => { 
        
        try {
                const id = req.params.id;
                const category = await categoryModel.findById(id);
                if (!category) {
                        return next(createError('Category not found', 404))
                }

                

                const article = await newsModel.findOne({category: id})
                if(article){
                        return res.status(400).json({success: false, message: 'Category is associated with an article'})
                }

                await category.deleteOne();
                res.json({ success: true });
        } catch (err) {
                // console.error(err);
                // res.status(500).json({ message: err.message });
                next(err);
        }
}


module.exports = {
        allCategory,
        addCategoryPage,
        addCategory,
        updateCategoryPage,
        updateCategory,
        deleteCategory
}
