'use strict';
/*配置，将依赖脚本进行注入*/
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
