'use strict';
/*控制器*/
angular.module('mainStart')
    .controller('appCtrl', ['$scope',function($scope) {
        // config
        $scope.app = {
            name: '智行者ERP管理系统',
            version: '1.0'
        }
    }]);