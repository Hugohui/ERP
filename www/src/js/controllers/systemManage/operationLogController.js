'use strict';
mainStart
    .controller('operationLogController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;



        //获取操作日志
        $.ajax({
            type:'POST',
            url:'http://111.204.101.170:11115',
            data:{
                action:"operationLog",
                params:{
                    queryData:""
                }
            },
            dataType: 'jsonp',
            jsonp : "callback",
            success:function(data){

                $scope.daysList=data.resData.data;
                console.log(data);
                $scope.$apply();
            }
        })
    }]);