'use strict';
mainStart
    .controller('appController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        console.log($scope.roles);
        //获取角色信息
        $scope.user = $localStorage.user;
}]);
