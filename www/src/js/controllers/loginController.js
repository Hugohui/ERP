'use strict';
mainStart.controller('loginController',['$scope','$rootScope','$localStorage','$http','$state',
    function($scope,$rootScope,$localStorage,$http,$state){
        $scope.user = {};
        $scope.roles = {
            mo1:false,
            mo2:false,
            mo3:true
        };
        //重置
        $scope.reset=function(){
            $("#loginForm")[0].reset();
            $('#labelTip').html('请拖动滑块验证').css({
                color:'#787878'
            });
            $('#validation').val(0);
            slider.reset();
            slider.init();

        }

        //滑块验证
        var  slider;
        $(function () {
            slider = new SliderUnlock("#slider",{
                successLabelTip : "验证成功",
            },function(){
                $("#validation").val(1);
                //checkBlank();
            });
            slider.init();
        })

        //获取焦点
        $('#uname, #upwd').bind('focus', function(){
            $("#login-password").text('');
            $("#login-uname").text('');
        })


        $scope.loginOk = function(){
            var x=document.getElementById("upwd").value.length;
            if($('#uname').val()&&$('#upwd').val()&&$('#validation').attr("value") == 1&&x>=6){
                $scope.ajaxData = {
                    action: "erpLogin",
                    params: {
                        userName:$scope.user.name,
                        password:$("#upwd").val()
                    }
                }
                console.log($scope.ajaxData);
                $.ajax({
                    type: 'POST',
                    url: 'http://111.204.101.170:11115',
                    data: $scope.ajaxData,
                    dataType: 'jsonp',
                    jsonp: "callback",
                    success: function (data) {
                        if(data.resData.result == 0){
                            //用户权限
                            $localStorage.roles = data.resData.access;
                            //消息推送
                            $localStorage.sendMessage = data.resData.sendMessage;
                            //用户信息
                            $localStorage.user = $scope.user;
                            //跳转到首页
                            $state.go('app');

                        }else if(data.resData.result == -1){
                            $("#login-password").text(data.resData.msg);
                            $('#labelTip').html('请拖动滑块验证').css({
                                color:'#787878'
                            });
                            $('#validation').val(0);
                            $('#labelTip').css({
                                color:'red'
                            });
                            slider.reset();
                            slider.init();
                            $("#loginForm")[0].reset();

                        }else{
                            $("#loginForm")[0].reset();
                            $("#login-uname").text(data.resData.msg);
                            $("#resultPwd").html();
                            $('#labelTip').html('请拖动滑块验证').css({
                                color:'#787878'
                            });
                            $('#validation').val(0);
                            $('#labelTip').css({
                                color:'red'
                            });
                            slider.reset();
                            slider.init();
                        }
                    }
                })
            }else{
                slider.reset();
                slider.init();
                $('#validation').val(0);
                $('#labelTip').html('请拖动滑块验证').css({
                    color:'#787878'
                });
                if($('#validation').attr("value") == 0){
                    $('#labelTip').css({
                        color:'red'
                    });
                }
            }
        }
    }]);