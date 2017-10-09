'use strict';
mainStart
    .controller('purchaseCheckController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��Ϣ����
        $scope.sendMessage = $localStorage.sendMessage;
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;

        /*���زɹ������б�*/
        /*$.ajax({
            type:'POST',
            url:'http://111.204.101.170:11115',
            data:{
                action:"getPurchaseListCheck",
                params:{
                    "userName":"����",
                    limit:"10",
                    start:"0",
                    page:"1",
                    queryData:{
                        startDate:"2017-10-11",
                        endDate:"2017-10-11",
                        status:"0",
                        purchase_applicant_id:"CGSQ20170912001",
                        queryApplicant:"����"
                    }
                }
            },
            dataType: 'jsonp',
            jsonp : "callback",
            success:function(data){
                $scope.purchaseList=data.resData.data;
            }
        })*/

        //�鿴�����
        $scope.viewOrCheck = function(billNum){
            $('#billNum').val(billNum);
            $('#purchaseCheckModal').modal('show');
        }

        //��˽���ܾ����������
        $('.radioDiv input').click(function(){
            if($(this).attr('checkValue') == 1){
                $('.reasonDiv').hide();
            }else{
                $('.reasonDiv').show();
            }
        });

        //ȷ�����
        $scope.checkOk = function(){
            var billNum,reason;
            billNum = $('#billNum').val();
            reason = $('#reasonText').is(':visible')?$('#reasonText').val():'';
            console.log(reason);
        }
    }]);
