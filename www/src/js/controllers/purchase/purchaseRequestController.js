'use strict';
mainStart
    .controller('purchaseRequestController',['$scope','$rootScope','$localStorage','$compile','toastr',function($scope,$rootScope,$localStorage,$compile,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;

        //添加物料行
        $scope.addMaterialLine = function(){
            var lineHtml =
'                   <div class="materialListDiv clearfix">'+
'                        <span class="deleteMaterial" ng-click="deleteMaterialLine($event)">×</span>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                        <div><input type="text"/></div>'+
'                    </div>';
            var $lineHtml = $compile(lineHtml)($scope);
            $('.addMaterialListDiv').before($lineHtml);
        }

        //删除物料行
        $scope.deleteMaterialLine = function($event){
            if($('.materialListDiv').length>1){
                $($event.target).parent().remove();
            }else{
                toastr.warning('至少申请一项物料！');
            }
        }

        //时间选择
        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && false);
        };
        $scope.toggleMin = function () {
            $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();
        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            class: 'datepicker'
        };
        $scope.initDate = new Date('2016-15-20');
        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];

        //审批人
        $scope.checkGroupLeader = function(){
            $scope.choseCheckPeopleTitle ="选择室组经理";
        }
        $scope.checkMinister = function(){
            $scope.choseCheckPeopleTitle ="选择室部长";
        }
        $scope.checkManager = function(){
            $scope.choseCheckPeopleTitle ="选择总经理";
        }

    }]);
