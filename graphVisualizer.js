
var gv = (function() {
    var init = function() {
        graphDraw.init();
    }
    return {
        init: init
    };
})();

if(window.addEventListener) {
    window.addEventListener('load', gv.init(), false);
}
