'use strict';
mainStart
    .controller('purchaseCheckController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

    }]);
