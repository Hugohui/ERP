'use strict';
mainStart
    .controller('purchaseTrackController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��Ϣ����
        $scope.sendMessage = $localStorage.sendMessage;
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;

    }]);
