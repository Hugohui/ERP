'use strict';
mainStart
    .controller('returnGoodsCheckController',['$scope','$rootScope','$localStorage','$compile','toastr',function($scope,$rootScope,$localStorage,$compile,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

        //初始化采购申请列表
        initReturnGoodsTable();
        /**
         * 采购入库列表
         */
        var pickGoodsTable;

        function initReturnGoodsTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 130;
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
                    param.userName = $scope.user.name;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "getPickGoodsList",
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
                        "data": "material_requisition_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant_date",
                        "sClass": "text-center"
                    },
                    {
                        "data": "status",
                        "sClass": "text-center",
                        "render":function(data){
                            var statusStr = {
                                0:"待审核",
                                1:"已审核"
                            }
                            return statusStr[data];
                        }
                    },
                    {
                        "data": null,
                        //"data": "applicant",
                        "sClass": "text-center",
                        render:function(data){
                            console.log();
                            if($scope.roles.role_id == 6||$scope.roles.role_id==3){
                                return '<span class="btn btn-default btn-sm viewPickPurchase" status="'+data.status+'" pickPurchaseOrder="'+data.material_requisition_id+'">查看/打印/审核</span>';
                            }else{
                                return '<span class="btn btn-default btn-sm viewPickPurchase" status="'+data.status+'" pickPurchaseOrder="'+data.material_requisition_id+'">查看/打印</span>';
                            }
                        }
                    }
                ]
            }).api();

            var btnStr = '<div class="addPickPurchaseDiv">'+
                '                    <button class="btn btn-success btn-sm" ng-click="addReturnGooodsPurchase()"><s class="fa fa-plus"></s> 新增退料申请</button>'+
                '                </div>';
            var $btnStr = $compile(btnStr)($scope);
            $('.dataTables_wrapper').append($btnStr);

        }

        var addPickPurchaseTable;
        /*新增领料申请*/
        $scope.addReturnGooodsPurchase = function(){
            //加载数据
            if(addPickPurchaseTable){
                addPickPurchaseTable.ajax.reload();
            }else{
                addPickPurchaseTable = $("#addPickPurchaseTable").dataTable({
                    language: lang,  //提示信息
                    autoWidth: true,  //禁用自动调整列宽
                    scrollY: 150,
                    processing: true,  //隐藏加载提示,自行处理
                    serverSide: true,  //启用服务器端分页
                    searching: false,  //禁用原生搜索
                    orderMulti: false,  //启用多列排序
                    order: [],  //取消默认排序查询,否则复选框一列会出现小箭头
                    renderer: "Bootstrap",  //渲染样式：Bootstrap和jquery-ui
                    bPaginate:false,
                    bInfo:false,
                    columnDefs: [
                        {
                            "targets": [1, 2, 3],
                            "orderable": false
                        }
                    ],
                    ajax: function (data, callback, settings) {
                        //封装请求参数
                        var param = {};
                        param.userName = $scope.user.name;
                        //ajax请求数据
                        $.ajax({
                            type: 'POST',
                            //url:'data/users.txt',
                            url: 'http://111.204.101.170:11115',
                            data: {
                                action: "loadPurchaseReqList",
                                params: param
                            },
                            //dataType:'json',
                            dataType: 'jsonp',
                            jsonp: "callback",
                            success: function (result) {
                                var returnData = {};
                                returnData.draw = data.draw;
                                returnData.data = result.resData.data;
                                callback(returnData);
                            }
                        });
                    },
                    columns: [
                        {
                            "data": null,
                            "sClass": "text-center",
                            render:function(data){
                                return '<s class="fa fa-plus-square details-control" materialList = "' + data.materialList + '"></s><input class="topCheckInput" type="checkbox"/>'
                            },
                            "width":50
                        },
                        {
                            "data": "purchase_applicant_id",
                            "sClass": "text-center",
                        },
                        {
                            "data": "purchase_order_id",
                            "sClass": "text-center"
                        }/*,
                        {
                            "data": "contract_num",
                            "sClass": "text-center"
                        }*/,
                        {
                            "data": "orderStatus",
                            "sClass": "text-center",
                            "render":function(data){
                                var orderStatusStr = {
                                    0:"未到货",
                                    1:"已到货",
                                    2:"部分到货"
                                };
                                return orderStatusStr[data];
                            }
                        }
                    ]
                }).api();
            }
            //模态框显示
            $('#addPickGooodsPurchaseModal').modal('show');
        }

        $('#addPickPurchaseTable').on('click', 'tbody .details-control', function () {
            var tr = $(this).closest('tr');
            var row = addPickPurchaseTable.row(tr);
            if (row.child.isShown()) {
                tr.data('stockPositionArr');
                row.child.hide();
                $(this).removeClass('fa-minus-square  red').addClass('fa-plus-square');//按钮变化
                tr.removeClass('shown');
            } else {
                row.child(format(row.data(),tr.data('stockPositionArr'),tr.data('inputCheckedArr'))).show();
                tr.addClass('shown');
                $(this).removeClass('fa-plus-square').addClass('fa-minus-square red');
            }
            //当前行input所对应的状态
            if ($(this).siblings('input').is(':checked')) {
                //子表格的状态
                tr.next().find('input.checkMaterial').prop('checked', true);
            }

            $.fn.InitValidator('addPickGooodsPurchaseModal');
            $('#addPickGooodsPurchaseModal [valType]').hideValidate();
        })

        function format(d,inputCheckedArr) {
            var inputCheckedArr = inputCheckedArr == undefined?[]:inputCheckedArr;
            var trStr = '';
            var materialStatusStr = {
                0:"未到货",
                1:"已到货",
            }
            $.each(d.materialList, function (index, value) {
                var inputStr = '';
                value.materialStatus == 1?(inputStr = inputCheckedArr.length != 0 && inputCheckedArr[index]?'<input type="checkbox" class="checkMaterial"  checked/>':'<input type="checkbox" class="checkMaterial"/>'):inputStr='<input type="checkbox" class="checkMaterial" style="display: none"/>';
                trStr += '<tr>' +
                    '<td>'+inputStr+'</td>' +
                    '<td class="material_code">' + value.material_code + '</td>' +
                    '<td class="material_name">' + value.material_name + '</td>' +
                    '<td class="model">' + value.model + '</td>' +
                    '<td class="sn_num">' + value.sn_num + '</td>' +
                    '<td class="project_num">' + value.project_num + '</td>' +
                    '<td class="unit">' + value.unit + '</td>' +
                    '<td><input class="number" valType="zNum" msg="" type="number" min="1" max="'+value.number+'" value="'+value.number+'"/></td>' +
                    '<td>' + materialStatusStr[value.materialStatus]+ '</td>' +
                    '<td class="remark">' + value.remark + '</td>' +
                    '</tr>';
            });
            return '<table cellpadding="5" cellspacing="0" border="0" width="100%" class="display table-bordered sonTable">' +
                '<tr class="trHead">' +
                '<td></td>' +
                '<td>物料编码</td>' +
                '<td>名称</td>' +
                '<td>型号</td>' +
                '<td>sn号</td>' +
                '<td>项目号</td>' +
                '<td>单位</td>' +
                '<td>数量</td>' +
                '<td>状态</td>' +
                '<td>备注</td>' +
                '</tr>' + trStr +
                '</table>';
        }
        //父表格中的选择
        $('#addPickPurchaseTable').on('change', 'tbody .topCheckInput', function () {
            var tr = $(this).closest('tr');
            var row = addPickPurchaseTable.row(tr);
            if ($(this).is(':checked')) {
                if (!row.child.isShown()) {
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                    $(this).siblings('s').removeClass('fa-plus-square').addClass('fa-minus-square red');
                }
                //全选子行
                tr.next().find('.checkMaterial').prop('checked', true);
                tr.next().find('.number').attr('valType','zNum');
                $(this).siblings('s').hide();
            } else {
                //子行取消全选
                tr.next().find('.checkMaterial').prop('checked', false);
                tr.next().find('.number').removeAttr('valType','zNum');
                $(this).siblings('s').show();

                //更新选中状态
                var inputCheckedArr = [];
                $.each(tr.next().find('.checkMaterial'),function(){
                    inputCheckedArr.push(false);
                })
                tr.data('inputCheckedArr',inputCheckedArr);
            }

            $.fn.InitValidator('addPickGooodsPurchaseModal');
            $('#addPickGooodsPurchaseModal [valType]').hideValidate();
        })
        //子表格中的选择
        $(document).on('change', 'table.sonTable tbody .checkMaterial', function () {
            var tr = $(this).closest('table').closest('tr');
            var sonTrs = $(this).closest('table').find('tr:not(:first-child)');
            if ($(this).is(':checked')) {
                $(this).closest('tr').find('.number').attr('valType','zNum');
                //判断子表格未选中项的个数，个数为0，则全选的按钮被选中
                if ($(this).closest('table').find('.checkMaterial:not(:checked)').length == 0) {
                    //选中全选按钮
                    tr.prev().find('.topCheckInput').prop('checked', true);
                    tr.prev().find('.topCheckInput').siblings('s').hide();
                }
            } else {
                $(this).closest('tr').find('.number').removeAttr('valType','zNum');
                //取消全选按钮
                tr.prev().find('.topCheckInput').prop('checked', false);
                if($(this).closest('table').find('.checkMaterial:checked').length == 0){
                    tr.prev().find('.topCheckInput').siblings('s').show();
                }
            }
            //给父级表格保存选中情况
            var inputCheckedArr = [];
            $.each(sonTrs,function(index,value){
                inputCheckedArr.push($(value).find('input.checkMaterial').prop("checked"));
            });
            tr.prev().data('inputCheckedArr',inputCheckedArr);

            $.fn.InitValidator('addPickGooodsPurchaseModal');
            $('#addPickGooodsPurchaseModal [valType]').hideValidate();
        })

        //审批人
        $scope.checkGroupLeader = function ($event) {
            $scope.choseCheckPeopleTitle = "选择室组经理";
            $scope.ajaxData = {
                action: "getApprover",
                params: "group_leader"
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    $scope.appendCheckPeopleHtmlModal(data.resData.data);
                }
            })
        }
        $scope.checkMinister = function ($event) {
            $scope.choseCheckPeopleTitle = "选择室部长";
            $scope.ajaxData = {
                action: "getApprover",
                params: "department"
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    $scope.appendCheckPeopleHtmlModal(data.resData.data);
                }
            })
        }
        //模态框添加查询数据列
        $scope.appendCheckPeopleHtmlModal = function(data){
            var html = '';
            $.each(data,function(index,val){
                html+=
                    '                           <li class="selectLi" ng-click="selectPurchaseName($event)">'+
                    '                            【<span class="selectName">'+val.userName+'</span>】 '+val.department+
                    '                           </li>';
            });
            var $html = $compile(html)($scope);
            $('.selectCheckUl').empty().append($html);
            $('#choseCheckPeopleModal').modal('show');
        }

        //选中审批人
        $scope.selectPurchaseName = function($event){
            if($scope.choseCheckPeopleTitle == "选择室组经理"){
                $('.groupLeaderName').show().html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.groupLeaderNameInp').val($($event.currentTarget).find('.selectName').html());
            }else if($scope.choseCheckPeopleTitle == "选择室部长"){
                $('.departmentName').show().html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.departmentNameInp').val($($event.currentTarget).find('.selectName').html());
            }else{
                $('.managerName').html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.managerNameInp').val($($event.currentTarget).find('.selectName').html());
            }
            $('#choseCheckPeopleModal').modal('hide');
        }

        /*确认添加物料申请*/
        $scope.addPurchaseOk = function(){
            //数据数组
            var materialListArr = [];
            $.each($('.sonTable tr:not(".trHead")'),function(){
                if($(this).find('.checkMaterial').is(':checked')){
                    materialListArr.push(
                        {
                            material_code: $(this).find('.material_code').html(),
                            material_name:$(this).find('.material_name').html(),
                            model:$(this).find('.model').html(),
                            sn_num:$(this).find('.sn_num').html(),
                            project_num:$(this).find('.project_num').html(),
                            unit:$(this).find('.unit').html(),
                            number:$(this).find('.number').val(),
                            remark:$(this).find('.remark').html()
                        }
                    )
                }
            });

            if(materialListArr.length == 0){
                toastr.warning('请选择物料');
                return;
            }

            //验证
            var isValidate = beforeSubmit("addPickGooodsPurchaseModal");
            if(!isValidate){
                return;
            }

            if($('.groupLeaderNameInp').val() == ''){
                toastr.warning('请选择室组经理！');
                return;
            }else if($('.departmentNameInp').val() == ''){
                toastr.warning('请选择部长！');
                return;
            }

            //生成申请单号
            var material_requisition_id = billFormat('LLSQ',new Date());
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"createPickReqOrder",
                    params:{
                        userName:$scope.user.name,
                        material_requisition_id:material_requisition_id,
                        approver:{
                            group_leader:$('.groupLeaderNameInp').val(),
                            department:$('.departmentNameInp').val()
                        },
                        materialList:materialListArr
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        toastr.success('领料申请提交成功！');
                        addPickPurchaseTable.ajax.reload();
                        $('#addPickGooodsPurchaseModal').modal('hide');
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            });
        }

        /*查看/打印/审核*/
        $(document).on('click','.viewPickPurchase',function(){
            var pickPurchaseOrder = $(this).attr('pickPurchaseOrder');
            $('#billNum').val(pickPurchaseOrder);
            var status = $(this).attr('status');

            //审核框的隐现
            if(status == 1){
                $('.checkBody').hide();
                $('.checkPurchaseOk').hide();//审核按钮
            }else{
                $('.checkBody').show();
                $('.checkPurchaseOk').show();
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"viewReqMaterial",
                    params:{
                        userName:$scope.user.name,
                        material_requisition_id:pickPurchaseOrder
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        $scope.materialList = data.resData.data;
                        $scope.$apply();
                        $('#viewPickPurchaseModal').modal('show');
                    }
                }
            });
        })

        /*审核结果拒绝理由输入框*/
        $('#viewPickPurchaseModal').on('click','.radioDiv input',function(){
            if($(this).attr('checkValue') == 1){
                $('.reasonDiv').hide();
            }else{
                $('.reasonDiv').show();
            }
        })

        /*确认审核*/
        $scope.checkPurchaseOk = function(){
            var billNum,reason;
            billNum = $('#billNum').val();
            //拒绝理由不能为空
            if($('#reasonText').is(':visible') && $('#reasonText').val().trim() == ''){
                toastr.warning('请填写拒绝申请理由！');
                return;
            }
            reason = $('#reasonText').is(':visible')?$('#reasonText').val():'';
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"checkReqMaterial",
                    params:{
                        userName:$scope.user.name,
                        material_requisition_id:$('#billNum').val(),
                        result:$('.radioDiv input:checked').attr('checkValue'),
                        reason:reason
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    if(data.resData.result == 0){
                        toastr.success(data.resData.msg);
                        $('#viewPickPurchaseModal').modal('hide');
                        //重新加载列表
                        addPickPurchaseTable.ajax.reload();
                        //重新设置当前用户其他未审核信息
                        /*$localStorage.sendMessage = data.resData.sendMessage;
                         $scope.sendMessage = data.resData.sendMessage;*/
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            })
        }
    }]);
