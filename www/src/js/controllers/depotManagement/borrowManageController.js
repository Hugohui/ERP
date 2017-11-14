'use strict';
mainStart
    .controller('borrowManageController',['$scope','$rootScope','$localStorage', 'toastr','$compile',function($scope,$rootScope,$localStorage, toastr,$compile){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //获取借还信息列表
        initBorrowManageTable();

        /**
         * 采购入库列表
         */
        var borrowManageTable;

        function initBorrowManageTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 100;

            //初始化表格
            borrowManageTable = $("#borrowManageTable").dataTable({
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
                    var queryData = $('.placeholderOrderNum').val() == ''&&$('.selectCss').val()==-1?null:{
                        queryInput:$('.placeholderOrderNum').val()==''?null:$('.placeholderOrderNum').val(),
                        status:$('.selectCss').val()==-1?null:$('.selectCss').val()
                    }
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
                            action: "depotInputList",
                            params: param
                        },
                        //dataType:'json',
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
                            //未收料和部分收料的显示选择框
                            var inputStr ='<input class="topCheckInput" type="checkbox"/>';
                            //var inputStr = data.orderStatus == 0 ||  data.orderStatus == 2?'<input class="topCheckInput" type="checkbox"/>':'';
                            var html = '<s class="fa fa-plus-square details-control" materialList = "' + data.materialList + '"></s>'+inputStr;
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
                        "sClass": "text-center purchase_order_id"
                    },
                    {
                        "data": "contract_num",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "orderStatus",
                        "sClass": "text-center",
                        "render":function(data){
                            var statusStr = {
                                0:'待收料',
                                1:'已收料',
                                2:'部分收料'
                            }
                            return statusStr[data];
                        }
                    }
                ]
            }).api();
            var btnStr = '<div class="handleBorrowDiv">'+
                '                    <button class="btn btn-success btn-sm" ng-click="borrow()"><span class="fa fa-plus"></span> 借用</button>'+
                '                    <button class="btn btn-warning btn-sm" ng-click="return()"><span class="fa fa-history"></span> 归还</button>'+
                '                </div>';
            var $btnStr = $compile(btnStr)($scope);
            $('.dataTables_wrapper').append($btnStr);
        }

        //借用
        $scope.borrow = function(){
            //加载物料基础信息
            loadMaterial();
            $('#borrowModal').modal('show');
        }

        //物料查询
        $scope.searchMaterial = function(){
            var queryData = $('#queryInput').val();
            loadMaterial(queryData);
        }

        /**
         * 加载物料数据
         * @param queryData 搜索参数
         */
        function loadMaterial(query){
            $('.selectCheckUl').empty();
            $('.modalLoading').show();
            var queryData;
            if(query == undefined || query == ''){
                queryData = {};
            }else {
                queryData = {
                    material_name:query
                }
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"loadMaterialList",
                    params:{
                        queryData:queryData
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: renderMaterialUl
            });
        }
        //渲染物料列表ul
        function renderMaterialUl(data){
            if(data.resData.result == 0){
                $('.modalLoading').hide();
                if(data.resData.data){
                    var html = '';
                    $.each(data.resData.data,function(index,value){
                        html+=
                            '<li class="selectLi" ng-click="selectMaterial($event)" material_code="'+value.material_code+'" material_name="'+value.material_name+'" model="'+value.model+'" manufactor="'+value.manufactor+'" unit="'+value.unit+'" description="'+value.description+'">'+
                            '                        【<span class="selectName">'+value.material_code+'</span>】 '+value.material_name+'--'+value.model+'--'+value.manufactor+
                            '                        </li>';
                    });
                    var $html = $compile(html)($scope);
                    $('.selectCheckUl').append($html);
                }else{
                    $('.selectCheckUl').append('<span class="noData">数据为空</span>');
                }
            }
        }

        //选择物料
        $scope.selectMaterial = function(e) {
            var material_code = $(e.target).attr('material_code'),
                material_name = $(e.target).attr('material_name'),
                model = $(e.target).attr('model'),
                manufactor = $(e.target).attr('manufactor'),
                unit = $(e.target).attr('unit'),
                description = $(e.target).attr('description');
            /*$('.material_code').html(material_code);
            $('.material_name').html(material_name);
            $('.model').html(model);
            $('.number').html(number);
            $('.sn_num').html(sn_num);
            $('.material_code').html(material_code);*/
            $('#borrowInfoModal').modal('show');
        }

        //清空查询内容
        $('#borrowModal').on('hidden.bs.modal',function(){
            $('#queryInput').val('');
        })

        //敲击回车查询
        $('body').bind('keypress', function (event) {
            if (event.keyCode == "13") {
                $(".search").click();
            }
        })

        /*归还*/
        $scope.return = function(){
            $('#returnInfoModal').modal('show');
        }

        /*选择sn号*/
        $('.selectSn').click(function(){
            $('#selectSnNumModal').modal('show');
        });
    }]);
