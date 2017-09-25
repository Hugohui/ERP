'use strict';
mainStart
    .controller('infoMaintainController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;
    }]);
