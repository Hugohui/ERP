'use strict';
mainStart
    .controller('userManageController',['$scope','$rootScope','$localStorage','$http',function($scope,$rootScope,$localStorage,$http){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;
        //
        $scope.modelTitle="";
        $scope.okAdd=function(){
            $http({
                metnod:'POST',
                url:'111.204.101.170:11115',
                action:'addUser',
                params:{
                    userName: '',
                    password:'',
                    phone:'',
                    system_permissions:'',
                    group:'',
                    data_permissions:{
                        contract_number:'',
                        unit_price:'',
                        inventory_quantity:'',
                        money:'',
                        tax_rate:'',
                        invoice:'',
                        inventory_position:''
                    }
                }
            }).success(function(data,header,config,status){
                //响应成功

            }).error(function(data,header,config,status){
                //处理响应失败

            });
        }
        $scope.okDelete=function(){

        }

    }]);