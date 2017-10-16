'use strict';
mainStart
    .controller('pickGoodsCheckController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

        //初始化采购申请列表
        initPickGoodsTable();
        /**
         * 采购入库列表
         */
        var pickGoodsTable;

        function initPickGoodsTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;
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
            pickGoodsTable = $("#pickGoodsTable").dataTable({
                language: lang,  //提示信息
                autoWidth: true,  //禁用自动调整列宽
                scrollY: scrollY,
                lengthMenu: [20, 40, 60], //更改显示记录数选项
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
                        "targets": [0, 1, 2, 3, 4],
                        "orderable": false
                    }
                ],
                ajax: function (data, callback, settings) {
                    //封装请求参数
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    param.applicant = $scope.user.name;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        url:'data/users.txt',
                        //url: 'http://111.204.101.170:11115',
                        data: {
                            action: "depotInputList",
                            params: param
                        },
                        dataType:'json',
                        /*dataType: 'jsonp',
                         jsonp: "callback",*/
                        success: function (result) {
                            //封装返回数据
                            var returnData = {};
                            returnData.draw = data.draw;//这里直接自行返回了draw计数器,应该由后台返回
                            returnData.recordsTotal = result.total;//返回数据全部记录
                            returnData.recordsFiltered = result.total;//后台不实现过滤功能，每次查询均视作全部结果
                            returnData.data = result.data;//返回的数据列表
                            callback(returnData);
                        }
                    });
                },
                //列表表头字段
                columns: [
                    {
                        "data": "userName",
                        //"data": "purchase_applicant_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "userPwd",
                        //"data": "purchase_order_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "ht",
                        //"data": "contract_num",
                        "sClass": "text-center"
                    },
                    {
                        "data": "userRegisterTime",
                        //"data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": null,
                        //"data": "applicant",
                        "sClass": "text-center",
                        render:function(){
                            return '<span class="btn btn-default btn-sm">查看/打印</span>';
                        }
                    }
                ]
            }).api();
        }


    }]);
