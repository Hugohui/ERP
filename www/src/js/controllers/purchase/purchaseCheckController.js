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

        //查看和审核
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

        //采购下单
        $scope.purchaseOrder = function(purchaseBillNum){
            $('#purchaseBillNum').val(purchaseBillNum);

            //生成订单编号
            $('.orderNum').html(billFormat("CGDD",new Date()));

            //采购申请单号
            $('.purchaseOrderNum').html($('#purchaseBillNum').val());

            $('#purchaseModal').modal('show');
            //获取订单的详细物料数据
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getMaterialList",
                    params:{
                        userName:"张三",
                        purchase_applicant_id:$('#purchaseBillNum').val()
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    $scope.materialList=data.resData.materialList;
                }
            })
        }

        //审核结果拒绝理由输入框
        $('.radioDiv input').click(function(){
            if($(this).attr('checkValue') == 1){
                $('.reasonDiv').hide();
            }else{
                $('.reasonDiv').show();
            }
        });

        //确定审核
        $scope.checkOk = function(){
            var billNum,reason;
            billNum = $('#billNum').val();
            reason = $('#reasonText').is(':visible')?$('#reasonText').val():'';
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
                    $scope.purchaseList=data.resData.data;
                    $scope.$apply();
                }
            })
        }
    }]);
