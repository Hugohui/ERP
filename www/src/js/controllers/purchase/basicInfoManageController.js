'use strict';
mainStart
    .controller('basicInfoManageController',['$scope','$rootScope','$localStorage','toastr',function($scope,$rootScope,$localStorage,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;






        //展开收起
        $scope.expandOrPackUp = function(e){
            var $this = $(e.target) ;
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

/*        //清除已有的验证提示信息
        $('#basicInfoManage [valType]').hideValidate();
        //初始化验证
        $.fn.InitValidator('basicInfoManage');

        //提交前验证
        var isValidate = beforeSubmit("basicInfoManage");*/

    }]);
