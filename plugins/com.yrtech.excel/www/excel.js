window.echo = function (args, callback) {
    cordova.exec(callback, function (err) {
        alert(err);
    }, "Excel", "echo", args);
};