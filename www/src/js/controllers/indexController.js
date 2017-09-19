'use strict';
mainStart
    .controller('indexController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
    $scope.roles = $localStorage.roles;
}]);
