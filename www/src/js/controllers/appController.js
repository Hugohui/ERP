'use strict';
mainStart
    .controller('appController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��Ϣ����
        $scope.sendMessage = $localStorage.sendMessage;
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;

        //�鿴δ����Ϣ
        $rootScope.viewMessage = function(bill){
            console.log(bill);
        }
}]);
