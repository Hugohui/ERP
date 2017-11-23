'use strict';
mainStart
    .controller('depotRequestController', ['$scope', '$rootScope', '$localStorage', '$compile','toastr', function ($scope, $rootScope, $localStorage, $compile,toastr) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //获取项目号
        $.ajax({
            type: 'POST',
            url: 'http://111.204.101.170:11115',
            data: {
                action:'queryProjectNum'
            },
            dataType: 'jsonp',
            jsonp: "callback",
            success: function (data) {
                if(data.resData.result == 0){
                    $scope.projectNumArr = data.resData.projectNum;
                    $('.projectNumDiv').autocomplete({
                        hints: $scope.projectNumArr,
                        width: "100%",
                        height: 27,
                        showButton:false,
                        placeholder:'',
                        onSubmit: function(text){
                            console.log($(this));
                        }
                    });
                    $('.projectNumDiv input').attr('valType',' ');
                    $('.projectNumDiv input').attr('msg','项目号不能为空');
                    //初始化验证
                    //清除已有的验证提示信息
                    $('#purchaseReqForm [valType]').hideValidate();
                    $.fn.InitValidator('purchaseReqForm');
                }
            }
        })

        //初始化验证
        //清除已有的验证提示信息
        $('#inputInfoModal [valType]').hideValidate();
        $.fn.InitValidator('inputInfoModal');

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

        //给库管添加物料录入按钮
        if($scope.roles.role_id == 4){
            var btnStr = '<div class="handleDepotDiv">' +
                '                    <button class="btn btn-success btn-sm" ng-click="inputInfo()"><i class="fa fa-plus"></i> 录入物料信息</button>' +
                '                </div>';
            var $btnStr = $compile(btnStr)($scope);
            $('.dataTables_wrapper').append($btnStr);
        }

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
            //清除已有的验证提示信息
            $('#inputInfoModal [valType]').hideValidate();

            //加载物料基础信息
            loadMaterial();

            $('#chsseAddMaterialModal').modal('show');
        }

        //删除物料行
        $scope.deleteMaterialLine = function (e) {
            //移除行
            $(e.target).closest('.materialListDiv').remove();
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

        //选择物料添加到列表
        $scope.selectMaterial = function(e){
            var flag = false;
            var material_code = $(e.target).attr('material_code'),
                material_name = $(e.target).attr('material_name'),
                model = $(e.target).attr('model'),
                manufactor = $(e.target).attr('manufactor'),
                unit = $(e.target).attr('unit'),
                description = $(e.target).attr('description');
            var lineHtml =
                '                            <div class="materialListDiv clearfix">'+
                '                                <span class="deleteMaterial" ng-click="deleteMaterialLine($event)">×</span>'+
                '                                <div>'+
                '                                    <input type="text" class="material_code" readonly value="'+material_code+'"/>'+
                '                                </div>'+
                '                                <div>'+
                '                                    <input type="text" class="material_name" readonly value="'+material_name+'"/>'+
                '                                </div>'+
                '                                <div><input type="text" class="model" readonly value="'+model+'"/></div>'+
                '                                <div><input type="text" class="sn_num" name="sn_num" placeholder="用英文“,”隔开"/></div>'+
                '                                <div class="projectNumDiv"></div>'+
                '                                <div><input type="text" class="supplier_num" name="supplier_num"/></div>'+
                '                                <div><input type="text" class="supplier" name="supplier"/></div>'+
                '                                <div><input type="text" class="unit" readonly value="'+unit+'"/></div>'+
                '                                <div><input type="text" class="stock_number" name="stock_number" valType msg="数量不能为空"/></div>'+
                '                                <div><input type="text" class="unit_price" name="unit_price"/></div>'+
                '                                <div><input type="text" class="brand" name="brand"/></div>'+
                '                                <div><input type="text" class="manufactor" readonly value="'+manufactor+'"/></div>'+
                '                                <div><input type="text" class="stock_position" name="stock_position" valType msg="库存位置不能为空"/></div>'+
                '                            </div>';;

            $.each($('.material_code'),function(index,value){
                if($(value).val() == material_code){
                    toastr.warning('已选择该物料');
                    flag = true;
                    return;
                }
            });
            if(flag){
                return;
            }
            var $lineHtml = $compile(lineHtml)($scope);
            $('.addMaterialListDiv').before($lineHtml);

            $('#chsseAddMaterialModal').modal('hide');

            //清除已有的验证提示信息
            $('#inputInfoModal [valType]').hideValidate();
            $.fn.InitValidator('inputInfoModal');

            $('.projectNumDiv').autocomplete({
                hints: $scope.projectNumArr,
                width: "100%",
                height: 27,
                showButton:false,
                placeholder:'',
                onSubmit: function(text){
                }
            });

            $('.projectNumDiv input').attr('valType',' ');
            $('.projectNumDiv input').attr('msg','项目号不能为空');
            $('.projectNumDiv input').attr('value','public');

            //清除已有的验证提示信息
            $('#inputInfoModal [valType]').hideValidate();
            //初始化验证
            $.fn.InitValidator('inputInfoModal');
        }

        //清空查询内容
        $('#chsseAddMaterialModal').on('hidden.bs.modal',function(){
            $('#queryInput').val('');
        })

        //清除验证
        $('#inputInfoModal').on('hidden.bs.modal',function(){
            $('#inputInfoModal [valType]').hideValidate();
        })

        //敲击回车查询
        $('body').bind('keypress', function (event) {
            if (event.keyCode == "13") {
                $(".search").click();
            }
        })

        //确认录入
        $scope.inputOk = function () {
            if ($('.materialListDiv').length == 0) {
                toastr.warning('请添加物料！');
                return;
            }

            var isValidate = beforeSubmit("inputInfoModal");
            if(!isValidate){
                return;
            }

            var flag = false;

            $scope.materialListArr = [];
            angular.forEach($('.materialListDiv'),function(data){
                var sn_num = $(data).find('.sn_num').val();
                if(sn_num.split('，').length>1){
                    toastr.warning('sn号【'+sn_num+'】不符合规范');
                    flag = true;
                    return;
                }
                $scope.materialListArr.push(
                    {
                        material_code: $.trim($(data).find('.material_code').val()),
                        material_name:$.trim($(data).find('.material_name').val()),
                        model:$.trim($(data).find('.model').val()),
                        sn_num:$.trim($(data).find('.sn_num').val()),
                        project_num:$.trim($(data).find('.projectNumDiv input').val()),
                        supplier_num:$.trim($(data).find('.supplier_num').val()),
                        supplier:$.trim($(data).find('.supplier').val()),
                        unit:$.trim($(data).find('.unit').val()),
                        stock_number:$.trim($(data).find('.stock_number').val()),
                        unit_price:$.trim($(data).find('.unit_price').val()),
                        brand:$.trim($(data).find('.brand').val()),
                        manufactor:$.trim($(data).find('.manufactor').val()),
                        stock_position:$.trim($(data).find('.stock_position').val())
                    }
                );
            });

            if(flag){
                return;
            }

            $scope.submitData = {
                action: "addMaterial",
                params: {
                    materialList:$scope.materialListArr
                }
            };
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.submitData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        toastr.success('录入成功！');
                        $('#inputInfoModal').modal('hide');
                        $('#inputInfoModal .materialListDiv').remove();
                        depotRequestTable.ajax.reload();
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            });
        }
    }]);
