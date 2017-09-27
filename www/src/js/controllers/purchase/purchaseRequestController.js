'use strict';
mainStart
    .controller('purchaseRequestController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;

        $scope.checkGroupLeader = function(){
            $scope.choseCheckPeopleTitle ="选择室组经理";
        }
        $scope.checkMinister = function(){
            $scope.choseCheckPeopleTitle ="选择室部长";
        }
        $scope.checkManager = function(){
            $scope.choseCheckPeopleTitle ="选择总经理";
        }
    }]);
