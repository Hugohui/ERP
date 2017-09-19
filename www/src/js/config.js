'use strict';
/*���ã��������ű�����ע��*/
var mainStart = angular.module('mainStart')
    .config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
        function ($controllerProvider,$compileProvider,$filterProvider,$provide) {
            // lazy controller, directive and service
            mainStart.controller = $controllerProvider.register;
            mainStart.directive  = $compileProvider.directive;
            mainStart.filter     = $filterProvider.register;
            mainStart.factory = $provide.factory;
            mainStart.service = $provide.service;
            mainStart.constant = $provide.constant;
        }
    ]);
