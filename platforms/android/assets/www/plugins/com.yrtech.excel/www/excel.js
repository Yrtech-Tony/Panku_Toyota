cordova.define("com.yrtech.excel.excel", function(require, exports, module) { window.echo = function (args, callback) {
    cordova.exec(callback, function (err) {
        alert(err);
    }, "Excel", "echo", args);
};
});
