'use strict';
/*路由配置*/
angular.module('mainStart')
    .run(['$rootScope', '$state', '$stateParams',function ($rootScope,   $state,   $stateParams) {
        }
    ])
    .config(['$stateProvider','$urlRouterProvider', function($stateProvider,$urlRouterProvider){
        $urlRouterProvider
            .otherwise('/');
        $stateProvider
            //登录页
            .state('login', {
                url: '/login',
                templateUrl: 'tpl/login.html',
                resolve: {
                    deps: ['$ocLazyLoad',
                        function( $ocLazyLoad ){
                            return $ocLazyLoad.load(['js/controllers/loginController.js']);
                        }]
                }
            })

            //首页
            .state('index', {
                url: '/index',
                templateUrl: 'tpl/index.html',
                resolve: {
                    deps: ['$ocLazyLoad',
                        function( $ocLazyLoad ){
                            return $ocLazyLoad.load(['js/controllers/indexController.js']);
                        }]
                }
            })
    }]);