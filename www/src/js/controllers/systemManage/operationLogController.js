'use strict';
mainStart
    .controller('operationLogController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;



        //��ȡ������־
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