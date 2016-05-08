var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
    identity: 'blog',
    connection: 'mysql',
    schema: true,
    attributes: {
        title: {
            type: 'string',
            // 校验器
            required: true
        },
        content: {
            type: 'string'
        },
        category:{
            type: 'string'
        },
        created: {
            type: 'date'
        },
        updated: {
            type: 'date'
        }
    },
    // 生命周期回调
    beforeCreate: function(value, cb){
        value.created = new Date();
        console.log('beforeCreate executed');
        return cb();
    }
});