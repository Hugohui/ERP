'use strict';
mainStart
    .controller('purchaseRequestController',['$scope','$rootScope','$localStorage','$compile','toastr',function($scope,$rootScope,$localStorage,$compile,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;

        //添加物料行
        $scope.addMaterialLine = function($event){
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
            $($event.target).before($lineHtml);
        }

        //删除物料行
        $scope.deleteMaterialLine = function($event){
            if($('.materialListDiv').length>1){
                $($event.target).parent().remove();
            }else{
                toastr.warning('至少保留一项物料！');
            }
        }

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
