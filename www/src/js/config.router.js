'use strict';
/*路由配置*/
angular.module('mainStart')
    .run(['$rootScope', '$localStorage','$state', '$stateParams',
        function ($rootScope,$localStorage,$state) {
            $rootScope.$state = $state;
            //监听路由变化
            $rootScope.$on('$locationChangeStart',function(event){

                if(!$localStorage.user){
                    //动态设置标题
                    event.preventDefault();
                    $state.go('login');
                }
            });
        }])
    .config(['$stateProvider','$urlRouterProvider', function($stateProvider,$urlRouterProvider){
        $urlRouterProvider
            .otherwise('/index');
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
                },
                data:{
                    pageTitle:'IDRIVER+ERP系统_登录'
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
                },
                data:{
                    pageTitle:'IDRIVER+ERP系统_首页'
                }
            })
    }]);