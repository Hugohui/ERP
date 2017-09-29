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
        $scope.ajaxData = {
            action: "erpLogin",
            params: {
                username:$scope.user.name,
                password:$scope.user.pwd
            }
        }
        $.ajax({
            type: 'POST',
            url: 'http://111.204.101.170:11115',
            data: $scope.ajaxData,
            dataType: 'jsonp',
            jsonp: "callback",
            success: function (data) {
                if(data.resData.result == 0){
                    //�û�Ȩ��
                    $localStorage.roles = jQuery.parseJSON(data.resData.access);
                    //�û���Ϣ
                    $localStorage.user = $scope.user;
                    //��ת����ҳ
                    $state.go('app');
                }
            }
        })
    }
}]);