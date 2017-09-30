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

        /*
        *用户列表
        */
        $.ajax({
            type:'POST',
            url:'http://111.204.101.170:11115',
            data:{
                action:"usersList",
                params:{
                    limit:"10",
                    start:"0",
                    page:"1",
                    queryData:""
                }
            },
            dataType: 'jsonp',
            jsonp : "callback",
            success:function(data){
              $scope.usersList=data.resData.data;
            }
        })
        /*用户列表复选框*/
        $scope.selectAll=false;
        $scope.selectAllClick= function (sa) {
            for(var i=0;i<$scope.usersList.length;i++){
                $scope.usersList[i].checked=sa;
            }
        };


        //删除选择用户
        $scope.deleteProduct= function (index){
            $scope.data = {
                action:'deleteUser',
                params:{
                    userName: $scope.userInfo.userName
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
                    $scope.echome=function(){
                        var worker=$("#userTable").find("tr");
                        var userNameArr=[];
                        worker.echo(function () {
                            var tds=$(this).find("td");
                            if(tds===true){
                                userName.push();
                            }
                        })
                    }
                }
            })

        };

        /*全部勾选*/
        /*$scope.selectAll=false;
        $scope.selectAllClick= function (sa) {
            for(var i=0;i<$scope.usersList.length;i++){
                $scope.usersList[i].checked=sa;
            }
        };*/


        $scope.selectAll=false;
        $scope.all= function (m) {
            for(var i=0;i<$scope.usersList.length;i++){
                if(m===true){
                    $scope.usersList[i].state=true;
                }else {
                    $scope.usersList[i].state=false;
                }
            }
        };


        /*添加用户信息、修改用户信息*/
        $scope.okAddAndUpdata=function(){
            $scope.data = {
                action:'addUser',
                params:{
                    userName: $scope.userInfo.userName,
                    password: $scope.userInfo.password,
                    phone:$scope.userInfo.phone,
                    access:$scope.userInfo.access,
                    department:$scope.userInfo.department,
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
    }]);