'use strict';
mainStart
    .controller('purchaseCheckController',['$scope','$rootScope','$localStorage','toastr','$compile',function($scope,$rootScope,$localStorage,toastr,$compile){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //加载采购审核列表
        initPurchaseCheckTable();
        var purchaseCheckTable;
        function initPurchaseCheckTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;
            //初始化表格
            purchaseCheckTable = $("#purchaseCheckTable").dataTable({
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
                    /*var queryData = $('.startDate').val() == '' && $('.endDate').val() == '' && ($('.queryInput').val() == ''||$('.queryInput').val() == undefined) ? null : {
                     startDate: $('.startDate').val() == '' ? null : $('.startDate').val(),
                     endDate: $('.endDate').val() == '' ? null : $('.endDate').val(),
                     queryInput: $('.queryInput').val() == '' ||$('.queryInput').val() == undefined? null : $('.queryInput').val()
                     };*/
                    var queryData = $('.placeholderOrderNum').val() == ''&&$('.selectCss').val()==-1?null:{
                        applicant:$('.placeholderOrderNum').val()==''?null:$('.placeholderOrderNum').val(),
                        status:$('.selectCss').val()==-1?null:$('.selectCss').val()
                    }
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    param.userName = $scope.user.name;
                    param.queryData = queryData;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        //url:'data/users.txt',
                        url: 'http://111.204.101.170:11115',
                        data:{
                            action:"getPurchaseListCheck",
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
                        "data": "purchase_applicant_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "created_on",
                        "sClass": "text-center"
                    },
                    {
                        "data": "status",
                        "sClass": "text-center",
                        "render":function(data){
                            if($scope.roles.role_id<4 || $scope.roles.role_id==6){
                                return data == 0?"待审核":data == 1?"审核通过":"拒绝申请"
                            }else if($scope.roles.role_id==4 ||$scope.roles.role_id==5){
                                return data == 0?"待审批":data == 2?"待下单":data == 3?"已下单":data == 4?"待领料":data == 5?"已领料":"已完成";
                            }else{
                                return '--';
                            }
                        }
                    }
                    ,
                    {
                        "data": null,
                        "sClass": "text-center",
                        "render":function(data){
                            if($scope.roles.role_id<4||$scope.roles.role_id==6){
                                return '<a href="javascript:;" class="btn btn-default btn-sm viewOrCheck" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">查看/审核</a>';
                            }else if($scope.roles.role_id==5 && data.status == 2){
                                return '<a href="javascript:;" class="btn btn-default btn-sm purchaseOrder" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">采购下单</a>';
                            }else if($scope.roles.role_id==5 && data.status > 2){
                                return '<a href="javascript:;" class="btn btn-default btn-sm purchaseOrder" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">查看</a>';
                            }else{
                                return '';
                            }
                        }
                    }
                ]
            }).api();
        }


        //条件查询
        $scope.conditionQuery = function(){
            purchaseCheckTable.ajax.reload();
        }

        /*查看和审核*/
        $(document).on('click','.viewOrCheck',function(){
            var billNum = $(this).attr('purchase_applicant_id');
            var status = $(this).attr('status');
            $('#billNum').val(billNum);
            status != 0?$('.checkBody').hide():$('.checkBody').show();//当订单为已审核（通过或者拒绝），不再显示审核按钮

            //每次打开模态都将按钮和输入框框恢复为默认状态
            $('#passCheck').click();
            $('#reasonText').val('');

            $('#purchaseCheckModal').modal('show');
            //获取订单的详细物料数据
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getMaterialList",
                    params:{
                        userName:$scope.user.name,
                        purchase_applicant_id:$('#billNum').val()
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    $scope.materialList=data.resData.data;
                    $scope.$apply();
                }
            })
        })

        /*获取采购单数据填写*/
        $(document).on('click','.purchaseOrder',function(){
            var purchaseBillNum = $(this).attr('purchase_applicant_id');
            var status = $(this).attr('status');
            //保存采购申请单号
            $('#purchaseBillNum').val(purchaseBillNum);
            //采购申请单号
            $('.purchaseOrderNum').html($('#purchaseBillNum').val());

            if(status>2){
                $('#purchaseModalFooter').hide()

                //获取订单的详细物料数据
                $.ajax({
                    type:'POST',
                    url:'http://111.204.101.170:11115',
                    data:{
                        action:"viewMaterialList",
                        params:{
                            purchase_applicant_id:$('#purchaseBillNum').val()
                        }
                    },
                    dataType: 'jsonp',
                    jsonp : "callback",
                    success:function(data){
                        $scope.orderInfo = data.resData.data[0];
                        $scope.materialList=data.resData.data.materialList;
                        $scope.$apply();
/*                        var trStr = '';
                        $.each(data.resData.data.materialList,function(index,value){
                            //value.material_code
                            trStr+=
                                '                            <tr>'+
                                '                                <td>'+
                                '                                    <span>'+value.material_code+'</span>'+
                                '                                </td>'+
                                '                                <td title="" class="material_name">'+value.material_name+'</td>'+
                                '                                <td title="" class="model">'+value.model+'</td>'+
                                '                                <td title="" class="sn_num">'+value.sn_num+'</td>'+
                                '                                <td>'+
                                '                                    <span>'+value.supplier_num+'</span>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <span>'+value.supplier+'</span>'+
                                '                                </td>'+
                                '                                <td title="" class="project_num">'+value.project_num+'</td>'+
                                '                                <td title="" class="unit">'+value.unit+'</td>'+
                                '                                <td>'+
                                '                                    <span >'+value.unit_price+'</span>'+
                                '                                </td>'+
                                '                                <td title="" class="number">'+value.number+'</td>'+
                                '                                <td>'+
                                '                                    <span>'+value.total_price+'</span>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <span>'+value.rate+'</span>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <span>'+value.invoice+'</span>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <span>'+value.brand+'</span>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <span">'+value.manufactor+'</span>'+
                                '                                </td>'+
                                '                                <td title="" class="remark">'+value.remark+'</td>'+
                                '                                <td>'+
                                '                                    <span>'+value.batch+'</span>'+
                                '                                </td>'+
                                '                            </tr>';
                        })

                        $('#purchaseOkTable').append(trStr);*/

                    }
                })
            }else{
                //生成订单编号
                $('.orderNum').html(billFormat("CGDD",new Date()));

                //下单日期
                $('.orderDatetime').html(new Date().format("yyyy-MM-dd"));

                $('#purchaseModalFooter').show()

                //获取订单的详细物料数据
                $.ajax({
                    type:'POST',
                    url:'http://111.204.101.170:11115',
                    data:{
                        action:"getMaterialList",
                        params:{
                            purchase_applicant_id:$('#purchaseBillNum').val()
                        }
                    },
                    dataType: 'jsonp',
                    jsonp : "callback",
                    success:function(data){
                        $scope.materialList=data.resData.data;
                        $scope.$apply();

/*                        var trStr = '';
                        $.each(data.resData.data,function(index,value){
                            trStr+=
                                '                            <tr>'+
                                '                                <td>'+
                                '                                    <input type="text" valType="" msg="物料编码不能为空" class="material_code"/>'+
                                '                                </td>'+
                                '                                <td title="" class="material_name">'+value.material_name+'</td>'+
                                '                                <td title="" class="model">'+value.model+'</td>'+
                                '                                <td title="" class="sn_num">'+value.sn_num+'</td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="supplier_num"/>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="supplier"/>'+
                                '                                </td>'+
                                '                                <td title="" class="project_num">'+value.project_num+'</td>'+
                                '                                <td title="" class="unit">'+value.unit+'</td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="unit_price"/>'+
                                '                                </td>'+
                                '                                <td title="" class="number">'+value.number+'</td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="total_price" value="0"/>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="rate"/>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="invoice"/>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="brand"/>'+
                                '                                </td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="manufactor"/>'+
                                '                                </td>'+
                                '                                <td title="" class="remark">'+value.remark+'</td>'+
                                '                                <td>'+
                                '                                    <input type="text" class="batch"/>'+
                                '                                </td>'+
                                '                            </tr>';
                        })

                        $('#purchaseOkTable tbody').append(trStr);*/
                        //清除已有的验证提示信息
                        $('#purchaseOkTable [valType]').hideValidate();
                        //初始化验证
                        $.fn.InitValidator('purchaseOkTable');
                    }
                })
            }
            $('#purchaseModal').modal('show');
        })

        /*确定采购下单*/
        $scope.purchaseOk = function(){

            var isValidate = beforeSubmit("purchaseModal");
            if(!isValidate){
                return;
            }

            var materialListArr = [];
            $('#purchaseModal table tr').not('.tableHeadTr').each(function(index,value){
                materialListArr.push(
                    {
                        material_code:$(value).find('.material_code').val(),
                        material_name:$(value).find('.material_name').html(),
                        model:$(value).find('.model').html(),
                        sn_num:$(value).find('.sn_num').html(),
                        supplier_num:$(value).find('.supplier_num').val(),
                        supplier:$(value).find('.supplier').val(),
                        project_num:$(value).find('.project_num').html(),
                        unit:$(value).find('.unit').html(),
                        unit_price:$(value).find('.unit_price').val(),
                        number:$(value).find('.number').html(),
                        brand:$(value).find('.brand').val(),
                        manufactor:$(value).find('.manufactor').val(),
                        total_price:$(value).find('.total_price').val(),
                        rate:$(value).find('.rate').val(),
                        invoice:$(value).find('.invoice').val(),
                        remark:$(value).find('.remark').html(),
                        batch:$(value).find('.batch').val()
                    }
                );
            });
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"commitOrder",
                    params:{
                        userName:$scope.user.name,
                        created_on:$('.orderDatetime').html(),
                        contract_num:$('.contract_num').val(),
                        purchase_applicant_id:$('#purchaseBillNum').val(),
                        purchase_order_id:$('.orderNum').html(),
                        materialList:materialListArr
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    if(data.resData.result == 0){
                        toastr.success(data.resData.msg);
                        purchaseCheckTable.ajax.reload();//重新加载数据
                        $('#purchaseModal').hide();//隐藏模态框

                        //重新设置当前用户其他未审核信息
                        $localStorage.sendMessage = data.resData.sendMessage;
                        $scope.sendMessage = data.resData.sendMessage;
                    }else{
                        toastr.error('物料编码【'+data.resData.material_code+'】重复！',data.resData.msg);
                    }
                }
            })
        }

        //模态框关闭之前清除验证信息提示
        $('#purchaseModal').on('hide.bs.modal', function () {
            //清除已有的验证提示信息
            $('#purchaseOkTable [valType]').hideValidate();
        })

        /*审核结果拒绝理由输入框*/
        /*$('.radioDiv input').click(function(){
            if($(this).attr('checkValue') == 1){
                $('.reasonDiv').hide();
            }else{
                $('.reasonDiv').show();
            }
        });*/

        /*确定审核*/
        $scope.checkOk = function(){
            var billNum,reason;
            billNum = $('#billNum').val();
            //拒绝理由不能为空
            if($('#failureCheck').is(':checked') && $('#reasonText').val().trim() == ''){
                toastr.warning('请填写审核意见！');
                return;
            }
            reason = $('#reasonText').val();
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"checkMaterial",
                    params:{
                        userName:$scope.user.name,
                        purchase_applicant_id:$('#billNum').val(),
                        result:$('.radioDiv input:checked').attr('checkValue'),
                        reason:reason
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    if(data.resData.result == 0){
                        toastr.success(data.resData.msg);
                        $('#purchaseCheckModal').modal('hide');
                        purchaseCheckTable.ajax.reload();//重新加载数据表
                        //重新设置当前用户其他未审核信息
                        $localStorage.sendMessage = data.resData.sendMessage;
                        $scope.sendMessage = data.resData.sendMessage;
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            })
        }

        //计算金额
        $('#purchaseModal').on('keyup','.unit_price',function(){
            var unit_price = Number($(this).val());
            var number = Number($(this).closest('td').next().html());
            var total = unit_price*number;
            $(this).closest('td').next().next().find('input').val(!isNaN(total)?total:0);
        });
    }]);
