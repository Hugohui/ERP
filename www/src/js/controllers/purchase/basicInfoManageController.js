'use strict';
mainStart
    .controller('basicInfoManageController',['$scope','$rootScope','$localStorage','toastr',function($scope,$rootScope,$localStorage,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //清除已有的验证提示信息
        $('#basicInfoManage [valType]').hideValidate();
        //初始化验证
        $.fn.InitValidator('basicInfoManage');


        //初始化物料信息列表
        initMaterialInfoTable();
        var materialInfoTable;
        function initMaterialInfoTable() {
            if(materialInfoTable){
                materialInfoTable.ajax.reload();
            }else{
                //初始化表格
                materialInfoTable = $("#materialInfoTable").dataTable({
                    language: lang,  //提示信息
                    autoWidth: true,  //禁用自动调整列宽
                    scrollY: 300,
                    lengthMenu: [20, 40, 60], //更改显示记录数选项
                    bLengthChange:false,
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
                        var param = {};
                        param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                        param.start = data.start;//开始的记录序号
                        param.page = (data.start / data.length) + 1;//当前页码
                        //ajax请求数据
                        $.ajax({
                            type: 'POST',
                            url: 'http://111.204.101.170:11115',
                            data:{
                                action:"getMaterialInfo",
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
                            "data": "material_name"
                        },
                        {
                            "data": "material_code"
                        },
                        {
                            "data": "model"
                        },
                        {
                            "data": "unit"
                        },
                        {
                            "data": "manufactor"
                        },
                        {
                            "data": "description"
                        },
                        {
                            "data": "status",
                            "render":function(data){
                                return '<s class="btn btn-default btn-xs editMaterialInfo">修改</s> <s class="btn btn-default btn-xs deleteMaterialInfo">删除</s>'
                            }
                        }
                    ]
                }).api();
            }
        }

        //添加物料
        $scope.addMaterialInfo = function(){

            var action;
            if($('.ajaxSendBtn').html() == '添加'){
                action = "addMaterialInfo"
            }else{
                action = "updateMaterialInfo"
            }

            //提交前验证
            var isValidate = beforeSubmit("materialInput");
            if(!isValidate){
                return;
            }
            var materialInfo = {
                material_name:$('.material_name').val(),
                material_code:$('.material_code').val(),
                model:$('.model').val(),
                unit:$('.unit').val(),
                manufactor:$('.manufactor').val(),
                description:$('.description').val()
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data:{
                    action:action,
                    params:materialInfo
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        toastr.success('操作成功！');
                        $('.ajaxSendBtn').html('添加');
                        materialInfoTable.ajax.reload();
                        $('#materialInput input').val('');
                    }else{
                        toastr.error('物料编码【'+data.resData.material_code+'】重复！',data.resData.msg);
                    }
                }
            });
        }

        //展开收起
        $scope.expandOrPackUp = function(e){
            var $this = $(e.target) ;
            //清除已有的验证提示信息
            $('#basicInfoManage [valType]').hideValidate();
            if($this.html() == '展开'){
                $('.expand').html('展开');
                $('.panelMain').removeClass('active');
                $this.html('收起');
                $this.closest('.panel').find('.panelMain').addClass('active');
            }else{
                $this.html('展开');
                $this.closest('.panel').find('.panelMain').removeClass('active');
            }
        }

        //删除物料信息
        $(document).on('click','.deleteMaterialInfo',function(){
            //清除已有的验证提示信息
            $('#basicInfoManage [valType]').hideValidate();
            $('#deleteModal').modal('show');
            var tr = $(this).closest('tr');
            var row = materialInfoTable.row(tr);
            $('#deleteKey').val(row.data().material_code);
        });
        $scope.deleteMaterialInfo = function(){
            var deleteKey = $('#deleteKey').val();
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data:{
                    action:"deleteMaterialInfo",
                    params:{
                        material_code:deleteKey
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        toastr.success('删除成功！');
                        $('#deleteModal').modal('hide');
                        materialInfoTable.ajax.reload();
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            });
        }

        //修改物料信息
        $(document).on('click','.editMaterialInfo',function(){
            var tr = $(this).closest('tr');
            var row = materialInfoTable.row(tr);
            $('.material_name').val(row.data().material_name);
            $('.material_code').val(row.data().material_code);
            $('.model').val(row.data().model);
            $('.unit').val(row.data().unit);
            $('.manufactor').val(row.data().manufactor);
            $('.description').val(row.data().description);
            $('.ajaxSendBtn').html('保存');
        });

        /*//清除已有的验证提示信息
        $('#basicInfoManage [valType]').hideValidate();
        //初始化验证
        $.fn.InitValidator('basicInfoManage');*/


    }]);
