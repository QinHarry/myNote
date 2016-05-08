var Waterline = require('waterline');
var mysqlAdapter = require('sails-mysql');

var Blog = require('../models/post.server.model');

var orm = new Waterline();
var wlconfig = {
    adapters: {
        'default': mysqlAdapter,
        'mysql': mysqlAdapter
    },
    connections: {
        'mysql': {

            module    : 'sails-mysql',
            host      : 'localhost',
            port      : 3306,
            user      : 'root',
            password  : '15281896065',
            database  : 'mynode',
            // adapters 中的适配器代码
            adapter: 'mysql',
            url: 'mysql://root:@localhost/mynode'
        }
    }
};

// 加载数据集合
orm.loadCollection(Blog);

exports.orm = orm;
exports.config = wlconfig;