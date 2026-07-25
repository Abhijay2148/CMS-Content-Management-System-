const categoryModel = require('../models/Category');
const newsModel = require('../models/News');
const settingModel = require('../models/Settings');
const Nodecache = require('node-cache');

const cache = new Nodecache();


const loadCommonData = async (req, res, next) => {
  try {

    var latestNews = cache.get('latestNewscache')
    var categories = cache.get('categoriescache')
    var settings = cache.get('settingscache')

    if (!latestNews && !categories && !settings) {
      settings = await settingModel.findOne().lean();

      latestNews = await newsModel.find()
                                  .populate('category', { 'name': 1, 'slug': 1 })
                                  .populate('author', 'fullname')
                                  .sort({ createdAt: -1 }).limit(5).lean()

      const categoriesInUse = await newsModel.distinct('category')
      categories = await categoryModel.find({ '_id': { $in: categoriesInUse } }).lean()

      cache.set('latestNewscache', latestNews, 60*60)
      cache.set('categoriescache', categories, 60*60)
      cache.set('settingscache', settings, 60*60)
      
    }

    res.locals.settings = settings
      res.locals.latestNews = latestNews
      res.locals.categories = categories

      next()

  } catch (error) {
    next(error)
  }
}

module.exports = loadCommonData