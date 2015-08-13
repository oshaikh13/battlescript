////////////////////////////////////////////////////////////
// bootstrap the app and all services and controllers
////////////////////////////////////////////////////////////

angular.module('battlescript', [
  'battlescript.services',
  'battlescript.auth',
  'battlescript.home',
  'battlescript.dashboard',
  'battlescript.battle',
  'ui.router'
])

////////////////////////////////////////////////////////////
// config the app states
////////////////////////////////////////////////////////////

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'app/home/home.html',
      controller: 'HomeController'
    })
    .state('signin', {
      url: '/signin',
      templateUrl: 'app/auth/signin.html',
      controller: 'AuthController'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'app/auth/signup.html',
      controller: 'AuthController'
    })
    .state('logout', {
      url: '/logout',
      templateUrl: 'app/auth/logout.html',
      controller: 'AuthController'
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'app/dashboard/dashboard.html',
      controller: 'DashboardController',
      authenticate: true
    })
    .state('battleroom', {
      url: '/battle/:id',
      templateUrl: 'app/battle/battle.html',
      controller: 'BattleController',
      authenticate: true
    });

    $urlRouterProvider.otherwise('/');
})

////////////////////////////////////////////////////////////
// config the app tokens
////////////////////////////////////////////////////////////

.config(function($httpProvider) {
  $httpProvider.interceptors.push('AttachTokens');
})

////////////////////////////////////////////////////////////
// set up app factory for attaching tokens
////////////////////////////////////////////////////////////

.factory('AttachTokens', function ($window) {
  var attach = {
    request: function (object) {
      var jwt = $window.localStorage.getItem('battlepro');
      if (jwt) {
        object.headers['x-access-token'] = jwt;
      }
      object.headers['Allow-Control-Allow-Origin'] = '*';
      return object;
    }
  };
  return attach;
})

////////////////////////////////////////////////////////////
// boot up app directives
// 
// - headerMain: the main header bar for auth'd users
////////////////////////////////////////////////////////////

.directive('headerMain', function() {
  return {
    restrict: 'E',
    scope: {
      userInfo: '=userInfo'
    },
    templateUrl: 'app/directives/header-main.html'
  };
})

.directive('headerLogout', function() {
  var link = function(scope, element, attrs) {
    element.bind('click', function(e) {
      e.preventDefault();
      scope.$parent.$apply(attrs.logout);
    });
  };

  return {
    link: link,
    restrict: 'E',
    templateUrl: 'app/directives/header-logout.html'
  };
})

////////////////////////////////////////////////////////////
// run the style
////////////////////////////////////////////////////////////

.run(function ($rootScope, $location, Auth, SocketHolder) {
  $rootScope.$on('$stateChangeStart', function (evt, next, current) {
    // redirect home if auth required and user isn't auth
    if (next && next.authenticate && !Auth.isAuth()) {
      $location.path('/');
    }

    SocketHolder.emitOnline();

    // redirect to dashboard if user is auth and tries to access home page
    if (next && next.url === '/' && Auth.isAuth()) {
      $location.path('/dashboard');
    }
  });
});
