'use strict';
mainStart
    .controller('purchaseHistoryController', ['$scope', '$rootScope', '$localStorage','toastr', function ($scope, $rootScope, $localStorage,toastr) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //加载采购历史数据
        initPurchaseHistoryTable();

        /**
         * 采购历史数据
         */
        var purchaseHistoryTable;

        function initPurchaseHistoryTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;

            //初始化表格
            purchaseHistoryTable = $("#purchaseHistoryTable").dataTable({
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
                        "targets": [0, 1, 2, 3],
                        "orderable": false
                    }
                ],
                ajax: function (data, callback, settings) {
                    //封装请求参数
                    var queryData = $('.startDate').val() == '' && $('.endDate').val() == '' && ($('.queryInput').val() == ''||$('.queryInput').val() == undefined) ? null : {
                        startDate: $('.startDate').val() == '' ? null : $('.startDate').val(),
                        endDate: $('.endDate').val() == '' ? null : $('.endDate').val(),
                        queryInput: $('.queryInput').val() == '' ||$('.queryInput').val() == undefined? null : $('.queryInput').val()
                    };
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    param.applicant = $scope.user.name;
                    param.queryData = queryData;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        //url:'data/users.txt',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "purchaseHistory",
                            params: param
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
                            var html = '<s class="fa fa-plus-square details-control" materialList = "' + data.materialList + '"></s>';
                            return html;
                        },
                        "width": 50
                    },
                    {
                        "data": "purchase_applicant_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "purchase_order_id",
                        "sClass": "text-center",
                        "render": function (data) {
                            return data ? data : '--';
                        }
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "status",
                        "sClass": "text-center",
                        "render":function(data){
                            var statusStr = {
                                "-1":"已撤销",
                                0:"待审批",
                                1:"已审批",
                                2:"待下单",
                                3:"已下单",
                                4:"待领料",
                                5:"已领料",
                                6:"已完成"
                            }
                            return statusStr[data];
                        }
                    }
                    /*{
                        "data":null,
                        "sClass":"text-center",
                        "render":function(data){
                            return '<i class="btn btn-default btn-sm cancleCGSQ" CGSQ="'+data.purchase_applicant_id+'">撤销</i>'
                        },
                        "width":160
                    }*/
                ]
            }).api();
        }

        $('#purchaseHistoryTable tbody').on('click', '.details-control', function () {
            var tr = $(this).closest('tr');
            var row = purchaseHistoryTable.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                $(this).removeClass('fa-minus-square  red').addClass('fa-plus-square');//按钮变化
                tr.removeClass('shown');
            } else {
                row.child(format(row.data())).show();
                tr.addClass('shown');
                $(this).removeClass('fa-plus-square').addClass('fa-minus-square red');
            }
        })

        function format(d) {
            var trStr = '';
            var statusStr = {
                "-1": "未通过",
                "1": "待审批",
                "2": "待下单",
                "3": "已下单",
                "4": "已到货",
                "5": "已领料"
            }
            $.each(d.materialList, function (index, value) {

                //到货日期
                var arrived_on = value.arrived_on ? value.arrived_on : '--';
                //货物状态
                var status = statusStr[value.status] ? statusStr[value.status] : '--';

                trStr += '<tr>' +
                    '<td>' + value.material_name + '</td>' +
                    '<td>' + value.model + '</td>' +
                    '<td>' + value.sn_num + '</td>' +
                    '<td>' + value.project_num + '</td>' +
                    '<td>' + value.number + '</td>' +
                    '<td>' + value.expected_date + '</td>' +
                    '<td>' + arrived_on + '</td>' +
                    '<td>' + status + '</td>' +
                    '</tr>';
            });
            return '<table cellpadding="5" cellspacing="0" border="0" width="100%" class="display table-bordered">' +
                '<tr>' +
                '<td>名称</td>' +
                '<td>型号</td>' +
                '<td>sn号</td>' +
                '<td>项目号</td>' +
                '<td>数量</td>' +
                '<td>申请日期</td>' +
                '<td>到货日期</td>' +
                '<td>状态</td>' +
                '</tr>' + trStr +
                '</table>';
        }

        //条件查询
        $scope.searchHistory = function () {
            purchaseHistoryTable.ajax.reload();
        }

        //撤销采购申请
        $('#purchaseHistoryTable tbody').on('click', '.cancleCGSQ', function () {
            $('#cancleCGSQModal').modal('show');
        })
        //确定撤销
        $scope.cancleOk = function(){
            //采购申请单号
            var purchase_applicant_id = $(this).attr('CGSQ');
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action: "cancleCGSQ",
                    params: {
                        purchase_applicant_id:purchase_applicant_id,
                        userName:$scope.user.name
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        //撤销成功提示
                        toastr.success('撤销成功！');
                        $('#cancleCGSQModal').modal('hide');
                    }
                }
            });
        }

    }]);
