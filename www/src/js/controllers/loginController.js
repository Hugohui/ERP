'use strict';
mainStart.controller('loginController',['$scope','$rootScope','$localStorage','$http','$state',
    function($scope,$rootScope,$localStorage,$http,$state){
        $scope.user = {};
        $scope.roles = {
            mo1:false,
            mo2:false,
            mo3:true
        };
        //重置
        $scope.reset=function(){
            $("#loginForm")[0].reset();
        }
        $scope.loginOk = function(){
            $scope.ajaxData = {
                action: "erpLogin",
                params: {
                    userName:$scope.user.name,
                    password:$("#upwd").val()
                }
            }

            console.log($scope.ajaxData);

            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        //用户权限
                        $localStorage.roles = data.resData.access;
                        //消息推送
                        $localStorage.sendMessage = data.resData.sendMessage;
                        //用户信息
                        $localStorage.user = $scope.user;
                        //跳转到首页
                        $state.go('app');

                        console.log(888)

                    }
                }
            })
        }
    }]);