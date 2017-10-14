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


        //获取用户列表

        update();
        //封装刷新页面的方法
        function update(){
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
                   $scope.$apply();
               }
           })
       }

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

            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:$scope.data,
                dataType: 'jsonp',
                jsonp : "callback",
                jsonpCallback:"success_jsonpCallback",
                success:function(data){
                    console.log(data);
                    update();
                }
            })

        };

        //修改用户
        $("#updateBtn").click(function(){
            $('#userName').attr("disabled",true);
            var tr = $("#userTable").find("input:checked").parent().parent();
            $scope.userInfo.userName = tr.find('td').eq(2).text();
            $scope.userInfo.password = tr.find('td').eq(3).text();
            $scope.userInfo.phone = tr.find('td').eq(4).text();
            $scope.userInfo.department = tr.find('td').eq(5).text();
            $scope.userInfo.access = tr.find('td input').attr("access");
            $scope.userInfo.data_permissions = $.parseJSON(tr.find('td input').attr("data_permissions"));
            $scope.okAddAndUpdata=function(){
                $scope.data = {
                    action:'updateUser',
                    params:{
                        userName: $scope.userInfo.userName,
                        password: $scope.userInfo.password,
                        phone:$scope.userInfo.phone,
                        access:$scope.userInfo.access,
                        department:$scope.userInfo.department,
                        data_permissions:{
                            contract_number: $("#inlineCheckbox1").is(':checked') ,
                            unit_price: $("#inlineCheckbox2").is(':checked'),
                            inventory_quantity: $("#inlineCheckbox3").is(':checked'),
                            money: $("#inlineCheckbox4").is(':checked'),
                            tax_rate: $("#inlineCheckbox5").is(':checked'),
                            invoice: $("#inlineCheckbox6").is(':checked'),
                            inventory_position: $("#inlineCheckbox7").is(':checked')
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
                        update();
                    }
                })
            }

        });


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
                 update();
             }
         })

     };


        //按钮的显示与隐藏
        $scope.isSelected=function(){
            var arr = []
            $('#userTable input[type="checkbox"]').each(function(i, v) {
                if($(v).is(':checked')) {
                    arr.push('')
                }
            });
            if(arr.length===1){
                $('#updateBtn').css('display','inline-block');

            }else{
                $('#updateBtn').css('display','none')
            }
            if(arr.length>0){
                $('#deleteBtn').css('display','inline-block')
            }else{
                $('#deleteBtn').css('display','none')
            }

            //$scope.isDeleteShow = arr.length > 0;
            //$scope.isUpdateShow = arr.length === 1;

        };

        //用户列表复选框
        $scope.selectAll=false;
        $scope.selectAllClick= function (sa) {
            for(var i=0;i<$scope.usersList.length;i++){
                $scope.usersList[i].checked=sa;
            }
        };

    }]);