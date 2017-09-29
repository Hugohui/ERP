'use strict';
mainStart
    .controller('userManageController',['$scope','$rootScope','$localStorage','$http',function($scope,$rootScope,$localStorage,$http){
        $scope.userInfo={};
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;
        //
        $scope.modelTitle="";
        $scope.okAdd=function(){
            $scope.data = {
                action:'addUser',
                params:{
                    userName: $scope.userInfo.userName,
                    password: $scope.userInfo.password,
                    phone:$scope.userInfo.phone,
                    access:$scope.userInfo.access,
                    group:$scope.userInfo.group,
                    data_permissions:{
                        contract_number: $scope.userInfo.contract_number || false,
                        unit_price:$scope.userInfo.unit_price || false,
                        inventory_quantity:$scope.userInfo.inventory_quantity || false,
                        money:$scope.userInfo.money || false,
                        tax_rate:$scope.userInfo.tax_rate|| false,
                        invoice:$scope.userInfo.invoice|| false,
                        inventory_position:$scope.userInfo.inventory_position|| false
                    }
                }
            }
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:$scope.data,
                dataType: 'jsonp',
                jsonp : "callback",
                jsonpCallback:"success_jsonpCallback",
                success:function(data){
                    console.log(data)
                }
            })
        }
       
        $scope.okDelete=function(){

        }

    }]);