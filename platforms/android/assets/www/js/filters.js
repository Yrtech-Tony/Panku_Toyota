angular.module('starter.filters', [])

.filter('passwordf', function () {
    return function (input) {
        input = input || '';
        var out = "";
        for (var i = 0; i < input.length; i++) {
            out = '*' + out;
        }
        return out;
    };
});