NowJS Middleware Layer - Connect style
--------------------------------------

To enable:

<code>
var nowjs = require('now');
require('now-middleware')(nowjs);
</code>


To run when a new user connects:
-------------------------------

<code>
.before( function );
</code>

<pre><code>
nowjs.before(function(client,next){
  var sid = decodeURIComponent( client.user.cookie[sessionKey] );
  sessionStore.get( sid, function( err, session ){
    client.now.session = session;
    next();
  });
});
</pre></code>

Parameters are:
* the beforeware function you want called when each new nowjs session is established, you will receive the newly created nowjs user object (the "this" in remotely called functions) passed as client and the next() function which you must call to pass control to the next beforeware layer

To run when a user makes a remote method call on the server (e.g. to retrieve an HTTP session):
-------------------------------

<code>
.use( route, function );
</code>

<pre><code>
nowjs.use('users', function(args, next){
  var self = this;
  console.log( 'middleware is running' )
  // add additional arguments
  args.push( { lollipop: "is tasty" } );
  next();
});
</pre></code>

Parameters are:

* regex matched route (omit completely if you want to match all routes, what's a route? simply the name and namespace of the function you are calling)
* the middleware function you want called, this function will receive all arguments the client sent, can manipulate/add to them, and then call next() to pass to the next layer in the middleware