'use strict';
mainStart
    .controller('appController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        console.log($scope.roles);
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;
}]);
