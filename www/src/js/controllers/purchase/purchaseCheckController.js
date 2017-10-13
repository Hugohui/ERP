'use strict';
mainStart
    .controller('purchaseCheckController',['$scope','$rootScope','$localStorage','toastr',function($scope,$rootScope,$localStorage,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

        //加载采购审核列表
        loadCheckList();

        /*查看和审核*/
        $scope.viewOrCheck = function(billNum,status){

            $('#billNum').val(billNum);
            status != 0?$('.checkBody').hide():$('.checkBody').show();//当订单为已审核（通过或者拒绝），不再显示审核按钮
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
        }

        /*获取采购单数据填写*/
        $scope.purchaseOrder = function(purchaseBillNum,status){
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
                    }
                })
            }
            $('#purchaseModal').modal('show');
        }

        /*确定采购下单*/
        $scope.purchaseOk = function(){
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
                        loadCheckList();//重新加载数据
                        $('#purchaseModal').hide();//隐藏模态框

                        //重新设置当前用户其他未审核信息
                        $localStorage.sendMessage = data.resData.sendMessage;
                        $scope.sendMessage = data.resData.sendMessage;
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            })
        }

        /*审核结果拒绝理由输入框*/
        $('.radioDiv input').click(function(){
            if($(this).attr('checkValue') == 1){
                $('.reasonDiv').hide();
            }else{
                $('.reasonDiv').show();
            }
        });

        /*确定审核*/
        $scope.checkOk = function(){
            var billNum,reason;
            billNum = $('#billNum').val();
            //拒绝理由不能为空
            if($('#reasonText').is(':visible') && $('#reasonText').val().trim() == ''){
                toastr.warning('请填写拒绝申请理由！');
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
                        loadCheckList();//重新加载数据表
                        //重新设置当前用户其他未审核信息
                        $localStorage.sendMessage = data.resData.sendMessage;
                        $scope.sendMessage = data.resData.sendMessage;
                    }else{
                        toastr.error(data.resData.msg);
                    }
                }
            })
        }

        /**
         * 加载采购申请列表
         */
        function loadCheckList(){
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getPurchaseListCheck",
                    params:{
                        userName:$scope.user.name,
                        limit:"10",
                        start:"0",
                        page:"1",
                        /*queryData:{
                         startDate:"2017-10-11",
                         endDate:"2017-10-11",
                         status:"0",
                         purchase_applicant_id:"CGSQ20170912001",
                         queryApplicant:"张三"
                         }*/
                        queryData:""
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    console.log(data);
                    $scope.purchaseList=data.resData.data;
                    $scope.$apply();
                }
            })
        }
    }]);
