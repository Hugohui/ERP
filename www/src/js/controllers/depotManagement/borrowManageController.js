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

        //验证
        $.fn.InitValidator('borrowInfoModal');
        $('#borrowInfoModal [valType]').hideValidate();
        $.fn.InitValidator('returnInfoModal');
        $('#returnInfoModal [valType]').hideValidate();

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
                    param.queryData = queryData;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        //url:'data/users.txt',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "getBorrowList",
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
                        "data": "material_code",
                        "sClass": "text-center"
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
                        "data": "selectedSn",
                        "sClass": "text-center"
                    },
                    {
                        "data": "number",
                        "sClass": "text-center"
                    },
                    {
                        "data": "borrowDate",
                        "sClass": "text-center",
                        "render":function(data){
                            return data.split(' ')[0];
                        }
                    },
                    {
                        "data": "planReturnDate",
                        "sClass": "text-center",
                        "render":function(data){
                            return data.split(' ')[0];
                        }
                    },
                    {
                        "data": "actualReturnDate",
                        "sClass": "text-center",
                        "render":function(data){
                            return data!=null?data.split(' ')[0]:'--';
                        }
                    },
                    {
                        "data": "borrowPeople",
                        "sClass": "text-center"
                    },
                    {
                        "data": "status",
                        "sClass": "text-center",
                        "render":function(data){
                            var statusStr = {
                                0:'借出',
                                1:'已归还'
                            }
                            return statusStr[data];
                        }
                    },
                    {
                        "data": null,
                        "sClass": "text-center",
                        "render": function (data) {
                            var inputStr =data.status == 0?'<span class="returnMaterialBtn btn btn-default btn-xs" borrow_material_id="'+data.borrow_material_id+'">归还</span>':'';
                            return inputStr;
                        },
                    }
                ]
            }).api();
            var btnStr = '<div class="handleBorrowDiv">'+
                '                    <button class="btn btn-success btn-sm" ng-click="borrow()"><span class="fa fa-plus"></span> 新增</button>'+
                //'                    <button class="btn btn-warning btn-sm" ng-click="return()"><span class="fa fa-history"></span> 归还</button>'+
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
                    action:"getDepotMaterialList",
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
                            '<li class="selectLi" ng-click="selectMaterial($event)" borrow_material_id="'+value.borrow_material_id+'" material_code="'+value.material_code+'" material_name="'+value.material_name+'" model="'+value.model+'" manufactor="'+value.manufactor+'" sn_num="'+value.sn_num+'" stock_number="'+value.stock_number+'">'+
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
                borrow_material_id = $(e.target).attr('borrow_material_id'),
                material_name = $(e.target).attr('material_name'),
                sn_num = $(e.target).attr('sn_num'),
                stock_number = $(e.target).attr('stock_number'),
                model = $(e.target).attr('model');

            if(sn_num == '无'||sn_num == ''){
                $('.selectSn').hide();
                $('.noSn_num').show();
            }else{
                $('.selectSn').show().attr('snNum',sn_num);
                $('.noSn_num').hide();
            }

            $('.number').attr('max',Number(stock_number))

            $('.material_code').html(material_code);
            $('#borrow_material_id').val(borrow_material_id);
            $('.material_name').html(material_name);
            $('.model').html(model);

            $('.borrowInfoUl li input').val('');
            $('.borrowInfoUl li input.borrow_number').val(1);
            $('.selectSn').html('选择').attr('selectedstr','');
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

        var selectedSnArr;
        /*选择sn号*/
        $('.selectSn').click(function(){
            selectedSnArr = [];

            if($('.borrow_number').val() == ''){
                toastr.warning('请先选择填写数量');
                return;
            }

            $('#borrowInfoModal [valType]').hideValidate();

            var snNumArr = $(this).attr('snNum').split(',');
            var borrow_number = $('.borrow_number').val();
            $('.snCheckbox').empty();
            var html = '';
            $.each(snNumArr,function(index,value){
                html+='<label><input type="checkbox"/> <span>'+value+'</span></label>';
            });
            $('.snCheckbox').append(html);
            if($(this).html() == '修改选择'){
                var selectedStrArr = $(this).attr('selectedstr').split(',');
                $.each($('.snCheckbox input'),function(index,value){
                    if($(value).next().html() == selectedStrArr[index]){
                        $(value).attr('checked',true);
                    }
                });
                $('.snCheckbox input').not(':checked').attr('disabled',true);
            }

            $('#selectSnNumModal').modal('show');
        });

        $('.snCheckbox').on('change','input',function(){
            if($(this).is(':checked')){
                if(selectedSnArr.length<$('.borrow_number').val()){
                    selectedSnArr.push($(this).next().html());
                    if(selectedSnArr.length==$('.borrow_number').val()){//当选中数量和申请数量相等时，将剩余选择框禁用
                        $('.snCheckbox label>input:not(:checked)').attr('disabled',true);
                    }
                }
            }else{
                $('.snCheckbox label>input:not(:checked)').removeAttr('disabled');//移除禁用的选择框
                selectedSnArr.splice(selectedSnArr.indexOf($(this).next().html()),1);
            }
        });

        //确定选择sn号
        $scope.selectOk = function(){
            if(selectedSnArr.length == 0){
                toastr.warning('请选择sn号');
            }else{
                var selectedStr = selectedSnArr.join(',');
                $('.selectSn').attr('selectedStr',selectedStr).html('修改选择');
                $('#selectSnNumModal').modal('hide');
            }
        }

        //确定提交借用
        $scope.borrowOk = function(){
            //判断是否选择sn号
            if($('.selectSn').is(':visible') && ($('.selectSn').html() == '选择')){
                toastr.warning('请选择sn号');
                return;
            }

            //验证
            var isValidate = beforeSubmit("borrowInfoModal");
            if(!isValidate){
                return;
            }

            //提交物料数据
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"commitBorrowMaterial",
                    params:{
                        borrow_material_id:$('#borrow_material_id').val(),
                        material_code:$('.material_code').html(),
                        material_name:$('.material_name').html(),
                        model:$('.model').html(),
                        number:$('.number').val(),
                        selectedSn:$('.selectSn').attr('selectedStr'),
                        borrowPeople:$('#borrowPeople').val(),
                        borrowDate:$('#borrowDate').val(),
                        planReturnDate:$('#planReturnDate').val()
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function(data){
                    if(data.resData.result == 0){
                        toastr.success(data.resData.msg);
                        borrowManageTable.ajax.reload();
                        $('#borrowInfoModal').modal('hide');
                        $('#borrowModal').modal('hide');
                    }
                }
            });
        }

        /*归还*/
        $(document).on('click','.returnMaterialBtn',function(){
            var tr = $(this).closest('tr');
            var row = borrowManageTable.row(tr);

            var　borrow_material_id = $(this).attr('borrow_material_id'),
                material_code = row.data().material_code,
                material_name = row.data().material_name,
                model = row.data().model,
                number = row.data().number,
                selectedSn = row.data().selectedSn,
                borrowDate = row.data().borrowDate.split(' ')[0],
                planReturnDate = row.data().planReturnDate.split(' ')[0],
                actualReturnDate = row.data().actualReturnDate == null?'':row.data().actualReturnDate.split(' ')[0],
                borrowPeople = row.data().borrowPeople;

            selectedSn == ''? $('.sn_num').html('--'):$('.sn_num').html(selectedSn);

            $('.material_code').html(material_code);
            $('#return_material_id').val(borrow_material_id);
            $('.material_name').html(material_name);
            $('.model').html(model);
            $('.number').html(number);
            $('.borrowDate').html(borrowDate);
            $('.planReturnDate').html(planReturnDate);
            $('.borrowPeople').html(borrowPeople);

            $('#returnInfoModal').modal('show');
        })
        $scope.returnOk = function(){
            //验证
            var isValidate = beforeSubmit("returnInfoModal");
            if(!isValidate){
                return;
            }

            //提交物料数据
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"returnMaterial",
                    params:{
                        borrow_material_id:$('#return_material_id').val(),
                        material_code:$('#returnInfoModal .material_code').html(),
                        material_name:$('#returnInfoModal .material_name').html(),
                        model:$('#returnInfoModal .model').html(),
                        number:$('#returnInfoModal .number').html(),
                        selectedSn:$('#returnInfoModal .sn_num').html(),
                        borrowPeople:$('#returnInfoModal .borrowPeople').html(),
                        borrowDate:$('#returnInfoModal .borrowDate').html(),
                        planReturnDate:$('#returnInfoModal .planReturnDate').html(),
                        actualReturnDate:$('#returnInfoModal .returnDate').val()
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function(data){
                    if(data.resData.result == 0){
                        toastr.success(data.resData.msg);
                        borrowManageTable.ajax.reload();
                        $('#returnInfoModal').modal('hide');
                    }
                }
            });
        }

        $('#borrowInfoModal').on('hide.bs.modal',function(){
            $('#borrowInfoModal [valType]').hideValidate();
        })
        $('#returnInfoModal').on('hide.bs.modal',function(){
            $('#returnInfoModal [valType]').hideValidate();
        })

    }]);
