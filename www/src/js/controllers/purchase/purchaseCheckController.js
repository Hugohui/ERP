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
                                return '<a href="javascript:;" class="btn btn-default btn-xs viewOrCheck" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">查看/审核</a>';
                            }else if($scope.roles.role_id==5 && data.status == 2){
                                var assignBtn;
                                    assignBtn = $scope.user.name== '张智丰'&&data.isAssign == '0'?'<a href="javascript:;" class="btn btn-default btn-xs assign" purchase_applicant_id="'+data.purchase_applicant_id+'">指派</a>':'';
                                return '<a href="javascript:;" class="btn btn-default btn-xs purchaseOrder" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">采购下单</a> '+assignBtn;
                            }else if($scope.roles.role_id==5 && data.status > 2){
                                var editBtn;
                                editBtn=data.status == 3?'<a href="javascript:;" class="btn btn-default btn-xs purchaseOrder" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">查看/修改</a>':'<a href="javascript:;" class="btn btn-default btn-xs purchaseOrder" purchase_applicant_id="'+data.purchase_applicant_id+'" status="'+data.status+'">查看</a> ';
                                return editBtn;
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

        /*采购订单指派*/
        $(".purchaseCheckBody").off("click").on('click','.assign',function(){
            $('#choseAssignModal .modal-body').empty();

            //获取被指派人列表
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getAssignList",
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    if(data.resData.result == 0){
                        var html= '';
                        $.each(data.resData.data,function(index,value){
                            html+=
                                '                    <div class="radio">'+
                                '                        <label>'+
                                '                            <input type="radio" name="assign" value="'+value.userName+'">'+value.userName+
                                '                        </label>'+
                                '                    </div>';
                        })
                    }
                    $('#choseAssignModal .modal-body').append(html);
                }
            })

            $('#choseAssignModal').modal('show');
            $('#assignOrder').val($(this).attr('purchase_applicant_id'));
        })
        $scope.assignOk = function(){
            var assignOrder = $('#assignOrder').val();
            var assignPerson = $('.radio input:checked').val();

            if(!assignPerson){
                toastr.warning('请选择指派对象');
                return;
            }

            //发送指派
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"sendAssign",
                    params:{
                        purchase_applicant_id:assignOrder,
                        assignPerson:assignPerson
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    if(data.resData.result == 0){
                        $('#choseAssignModal').modal('hide');
                        purchaseCheckTable.ajax.reload();
                        toastr.success('指派成功');
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            })
        }

        /*获取供应商信息*/
        var supplierArr = [];
        $.ajax({
            type:'POST',
            url:'http://111.204.101.170:11115',
            data:{
                action:"loadSupplierList"
            },
            dataType: 'jsonp',
            jsonp : "callback",
            success:function(data){
                if(data.resData.result == 0){
                    console.log(data.resData.data);
                    $.each(data.resData.data,function(index,value){
                        var str = '【'+value.supplier_num+'】 '+value.supplier_name;
                        supplierArr.push(str);
                    });
                }else{
                    toastr.error(data.resData.msg);
                }
            }
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
                if(status == 4){
                    $('#purchaseModalFooter').hide();
                }else{
                    $('#purchaseModalFooter').show();
                }
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
                        $('.supplierSelect').autocomplete({
                            hints: supplierArr,// ["【123】 智行者","【456】 智行者科技","【789】 京东"],
                            width: "100%",
                            proposalWidth:'160',
                            height: 27,
                            showButton:false,
                            placeholder:'',
                            onSubmit: function(that,text){
                                var val = text.split(' ');
                                $(that).closest('tr').find('.supplier_num input').val(val[0].replace('【','').replace('】',''));
                                $(that).closest('tr').find('.supplier input').val(val[1]);
                            }
                        });
                        //清除已有的验证提示信息
                        $('#purchaseOkTable [valType]').hideValidate();
                        //初始化验证
                        $.fn.InitValidator('purchaseOkTable');
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
                        $scope.orderInfo = '';
                        $scope.materialList=data.resData.data;
                        $scope.$apply();
                        $('.supplierSelect').autocomplete({
                            hints: supplierArr,//["【123】 智行者","【456】 智行者科技","【789】 京东"],
                            width: "100%",
                            proposalWidth:'160',
                            height: 27,
                            showButton:false,
                            placeholder:'',
                            onSubmit: function(that,text){
                                var val = text.split(' ');
                                $(that).closest('tr').find('.supplier_num input').val(val[0].replace('【','').replace('】',''));
                                $(that).closest('tr').find('.supplier input').val(val[1]);
                            }
                        });
                        //清除已有的验证提示信息
                        $('#purchaseOkTable [valType]').hideValidate();
                        //初始化验证
                        $.fn.InitValidator('purchaseOkTable');
                    }
                })
            }
            $('#purchaseModal').modal('show');

        })

        $('.supplierSelect').autocomplete({
            hints: [123,456,789],
            width: "100%",
            height: 27,
            showButton:false,
            placeholder:'',
            onSubmit: function(text){
            }
        });

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
                        material_code:$(value).find('.material_code').html(),
                        material_name:$(value).find('.material_name').html(),
                        model:$(value).find('.model').html(),
                        sn_num:$(value).find('.sn_num').html(),
                        supplier_num:$(value).find('.supplier_num input').val(),
                        supplier:$(value).find('.supplier input').val(),
                        project_num:$(value).find('.project_num').html(),
                        unit:$(value).find('.unit').html(),
                        unit_price:$(value).find('.unit_price').val(),
                        number:$(value).find('.number').val(),
                        brand:$(value).find('.brand').html(),
                        manufactor:$(value).find('.manufactor').val(),
                        total_price:$(value).find('.total_price').val(),//含税金额
                        noRateTotal:$(value).find('.noRateTotal').val(),//不含税金额
                        ratePrice:$(value).find('.ratePrice').val(),//税额
                        rate:$(value).find('.rateSelect').val(),
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
                        //purchaseCheckTable.ajax.reload();//重新加载数据
                        window.location.reload();
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

        //改变单价计算金额（含税）
        $('#purchaseModal').on('keyup','.unit_price',function(){
            var unit_price = $(this).val();
            var number = $(this).closest('td').next().find('input').val();
            var total = unit_price*number;
            $(this).closest('tr').find('.total_price').val(total.toFixed(3));

            //不含税金额
            var noRateTotal = unit_price*number*(1-$('.rateSelect').val());
            $(this).closest('tr').find('.noRateTotal').val(noRateTotal.toFixed(3));

            //税额
            var ratePrice = unit_price*number*$('.rateSelect').val();
            $(this).closest('tr').find('.ratePrice').val((total-noRateTotal).toFixed(3));
        });

        //改变数量计算
        $('#purchaseModal').on('change','.number',function(){
            var number = $(this).val();
            var unit_price= $(this).closest('tr').find('.unit_price').val();
            var total = unit_price*number;
            $(this).closest('tr').find('.total_price').val(total.toFixed(3));

            //不含税金额
            var noRateTotal = unit_price*number*(1-$('.rateSelect').val());
            $(this).closest('tr').find('.noRateTotal').val(noRateTotal.toFixed(3));

            //税额
            var ratePrice = unit_price*number*$('.rateSelect').val();
            $(this).closest('tr').find('.ratePrice').val((total-noRateTotal).toFixed(3));
        });

       //输入含税金额计算
        $('#purchaseModal').on('keyup','.total_price',function(){
            //含税金额
            var total_price = $(this).val();

            //不含税金额
            var noRateTotal = total_price*(1-$('.rateSelect').val());
            $(this).closest('tr').find('.noRateTotal').val(noRateTotal.toFixed(3));

            //税额
            var ratePrice = noRateTotal*$('.rateSelect').val();
            $(this).closest('tr').find('.ratePrice').val((total_price-noRateTotal).toFixed(3));

            //不含税单价
            var number = $(this).closest('tr').find('.number').val();
            var unit_price = noRateTotal/number
            $(this).closest('tr').find('.unit_price').val(unit_price.toFixed(3));
        });

        //改变税率计算
        $('#purchaseModal').on('change','.rateSelect',function(){

            //税率
            var rate = $(this).val();

            //含税金额
            var total_price =  $(this).closest('tr').find('.total_price').val();

            //不含税金额
            var noRateTotal = total_price*(1-rate);
            $(this).closest('tr').find('.noRateTotal').val(noRateTotal.toFixed(3));

            //税额
            var ratePrice = noRateTotal*rate;
            $(this).closest('tr').find('.ratePrice').val((total_price-noRateTotal).toFixed(3));

            //不含税单价
            var number = $(this).closest('tr').find('.number').val();
            var unit_price = noRateTotal/number
            $(this).closest('tr').find('.unit_price').val(unit_price.toFixed(3));
        });
    }]);
