'use strict';
mainStart
    .controller('pickGoodsCheckController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;
    }]);