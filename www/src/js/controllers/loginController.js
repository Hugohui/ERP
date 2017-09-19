'use strict';
mainStart.controller('loginController',['$scope','$rootScope','$localStorage','$http','$state',
    function($scope,$rootScope,$localStorage,$http,$state){
    $scope.user = {};
    $scope.roles = {
        mo1:true,
        mo2:false,
        mo3:true
    };
    $scope.loginOk = function(){
        if($scope.user.name == 'admin'&& $scope.user.pwd == 'admin'){
            $localStorage.roles = $scope.roles;
            $state.go('index');
        }
    }
}]);