'use strict';
mainStart
    .controller('depotRequestController', ['$scope', '$rootScope', '$localStorage', '$compile', function ($scope, $rootScope, $localStorage, $compile) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //获取库存列表
        initDepotRequestTable();
        /**
         * 采购入库列表
         */
        var depotRequestTable;

        function initDepotRequestTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;
            //初始化表格
            depotRequestTable = $("#depotRequestTable").dataTable({
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
                    var queryData = $('#material_code').val() == '' ? null : {
                        material_code: $('#material_code').val()
                    };
                    var param = {};
                    param.limit = data.length;
                    param.start = data.start;
                    param.page = (data.start / data.length) + 1;
                    param.applicant = $scope.user.name;
                    param.queryData = queryData;
                    $.ajax({
                        type: 'POST',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "depotRequest",
                            params: param
                        },
                        dataType: 'jsonp',
                        jsonp: "callback",
                        success: function (result) {
                            var returnData = {};
                            returnData.draw = data.draw;
                            returnData.recordsTotal = result.resData.total;
                            returnData.recordsFiltered = result.resData.total;
                            returnData.data = result.resData.data;
                            callback(returnData);
                        }
                    });
                },
                columns: [
                    {
                        "data": "material_code",
                        "sClass": "text-center",
                    },
                    {
                        "data": "material_name",
                        "sClass": "text-center"
                    },
                    {
                        "data": "model",
                        "sClass": "text-center"
                    },
                    {
                        "data": "sn_num",
                        "sClass": "text-center"
                    },
                    {
                        "data": "project_num",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "unit",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "stock_number",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "batch",
                        "sClass": "text-center"
                    },
                    {
                        "data": "brand",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "manufactor",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "unit_price",
                        "sClass": "text-center"
                    }
                    ,
                    {
                        "data": "stock_position",
                        "sClass": "text-center"
                    }/*,
                     {
                     "data": "applicant",
                     "sClass": "text-center"
                     },
                     {
                     "data": "applicant",
                     "sClass": "text-center"
                     }*/
                ]
            }).api();
        }

        //给采购添加物料录入按钮
        /*if($scope.roles.role_id == 5){
            var btnStr = '<div class="handleDepotDiv">' +
                '                    <button class="btn btn-success btn-sm" ng-click="inputInfo()"><i class="fa fa-plus"></i> 录入物料信息</button>' +
                '                </div>';
            var $btnStr = $compile(btnStr)($scope);
            $('.dataTables_wrapper').append($btnStr);
        }*/

        //条件查询
        $scope.searchDeport = function () {
            depotRequestTable.ajax.reload();
        }

        //录入物料信息
        $scope.inputInfo = function () {
            $('#inputInfoModal').modal('show');
        }

        //添加物料行
        $scope.addMaterialLine = function (e) {
            var html =
'                            <div class="materialListDiv clearfix">'+
'                                <span class="deleteMaterial" ng-click="deleteMaterialLine($event)">×</span>'+
'                                <div>'+
'                                    <input type="text" class="material_name" name="materialName" valType msg="请输入名称"/>'+
'                                </div>'+
'                                <div>'+
'                                    <input type="text" class="material_name" name="materialName" valType msg="请输入名称"/>'+
'                                </div>'+
'                                <div><input type="text" class="model" name="model" valType msg="型号不能为空"/></div>'+
'                                <div><input type="text" class="sn_num" name="sn_num"/></div>'+
'                                <div><input type="text" class="project_num" name="project_num"/></div>'+
'                                <div><input type="text" class="unit" name="unit"/></div>'+
'                                <div><input type="text" class="" name="name"/></div>'+
'                                <div><input type="text" class="" name="name"/></div>'+
'                                <div><input type="text" class="" name="name"/></div>'+
'                                <div><input type="text" class="remark" name="name"/></div>'+
'                            </div>';
            var $html = $compile(html)($scope);
            $('.addMaterialListDiv').before($html);
        }

        //删除物料行
        $scope.deleteMaterialLine = function (e) {
            //移除行
            $(e.target).closest('.materialListDiv').remove();
        }

        //确认录入
        $scope.inputOk = function () {

        }
    }]);
