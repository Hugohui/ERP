'use strict';
mainStart
    .controller('purchaseCheckController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

        /*加载采购申请列表*/
        /*$.ajax({
            type:'POST',
            url:'http://111.204.101.170:11115',
            data:{
                action:"getPurchaseListCheck",
                params:{
                    "userName":"张三",
                    limit:"10",
                    start:"0",
                    page:"1",
                    queryData:{
                        startDate:"2017-10-11",
                        endDate:"2017-10-11",
                        status:"0",
                        purchase_applicant_id:"CGSQ20170912001",
                        queryApplicant:"张三"
                    }
                }
            },
            dataType: 'jsonp',
            jsonp : "callback",
            success:function(data){
                $scope.purchaseList=data.resData.data;
            }
        })*/

        //查看和审核
        $scope.viewOrCheck = function(billNum){
            $('#billNum').val(billNum);
            $('#purchaseCheckModal').modal('show');
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
            console.log(reason);
        }
    }]);
