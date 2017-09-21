angular.module('mainStart')
    .directive('uiFullscreen', ['uiLoad', '$document', '$window', function(uiLoad, $document, $window) {
        return {
            restrict: 'AC',
            template:'<i class="fa fa-expand fa-fw text"></i><i class="fa fa-compress fa-fw text-active"></i>',
            link: function(scope, el, attr) {

                console.log(el);

                el.addClass('hide');
                uiLoad.load('framework/libs/screenfull.min.js').then(function(){
                    if (screenfull.enabled && !navigator.userAgent.match(/Trident.*rv:11\./)) {
                        el.removeClass('hide');
                    }
                    el.on('click', function(){
                        var target;
                        attr.target && ( target = $(attr.target)[0] );
                        screenfull.toggle(target);
                    });
                    $document.on(screenfull.raw.fullscreenchange, function () {
                        if(screenfull.isFullscreen){
                            el.addClass('active');
                        }else{
                            el.removeClass('active');
                        }
                    });
                });
            }
        };
    }]);