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
                console.log(data);
            }
        })

        /*添加用户信息、修改用户信息*/
        $scope.okAddAndUpdata=function(){
           //添加用户
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
            //修改用户
            $scope.data = {
                action:'updateUser',
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
        };

        //修改用户
        $("#update").click(function(){
            var  tr = $("#userTable").find("input:checked").parent().parent();
            $scope.userInfo.userName = tr.find('td').eq(2).text();
            $scope.userInfo.password = tr.find('td').eq(3).text();
            $scope.userInfo.phone = tr.find('td').eq(4).text();
            $scope.userInfo.department = tr.find('td').eq(5).text();
            $scope.userInfo.access = tr.find('td').eq(6).text();
            $scope.userInfo.contract_number = true;



        })



        /*用户列表复选框*/
        $scope.selectAll=false;
        $scope.selectAllClick= function (sa) {
            for(var i=0;i<$scope.usersList.length;i++){
                $scope.usersList[i].checked=sa;
            }
        };

        //删除选择用户
         $scope.deleteStu= function (){
         //获取勾选行信息
         var userArr = [];
         $("#userTable").find("tr").each(function($index, value){
             if($(this).find('input').is(':checked')){
                 var userName=$(this).find("td.userName").html();
                 userArr.push(userName);
             }else{

             }
         })


         console.log(userArr);

         $scope.data = {
             action:'deleteUser',
             params:{
                 userNameArr:userArr
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

             }
         })

     };
        //按钮的显示与隐藏


    }]);