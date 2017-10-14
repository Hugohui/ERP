'use strict';
mainStart
    .controller('infoMaintainController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;

        personUpdate();
        //获取用户信息
        function personUpdate(){
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getUserInfo",
                    params:{
                        userName:$scope.user.name
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    $scope.personsList=data.resData.data;
                    console.log(data);
                    $scope.$apply();
                }
            })
        }

        //修改密码
        $scope.personUpdate=function(){
            if("$(#newpwd1).val==$(#newpwd2).val"){
                $scope.data = {
                    action:'updateUserPassword',
                    params:{
                        userName:$scope.user.name,
                        oldPassword:$("#oldpwd").val(),
                        newPassword:$("#newpwd1").val()
                    }
                };
                $.ajax({
                    type:'POST',
                    url:'http://111.204.101.170:11115',
                    data:$scope.data,
                    dataType: 'jsonp',
                    jsonp : "callback",
                    jsonpCallback:"success_jsonpCallback",
                    success:function(data){
                        console.log(data);
                        personUpdate();
                    }
                })
            }else{
                    alert(222222)
            }

                }



    }]);
