'use strict';
mainStart
    .controller('infoMaintainController',['$scope','$rootScope','$localStorage',function($scope,$rootScope,$localStorage){
        //��ȡ��ɫȨ��
        $scope.roles = $localStorage.roles;
        //��Ϣ����
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //��ȡ��ɫ��Ϣ
        $scope.user = $localStorage.user;

        personUpdate();
        //��ȡ�û���Ϣ
        $("#updataForm")[0].reset();
        function personUpdate(){
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"getUserInfo",
                    params:{
                        userName:$scope.user.name
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                success:function(data){
                    $scope.personsList=data.resData.data;
                    console.log(data);
                    $scope.$apply();
                }
            })
        }

        //�޸ģ���ϵ�绰
        //����༭��ť���༭��ϵ�绰������ʧ����
        $scope.phoneUpdateBtn=function(){
            $('#phoneEditbtn').toggle();
            $("#phoneSaveBtn").toggle();
            $("#phoneDisBtn").toggle();
            $("#phoneUpdateBtn").css('display','none');
            $("#phoneEditInput").removeAttr('disabled')
            $("#phoneEditInput").css("border","")
        }
        //�����X"���༭��ϵ�绰������ʧ����
        $scope.phoneDisBtn=function(){
            $('#phoneEditbtn').css('display','none');
            $("#phoneSaveBtn").css('display','none');
            $("#phoneDisBtn").css('display','none');
            $("#phoneUpdateBtn").css('display','inline-block');
            $("#phoneEditInput").css("border","none")
                .attr("disabled","disabled");
        }

        //������̡��������޸�
        $scope.phoneSaveBtn=function(){
            $scope.data = {
                action:'updateUserPhone',
                params:{
                    userName:$scope.user.name,
                    newPhone:$("#phoneEditInput").val()
                }
            };
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:$scope.data,
                dataType: 'jsonp',
                jsonp : "callback",
                jsonpCallback:"success_jsonpCallback",
                success:function(data){
                    $('#phoneEditbtn').css('display','none');
                    $("#phoneSaveBtn").css('display','none');
                    $("#phoneDisBtn").css('display','none');
                    $("#phoneUpdateBtn").css('display','inline-block');
                    $("#phoneEditInput").css("border","none")
                    console.log(data);
                    personUpdate();
                }
            })
        }


        //�޸�����
        $scope.personUpdate=function(){
            if($('#oldpwd').val&&$('#password').val==$('#passwordAgain').val){
                $scope.data = {
                    action:'updateUserPassword',
                    params:{
                        userName:$scope.user.name,
                        oldPassword:$("#oldpwd").val(),
                        newPassword:$("#password").val()
                    }
                };
                $.ajax({
                    type:'POST',
                    url:'http://111.204.101.170:11115',
                    data:$scope.data,
                    dataType: 'jsonp',
                    jsonp : "callback",
                    jsonpCallback:"success_jsonpCallback",
                    success:function(data){
                        $("#updataForm")[0].reset();
                        console.log(data);
                        alert(data.resData.data)
                    }
                })
            }else{

            }

        }
        $scope.pwdUpdateBtn=function(){
            $("#updataForm")[0].reset();
        }
        $scope.dispersonUpdate=function(){
            $("#updataForm")[0].reset();
        }


    }]);
