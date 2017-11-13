'use strict';
mainStart
    .controller('borrowManageController',['$scope','$rootScope','$localStorage', 'toastr','$compile',function($scope,$rootScope,$localStorage, toastr,$compile){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

    }]);
