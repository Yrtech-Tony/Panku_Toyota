window.echo = function (str, callback) {
    cordova.exec(callback, function (err) {
        callback(err);
    }, "Excel", "echo", [str]);
};