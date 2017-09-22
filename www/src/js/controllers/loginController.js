'use strict';
mainStart.controller('loginController',['$scope','$rootScope','$localStorage','$http','$state',
    function($scope,$rootScope,$localStorage,$http,$state){
    $scope.user = {};
    $scope.roles = {
        mo1:false,
        mo2:false,
        mo3:true
    };
    $scope.loginOk = function(){
        if($scope.user.name == 'admin'&& $scope.user.pwd == 'admin'){
            //用户权限
            $localStorage.roles = $scope.roles;
            //用户信息
            $localStorage.user = $scope.user;
            //跳转到首页
            $state.go('app');
        }
    }
}]);