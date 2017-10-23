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

        //获取表格分页
        initUsersTable();
        var userTable;
        function initUsersTable() {
            var scrollY = $('.mainView').height()-160;
            var lang = {
                "sProcessing": "处理中...",
                "sLengthMenu": "每页 _MENU_ 项",
                "sZeroRecords": "没有匹配结果",
                "sInfo": "当前显示第 _START_ 至 _END_ 项，共 _TOTAL_ 项。",
                "sInfoEmpty": "当前显示第 0 至 0 项，共 0 项",
                "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
                "sInfoPostFix": "",
                "sSearch": "搜索:",
                "sUrl": "",
                "sEmptyTable": "表中数据为空",
                "sLoadingRecords": "载入中...",
                "sInfoThousands": ",",
                "oPaginate": {
                    "sFirst": "首页",
                    "sPrevious": "上页",
                    "sNext": "下页",
                    "sLast": "末页",
                    "sJump": "跳转"
                },
                "oAria": {
                    "sSortAscending": ": 以升序排列此列",
                    "sSortDescending": ": 以降序排列此列"
                }
            };

            //初始化表格
            userTable = $("#userTable").dataTable({
                language: lang,  //提示信息
                autoWidth: true,  //禁用自动调整列宽
                scrollY: scrollY,
                lengthMenu : [20, 40, 60], //更改显示记录数选项
                stripeClasses: ["odd", "even"],  //为奇偶行加上样式，兼容不支持CSS伪类的场合
                processing: true,  //隐藏加载提示,自行处理
                serverSide: true,  //启用服务器端分页
                searching: false,  //禁用原生搜索
                orderMulti: false,  //启用多列排序
                order: [],  //取消默认排序查询,否则复选框一列会出现小箭头
                renderer: "Bootstrap",  //渲染样式：Bootstrap和jquery-ui
                pagingType: "full_numbers",  //分页样式：simple,simple_numbers,full,full_numbers
                columnDefs: [
                    {
                        "targets": [0, 1, 2, 3],
                        "orderable": false
                    }
                ],
                ajax: function (data, callback, settings) {
                    //封装请求参数
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        url:'http://111.204.101.170:11115',
                        data: {
                            action:"usersList",
                            params:param
                        },
                        dataType: 'jsonp',
                        jsonp: "callback",
                        success: function (result) {
                            //封装返回数据
                            var returnData = {};
                            returnData.draw = data.draw;//这里直接自行返回了draw计数器,应该由后台返回
                            returnData.recordsTotal = result.resData.total;//返回数据全部记录
                            returnData.recordsFiltered = result.resData.total;//后台不实现过滤功能，每次查询均视作全部结果
                            returnData.data = result.resData.data;//返回的数据列表
                            callback(returnData);
                        }
                    });
                },
                //列表表头字段
                columns: [
                    {
                        "data": null,
                        "sClass": "text-center",
                        "render": function (data) {
                            var html = '<input type="checkbox" class="checkboxID" ng-click="isSelected()" access="'+data.access+'" data_permissions="'+data.data_permissions+'">';
                            return html;
                        },
                        "width":50
                    },

                    {
                        "data": "userName",
                        "sClass": "text-center"

                    },
                    {
                        "data": "password",
                        "sClass": "text-center"
                    },
                    {
                        "data": "phone",
                        "sClass": "text-center"
                    },
                    {
                        "data": "department",
                        "sClass": "text-center"
                    }
                ]
            }).api();
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
                    console.log(data);
                    userTable.ajax.reload();
                    $(".modal-body input").val("");
                    $(".modal-body select").val("");
                    $('input:checkbox').removeAttr('checked');
                }
            })
        };

        //修改用户
        $("#updateBtn").click(function(){
            $('#userName').attr("disabled",true);
            $('#userName').css("background","white");
            var tr=$("input:checked").closest('tr');
            var row = userTable.row(tr);
            $scope.userInfo.userName = row.data().userName;
            $scope.userInfo.password = row.data().password;
            $scope.userInfo.phone = row.data().phone;
            $scope.userInfo.department = row.data().department;
            $scope.userInfo.access =row.data().access;
            $scope.userInfo.data_permissions = row.data().data_permissions;
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
                        userTable.ajax.reload();
                    }
                })
            }

        });

        //删除选择用户
        //获取勾选行信息
        var userArr = [];
        $('#userTable tbody').on('change', '.checkboxID', function () {
            var tr = $(this).closest('tr');
            var row = userTable.row(tr);
            if($(this).is(':checked')){
                console.log(row.data().userName);
                userArr.push(row.data().userName);
            }else{

            }
        });
         $scope.deleteStu= function (){
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
                 userTable.ajax.reload();
             }
         })

     };
        //关闭按钮

        //按钮的显示与隐藏
        $('#userTable tbody').on('change', '.checkboxID', function () {
            var arr = [];
            $('input[type="checkbox"]').each(function(i, v) {
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

        });
    }]);