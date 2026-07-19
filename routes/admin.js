const express = require('express');
const router = express.Router();

//IMPORTS
const articleController = require('../controllers/articleController');
const categoryController = require('../controllers/categoryController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const isLoggedin = require('../middleware/isLoggedin');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../middleware/multer');
const isValid = require('../middleware/validation');



//Login Routes
router.get('/', userController.loginPage);
router.post('/index', isValid.loginValidation, userController.adminLogin);
router.get('/logout', userController.logout);
router.get('/dashboard', isLoggedin, userController.dashboard);
router.get('/settings', isLoggedin, isAdmin, userController.settings);
router.post('/save-settings',  isLoggedin, isAdmin, upload.single('website_logo'), userController.saveSettings);

//User crud routes
router.get('/users', isLoggedin, isAdmin, userController.allUser);
router.get('/add-user', isLoggedin, isAdmin,  userController.addUserPage);
router.post('/add-user', isLoggedin, isAdmin, isValid.userValidation, userController.addUser);
router.get('/update-user/:id', isLoggedin, isAdmin, userController.updateUserPage);
router.post('/update-user/:id', isLoggedin, isAdmin, isValid.userUpdateValidation, userController.updateUser);
router.delete('/delete-user/:id', isLoggedin, isAdmin, userController.deleteUser);


//Category crud routes
router.get('/category', isLoggedin, isAdmin, categoryController.allCategory);
router.get('/add-category', isLoggedin, isAdmin, categoryController.addCategoryPage);
router.post('/add-category', isLoggedin, isAdmin, isValid.categoryValidation, categoryController.addCategory);
router.get('/update-category/:id', isLoggedin, isAdmin, categoryController.updateCategoryPage);
router.post('/update-category/:id', isLoggedin, isAdmin, isValid.categoryValidation, categoryController.updateCategory);
router.delete('/delete-category/:id', isLoggedin, isAdmin, categoryController.deleteCategory);

//Article CRUD Routes
router.get('/article', isLoggedin, articleController.allArticle);
router.get('/add-article', isLoggedin, articleController.addArticlePage);
router.post('/add-article', isLoggedin, upload.single('image'), isValid.articleValidation, articleController.addArticle);
router.get('/update-article/:id', isLoggedin, articleController.updateArticlePage);
router.post('/update-article/:id', isLoggedin, upload.single('image'), isValid.articleValidation, articleController.updateArticle);
router.delete('/delete-article/:id', isLoggedin, articleController.deleteArticle);


//Comment CRUD Routes
router.get('/comments', isLoggedin, commentController.allComments);
router.put('/update-comment-status/:id', isLoggedin, commentController.updateCommentStatus);
router.delete('/delete-comment/:id', isLoggedin, commentController.deleteComment);

//404  Middleware
router.use((req, res, next) => {
       res.status(404).render('admin/404',{
        message: 'Page not found',
        role: req.role
       })
})

router.use(isLoggedin, (err, req, res, next) => {
    console.error(err.stack);

    const status = err.status || 500;

    let view;

    switch(status){
        case 401:
            view = "admin/401";
            break;
        case 404:
            view = "admin/404";
            break;
        default:
            view = "admin/500";
    }

    res.status(status).render(view,{
        message: err.message,
        role:req.role
    });
});

module.exports = router;