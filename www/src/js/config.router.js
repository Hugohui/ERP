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
            .otherwise('/app');
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
                },
                controller:'loginController'
            })

            //首页
            .state('app', {
                url: '/app',
                templateUrl: 'tpl/app.html',
                resolve: {
                    deps: ['$ocLazyLoad',
                        function( $ocLazyLoad ){
                            return $ocLazyLoad.load(['js/controllers/appController.js']);
                        }]
                },
                data:{
                    pageTitle:'IDRIVER+ERP系统_首页'
                },
                controller:'appController'
            })

            /*采购*/
            .state('purchase',{
                url:'/purchase',
                template: '<div ui-view class="app"></div>'
            })
            .state('purchase.purchaseRequest',{//采购申请
                url:'/purchaseRequest',
                templateUrl:'tpl/purchase/purchaseRequest.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/purchase/purchaseRequestController.js']);
                    }]
                },
                controller:'purchaseRequestController'
            })
            .state('purchase.purchaseTrack',{//采购跟踪
                url:'/purchaseTrack',
                templateUrl:'tpl/purchase/purchaseTrack.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/purchase/purchaseTrackController.js']);
                    }]
                },
                controller:'purchaseTrackController'
            })
            .state('purchase.purchaseHistory',{//采购历史
                url:'/purchaseHistory',
                templateUrl:'tpl/purchase/purchaseHistory.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/purchase/purchaseHistoryController.js']);
                    }]
                },
                controller:'purchaseHistoryController'
            })
            .state('purchase.purchaseCheck',{//采购审核
                url:'/purchaseCheck',
                templateUrl:'tpl/purchase/purchaseCheck.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/purchase/purchaseCheckController.js']);
                    }]
                },
                controller:'purchaseCheckController'
            })

            /*库管*/
            .state('depotManagement',{
                url:'/depotManagement',
                template: '<div ui-view></div>'
            })
            .state('depotManagement.depotRequest',{//库存查询
                url:'/purchaseRequest',
                templateUrl:'tpl/depotManagement/depotRequest.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/depotManagement/depotRequestController.js']);
                    }]
                },
                controller:'depotRequestController'
            })
            .state('depotManagement.depotInput',{//采购入库
                url:'/depotInput',
                templateUrl:'tpl/depotManagement/depotInput.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/depotManagement/depotInputController.js']);
                    }]
                },
                controller:'depotInputController'
            })
            .state('depotManagement.depotOutput',{//领料出库
                url:'/depotOutput',
                templateUrl:'tpl/depotManagement/depotOutput.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/depotManagement/depotOutputController.js']);
                    }]
                },
                controller:'depotOutputController'
            })
            .state('depotManagement.returnGoodsCheck',{//退料审核
                url:'/returnGoodsCheck',
                templateUrl:'tpl/depotManagement/returnGoodsCheck.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/depotManagement/returnGoodsCheckController.js']);
                    }]
                },
                controller:'returnGoodsCheckController'
            })

            /*我的*/
            .state('personal',{
                url:'/personal',
                template: '<div ui-view></div>'
            })
            .state('personal.pickGoodsCheck',{//领料申请
                url:'/pickGoodsCheck',
                templateUrl:'tpl/personal/pickGoodsCheck.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/personal/pickGoodsCheckController.js']);
                    }]
                },
                controller:'pickGoodsCheckController'
            })
            .state('personal.returnGoodsCheck',{//退料申请
                url:'/returnGoodsCheck',
                templateUrl:'tpl/personal/returnGoodsCheck.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/personal/returnGoodsCheckController.js']);
                    }]
                },
                controller:'returnGoodsCheckController'
            })
            .state('personal.infoMaintain',{//信息维护
                url:'/infoMaintain',
                templateUrl:'tpl/personal/infoMaintain.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/personal/infoMaintainController.js']);
                    }]
                },
                controller:'infoMaintainController'
            })

            /*系统管理*/
            .state('systemManage',{
                url:'/systemManage',
                template: '<div ui-view class="app"></div>'
            })
            .state('systemManage.userManage',{//用户管理
                url:'/userManage',
                templateUrl:'tpl/systemManage/userManage.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/systemManage/userManageController.js']);
                    }]
                },
                controller:'userManageController'
            })
            .state('systemManage.operationLog',{//操作日志
                url:'/operationLog',
                templateUrl:'tpl/systemManage/operationLog.html',
                resolve:{
                    deps:['$ocLazyLoad',function($ocLazyLoad){
                        return $ocLazyLoad.load(['js/controllers/systemManage/operationLogController.js']);
                    }]
                },
                controller:'operationLogController'
            })
    }]);