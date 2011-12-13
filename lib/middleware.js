// Module dependencies
var nowUtil = require('now/lib/nowUtil').nowUtil;
var assert = require('assert');

module.exports = function(n){

  var nowjs = n;
  var fn = require('now/lib/function').init(nowjs);

  // setup up additional present hook goodies

  nowjs.middleware = [];
  nowjs.beforeware = [];

  nowjs.before = function(beforeware){
    var self = this;
    self.beforeware.push({ handle: beforeware });
    return self;
  };

  nowjs.use = function(route, middleware){
    if( typeof route == 'function' ){
      middleware = route;
      route = ".*";
    }
    if( !route ){
      route = ".*";
    }
    var self = this;
    self.middleware.push({ route: route, handle: middleware });
    return self;
  };
  
  nowjs.sessions = function(sessionStore,sessionKey){
    if( !sessionKey ){
      sessionKey = 'connect.sid';
    }
    nowjs.before(function(client,next){
      var sid = decodeURIComponent( client.user.cookie[sessionKey] );
      sessionStore.get( sid, function( err, session ){
        client.now.session = session;
        next();
      });
    });
  };

  // enable beforeware
  nowjs.on('connect',function(){
    // Run any configured beforeware
    var self = this;
    var index = 0;
    var stack = nowjs.beforeware;
    function next(){
      var layer = stack[index++];
      if(!layer){return}
      layer.handle(self,next);
    }
    next();

    // enable middleware for rpc calls
    var rpc_listeners = self.socket.listeners('rfc');

    var rfcMiddlewareHandler = function(data) {
      // setup
      var args = data.args;
      var user;
      var route = data.fqn;
      for (var i = 0, ll = args.length; i < ll; i++) {
        if (nowUtil.hasProperty(args[i], 'fqn')) {
          user = nowUtil.clone(self, {fqn: args[i].fqn});
          args[i] = fn.remotecall.bind(user);
        }
      }
      // execute middleware
      var index = 0;
      var stack = nowjs.middleware;
      function next(err){
        var layer = stack[index++];
        if(!layer){return}
        // test match route
        if( route.match(layer.route) == null ){
          next();
        }else{
          try{
            var arity = layer.handle.length;
            if (err) {
              if (arity === 3) {
                layer.handle.call(self, err, args, next);
              } else {
                next(err);
              }
            } else if (arity < 3) {
              layer.handle.call(self, args, next);
            } else {
              next();
            }
          } catch (e) {
            if (e instanceof assert.AssertionError) {
              console.error(e.stack + '\n');
              next(e);
            } else {
              next(e);
            }
          }
        }
      }

      next();
    }
    // inject our middleware processor
    rpc_listeners.unshift(rfcMiddlewareHandler);
  }); 
};