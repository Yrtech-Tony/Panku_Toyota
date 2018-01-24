angular.module('starter.controllers', [])
//登陆
.controller('LoginCtrl', function ($scope, $rootScope, $state, $cordovaCamera, $cordovaFile, $cordovaSQLite, $cordovaSplashscreen, $cordovaToast, $ionicHistory, SqliteHelper, Login, FileHelper) {
    $rootScope.shopCode = '';
    $rootScope.shopName = '';
    $scope.viewState = { shopCode: '', shopName: '', password: '' };
    $scope.project = {};
    $scope.projects = new Array();
    Login.getAllProjets(function (res) {
        for (var i = 0; i < res.rows.length; i++) {
            $scope.projects.push(res.rows.item(i));
        }
        $scope.project = $scope.projects[0];

        if (typeof (Storage) !== "undefined") {
            $scope.viewState.shopCode = $rootScope.shopCode = parseInt(localStorage.shopCode) || '';
            $scope.checkShopName($scope.viewState.shopCode);
            $scope.viewState.password = localStorage.password || '';
            if (localStorage.projectCode) {
                for (var i = 0; i < $scope.projects.length; i++) {
                    if ($scope.projects[i].ProjectCode == localStorage.projectCode) {
                        $scope.project = $scope.projects[i];
                        break;
                    }
                }
            }
        }

        $cordovaSplashscreen.hide();
    });

    $scope.checkShopName = function (shopCode) {
        Login.checkShopName(shopCode, function (res) {
            if (res.rows.length > 0) {
                $scope.viewState.shopName = res.rows.item(0).ShopName;
            }
            else {
                $scope.viewState.shopName = '';
            }
        });
    };

    $scope.login = function (shopCode, shopName, password, projectCode) {
        Login.tryLogin(shopCode, password, projectCode, function (res) {
            if (res.rows.length > 0) {
                if (res.rows.item(0).Password == password) {
                    $rootScope.shopCode = shopCode;
                    $rootScope.shopName = shopName;
                    $rootScope.projectCode = projectCode;

                    if (typeof (Storage) !== "undefined") {
                        localStorage.shopCode = shopCode;
                        localStorage.password = password;
                        localStorage.projectCode = projectCode;
                    }

                    $ionicHistory.nextViewOptions({
                        disableAnimate: true,
                        disableBack: true
                    });
                    $state.go('tab.dash', { searchText: '', isAllVinCode: false });
                }
                else {
                    $cordovaToast.showShortCenter('密码错误');
                }
            }
            else {
                $cordovaToast.showShortCenter(shopCode + '该经销商不存在');
            }
        });
    };
})
//经销商库存表
.controller('DashCtrl', function ($scope, $rootScope, $stateParams, $state, $cordovaCamera, $cordovaFile, $ionicLoading, FileHelper, Answer) {
    $scope.viewState = {
        searchText: { VinCode8: $stateParams.searchText },
        isAllVinCode: $stateParams.isAllVinCode == 'true' ? true : false
    };
    $scope.vinCodeList = new Array();
    Answer.getAllVinCode($scope.viewState.isAllVinCode, function (res) {
        for (var i = 0; i < res.rows.length; i++) {
            var vinCode = res.rows.item(i);
            if (vinCode.AddChk == 'Y') {
                vinCode.Style = { color: 'blue' };
            } else if ((vinCode.PhotoName && vinCode.PhotoName.length > 0) || (vinCode.Remark && vinCode.Remark.length > 0)) {
                vinCode.Style = { color: 'green' };
            } else {
                vinCode.Style = { color: 'black' };
            }
            $scope.vinCodeList.push(vinCode);
        }
        $ionicLoading.hide();
    });
    $scope.isAllVinCodeChange = function (isAllVinCode) {
        setTimeout(function () {
            Answer.getAllVinCode(isAllVinCode, function (res) {
                $scope.vinCodeList = new Array();
                for (var i = 0; i < res.rows.length; i++) {
                    var vinCode = res.rows.item(i);
                    if (vinCode.AddChk == 'Y') {
                        vinCode.Style = { color: 'blue' };
                    } else if ((vinCode.PhotoName && vinCode.PhotoName.length > 0) || (vinCode.Remark && vinCode.Remark.length > 0)) {
                        vinCode.Style = { color: 'green' };
                    } else {
                        vinCode.Style = { color: 'black' };
                    }
                    $scope.vinCodeList.push(vinCode);
                }
                $ionicLoading.hide();
            });
        }, 10);
    };
    $scope.itemClick = function (item, clickEvent) {
        if (item.AddChk == 'N') {
            var vinCode = item.VinCode;
            $ionicLoading.show({
                template: 'Loading...'
            });
            setTimeout(function () {
                $state.go('tab.dash-detail', { vinCode: vinCode, searchText: $scope.viewState.searchText.VinCode8, isAllVinCode: $scope.viewState.isAllVinCode }, { reload: true });
            }, 1000);
        } else {
            var vinCode = item.VinCode;
            $ionicLoading.show({
                template: 'Loading...'
            });
            setTimeout(function () {
                $state.go('tab.chats', { vinCode: vinCode }, { reload: true });
            }, 1000);
        }
        $ionicLoading.hide();
    }
    $scope.btnClick = function (vinCode) {
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG
        };
        $cordovaCamera.getPicture(options).then(onSuccess_for_file, function (err) { });
        function onSuccess_for_file(imageURI) {
            url = imageURI.split("/");
            fileName = url[url.length - 1];
            FileHelper.createDir(cordova.file.externalRootDirectory, "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/", function () {
                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vinCode + '.jpg')
                            .then(function (success) {
                                Answer.saveVINPhotoName(vinCode, vinCode + '.jpg', function () {
                                    Answer.getAllVinCode($scope.viewState.isAllVinCode, function (res) {
                                        $scope.vinCodeList = new Array();
                                        for (var i = 0; i < res.rows.length; i++) {
                                            var vinCode = res.rows.item(i);
                                            if (vinCode.PhotoName && vinCode.PhotoName.length > 0) {
                                                vinCode.Style = { color: 'green' };
                                            }
                                            else {
                                                vinCode.Style = { color: 'black' };
                                            }
                                            $scope.vinCodeList.push(vinCode);
                                        }
                                        $ionicLoading.hide();
                                    });
                                });
                            }, function (error) {
                                alert(error);
                            });
            });
        }
    }
})
//经销商库存表详细
.controller('DashDetailCtrl', function ($scope, $rootScope, $state, $stateParams, $cordovaCamera, $cordovaFile, $cordovaToast, $ionicLoading, $ionicHistory, $ionicModal, FileHelper, Answer) {
    $scope.noteList = new Array();
    $scope.devList = [];
    $scope.viewState = {
        vinCode: $stateParams.vinCode,
        note: {},
        customNoteName: '',
        remark: '',
        vin1_img_uri: 'img/ionic.png',
        vin2_img_uri: 'img/ionic.png',
        vin3_img_uri: 'img/ionic.png',
        vin4_img_uri: 'img/ionic.png',
        vin1PhotoUri: '',
        vin2PhotoUri: '',
        vin3PhotoUri: '',
        vin4PhotoUri: '',
        searchText: $stateParams.searchText,
        isAllVinCode: $stateParams.isAllVinCode == 'true' ? true : false,
        isUpdate: true

    };
    $ionicModal.fromTemplateUrl('templates/modal.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });
    Answer.getAllNoteA(function (res) {
        $scope.noteList.push({ NoteName: "无", checkName: false });
        for (var i = 0; i < res.rows.length; i++) {
            if (res.rows.item(i).checkName == 1) {
                res.rows.item(i).checkName = true;
            }
            else {
                res.rows.item(i).checkName = false;
            }
            $scope.devList.push(res.rows.item(i));
        }
    });
    Answer.initData($scope.viewState.vinCode, function (model) {
        if (model.PhotoName == null || model.PhotoName == "") {

        }
        else {
            var photoNameArray = model.PhotoName.split(';');
            var vin1PhotoName = photoNameArray[0];
            var vin2PhotoName = photoNameArray[1];
            var vin3PhotoName = photoNameArray[2];
            var vin4PhotoName = photoNameArray[3];
            if (vin1PhotoName != null && vin1PhotoName != "") {
                $scope.viewState.vin1_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin1PhotoName + "?lastmod=" + (new Date()).toString();
                $scope.viewState.vin1PhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin1PhotoName;
            }
            if (vin2PhotoName != null && vin2PhotoName != "") {
                $scope.viewState.vin2_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin2PhotoName + "?lastmod=" + (new Date()).toString();
                $scope.viewState.vin2PhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin2PhotoName;
            }
            if (vin3PhotoName != null && vin3PhotoName != "") {
                $scope.viewState.vin3_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin3PhotoName + "?lastmod=" + (new Date()).toString();
                $scope.viewState.vin3PhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin3PhotoName;
            }
            if (vin4PhotoName != null && vin4PhotoName != "") {
                $scope.viewState.vin4_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin4PhotoName + "?lastmod=" + (new Date()).toString();
                $scope.viewState.vin4PhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/" + vin4PhotoName;
            }

        }
        if (model.Remark && model.Remark.length > 0) {
            $scope.viewState.remark = model.Remark;
            var remarkArray = model.Remark.split(';');

            for (var i = 0; i < remarkArray.length; i++) {
                if (remarkArray[i] != "") {
                    for (var j = 0; j < $scope.devList.length; j++) {
                        if ($scope.devList[j].NoteName.indexOf(remarkArray[i]) > -1) {
                            $scope.devList[j].checkName = true;
                        }
                    }
                }
            }

        }
        $ionicLoading.hide();
    });
    $scope.remarkSelect = function () {
        var remark = "";
        for (var i = 0; i < $scope.devList.length; i++) {
            if ($scope.devList[i].checkName == 1) {
                remark += $scope.devList[i].NoteName + ";";
            }
        }
        $scope.viewState.remark = remark;
        $scope.modal.hide();
    };
    $scope.vin1Picture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vin1PhotoUri = imageURI;
            $scope.viewState.vin1_img_uri = imageURI;
            $scope.viewState.isUpdate = false;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });

    };
    $scope.vin2Picture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vin2PhotoUri = imageURI;
            $scope.viewState.vin2_img_uri = imageURI;
            $scope.viewState.isUpdate = false;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };
    $scope.vin3Picture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vin3PhotoUri = imageURI;
            $scope.viewState.vin3_img_uri = imageURI;
            $scope.viewState.isUpdate = false;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };
    $scope.vin4Picture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vin4PhotoUri = imageURI;
            $scope.viewState.vin4_img_uri = imageURI;
            $scope.viewState.isUpdate = false;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };

    $scope.btnSaveClick = function () {
        var vinCode = $scope.viewState.vinCode;
        var vin1PhotoUri = $scope.viewState.vin1PhotoUri;
        var vin2PhotoUri = $scope.viewState.vin2PhotoUri;
        var vin3PhotoUri = $scope.viewState.vin3PhotoUri;
        var vin4PhotoUri = $scope.viewState.vin4PhotoUri;


        var note = "";
        note = $scope.viewState.remark;
       
        //if ($scope.viewState.note.NoteName == '其他（手工填写）') {
        //    note = $scope.viewState.customNoteName;
        //} else if ($scope.viewState.note.NoteName == '无') {
        //    note = '';
        //} else {
        //    note = $scope.viewState.note.NoteName;
        //}
        var vin1PhotoName = vin1PhotoUri == '' ? '' : vinCode + '_01' + '.jpg';
        var vin2PhotoName = vin2PhotoUri == '' ? '' : vinCode + '_02' + '.jpg';
        var vin3PhotoName = vin3PhotoUri == '' ? '' : vinCode + '_03' + '.jpg';
        var vin4PhotoName = vin4PhotoUri == '' ? '' : vinCode + '_04' + '.jpg';

        Answer.saveVINPhotoNameAndNoteName(vinCode, note, vin1PhotoName, vin2PhotoName, vin3PhotoName, vin4PhotoName, function () {
            try {
                FileHelper.createDir(cordova.file.externalRootDirectory, "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表/", function () {
                    if (vin1PhotoName != '') {
                        var url = vin1PhotoUri.split("/");
                        fileName = url[url.length - 1];
                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin1PhotoName)
                        .then(function (success) {
                            if (vin2PhotoName != '') {
                                var url = vin2PhotoUri.split("/");
                                fileName = url[url.length - 1];
                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin2PhotoName)
                                .then(function (success) {
                                    if (vin3PhotoName != '') {
                                        var url = vin3PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                        .then(function (success) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        }, function (error) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        })
                                    }
                                    else {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }

                                }, function (error) {
                                    if (vin3PhotoName != '') {
                                        var url = vin3PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                        .then(function (success) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        }, function (error) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        })
                                    }
                                    else {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }
                                })
                            } else {
                                if (vin3PhotoName != '') {
                                    var url = vin3PhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                    .then(function (success) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }, function (error) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    })
                                }
                                else {
                                    if (vin4PhotoName != '') {
                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                }
                            }

                        }, function (error) {
                            if (vin2PhotoName != '') {
                                var url = vin2PhotoUri.split("/");
                                fileName = url[url.length - 1];
                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin2PhotoName)
                                .then(function (success) {
                                    if (vin3PhotoName != '') {
                                        var url = vin3PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                        .then(function (success) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        }, function (error) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        })
                                    }
                                    else {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }

                                }, function (error) {
                                    if (vin3PhotoName != '') {
                                        var url = vin3PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                        .then(function (success) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        }, function (error) {
                                            if (vin4PhotoName != '') {
                                                var url = vin4PhotoUri.split("/");
                                                fileName = url[url.length - 1];
                                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                                .then(function (success) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                }, function (error) {
                                                    $cordovaToast.showShortBottom('保存成功');
                                                    $ionicHistory.nextViewOptions({
                                                        disableBack: true
                                                    });
                                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                                })

                                            }
                                            else {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }
                                        })
                                    }
                                    else {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }
                                })
                            } else {
                                if (vin3PhotoName != '') {
                                    var url = vin3PhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                    .then(function (success) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }, function (error) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    })
                                }
                                else {
                                    if (vin4PhotoName != '') {

                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];

                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                }
                            }

                        })
                    }
                    else {

                        if (vin2PhotoName != '') {
                            var url = vin2PhotoUri.split("/");
                            fileName = url[url.length - 1];
                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin2PhotoName)
                            .then(function (success) {
                                if (vin3PhotoName != '') {
                                    var url = vin3PhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                    .then(function (success) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }, function (error) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    })
                                }
                                else {
                                    if (vin4PhotoName != '') {
                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                }

                            }, function (error) {
                                if (vin3PhotoName != '') {
                                    var url = vin3PhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                    .then(function (success) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    }, function (error) {
                                        if (vin4PhotoName != '') {
                                            var url = vin4PhotoUri.split("/");
                                            fileName = url[url.length - 1];
                                            $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                            .then(function (success) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            }, function (error) {
                                                $cordovaToast.showShortBottom('保存成功');
                                                $ionicHistory.nextViewOptions({
                                                    disableBack: true
                                                });
                                                $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                            })

                                        }
                                        else {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }
                                    })
                                }
                                else {
                                    if (vin4PhotoName != '') {
                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                }
                            })
                        } else {
                            if (vin3PhotoName != '') {
                                var url = vin3PhotoUri.split("/");
                                fileName = url[url.length - 1];
                                $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin3PhotoName)
                                .then(function (success) {
                                    if (vin4PhotoName != '') {
                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                }, function (error) {
                                    if (vin4PhotoName != '') {
                                        var url = vin4PhotoUri.split("/");
                                        fileName = url[url.length - 1];
                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                        .then(function (success) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        }, function (error) {
                                            $cordovaToast.showShortBottom('保存成功');
                                            $ionicHistory.nextViewOptions({
                                                disableBack: true
                                            });
                                            $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                        })

                                    }
                                    else {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }
                                })
                            }
                            else {
                                if (vin4PhotoName != '') {
                                    var url = vin4PhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/经销商库存表", vin4PhotoName)
                                    .then(function (success) {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    }, function (error) {
                                        $cordovaToast.showShortBottom('保存成功');
                                        $ionicHistory.nextViewOptions({
                                            disableBack: true
                                        });
                                        $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                    })

                                }
                                else {
                                    $cordovaToast.showShortBottom('保存成功');
                                    $ionicHistory.nextViewOptions({
                                        disableBack: true
                                    });
                                    $state.go('tab.dash', { searchText: $scope.viewState.searchText, isAllVinCode: $scope.viewState.isAllVinCode, timeStamp: (new Date()).toString() }, { reload: true });
                                }
                            }
                        }
                    }
                })

            } catch (e) {
                alert(e.message);
            }
        }
        );
    };
})
//在库不在系统
.controller('ChatsCtrl', function ($scope, $rootScope, $cordovaCamera, $cordovaFile, $cordovaToast, $state, $ionicLoading, $stateParams, $ionicHistory, FileHelper, Answer) {
    $scope.viewState = {
        vinCode: '',
        carType: {},
        note: {},
        customNoteName: '',
        vin_img_uri: 'img/ionic.png',
        car_img_uri: 'img/ionic.png',
        vinfp_img_uri: 'img/ionic.png',
        vinPhotoUri: '',
        carPhotoUri: '',
        vinfpPhotoUri: ''
    };
    $scope.carTypeList = new Array();
    $scope.noteList = new Array();

    Answer.getAllCarType(function (res) {
        $scope.carTypeList.push({ CarTypeName: "选择" });
        for (var i = 0; i < res.rows.length; i++) {
            $scope.carTypeList.push(res.rows.item(i));
        }
        $scope.viewState.carType = $scope.carTypeList[0];
    });
    Answer.getAllNoteB(function (res) {
        $scope.noteList.push({ NoteName: "无" });
        for (var i = 0; i < res.rows.length; i++) {
            $scope.noteList.push(res.rows.item(i));
        }
        $scope.viewState.note = $scope.noteList[0];
    });
    if ($stateParams.vinCode != null && $stateParams.vinCode.length > 0) {
        if ($stateParams.vinCode != "0") {
            $scope.viewState.vinCode = $stateParams.vinCode;
            console.info("2");
            Answer.initData($scope.viewState.vinCode, initDataCallback);
        }
    }

    $scope.vinCodeChanged = function () {
        $scope.viewState.carType = $scope.carTypeList[0];
        $scope.viewState.note = $scope.noteList[0];
        $scope.viewState.vin_img_uri = 'img/ionic.png';
        $scope.viewState.vinPhotoUri = '';
        $scope.viewState.car_img_uri = 'img/ionic.png';
        $scope.viewState.carPhotoUri = '';
        $scope.viewState.vinfp_img_uri = 'img/ionic.png';
        $scope.viewState.vinfpPhotoUri = '';

        if ($scope.viewState.vinCode.length == 17) {
            Answer.initData($scope.viewState.vinCode, initDataCallback);
        }
    };
    $scope.vinPicture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vinPhotoUri = imageURI;
            $scope.viewState.vin_img_uri = imageURI;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };
    $scope.carPicture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.carPhotoUri = imageURI;
            $scope.viewState.car_img_uri = imageURI;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };
    $scope.vinfpPicture = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,//Camera.DestinationType.DATA_URL,FILE_URI
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            correctOrientation: true
        };
        $cordovaCamera.getPicture(options).then(function (imageURI) {
            $scope.viewState.vinfpPhotoUri = imageURI;
            $scope.viewState.vinfp_img_uri = imageURI;
            $ionicLoading.hide();
        }, function (err) { $ionicLoading.hide() });
    };
    $scope.btnSaveClick = function () {
        var vinCode = $scope.viewState.vinCode;
        var carType = $scope.viewState.carType.CarTypeName;
        var note = '';
        var vinPhotoUri = $scope.viewState.vinPhotoUri;
        var carPhotoUri = $scope.viewState.carPhotoUri;
        var vinfpPhotoUri = $scope.viewState.vinfpPhotoUri;
        if ($scope.viewState.note.NoteName == '其他（手工填写）') {
            note = $scope.viewState.customNoteName;
        } else if ($scope.viewState.note.NoteName == '无') {
            note = '';
        } else {
            note = $scope.viewState.note.NoteName;
        }

        if (vinCode.length != 17) {
            $cordovaToast.showShortCenter('VIN号码格式不正确'); return;
        }
        if (carType == "选择") {
            $cordovaToast.showShortCenter('请选择车型'); return;
        }
        if ($scope.viewState.note.NoteName != '无' && note == '') {
            $cordovaToast.showShortCenter('请手工填写备注'); return;
        }
        if (vinPhotoUri == '') {
            $cordovaToast.showShortCenter('请对VIN号码拍照'); return;
        }
        if (carPhotoUri == '') {
            $cordovaToast.showShortCenter('请对车尾拍照'); return;
        }

        var vinPhotoName = vinCode + '.jpg';
        var carPhotoName = vinCode + '_车尾.jpg';
        var vinfpPhotoName = vinfpPhotoUri == '' ? '' : vinCode + '_销售发票' + '.jpg';
        Answer.saveVINCode(vinCode, carType, note, vinPhotoName, carPhotoName, vinfpPhotoName, function (msg) {
            if (msg == '保存成功') {
                FileHelper.createDir(cordova.file.externalRootDirectory, "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/", function () {
                    //copy vinPhoto to sdcard
                    var url = vinPhotoUri.split("/");
                    var fileName = url[url.length - 1];
                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", vinPhotoName)
                                .then(function (success) {
                                    //copy carPhoto to sdcard
                                    url = carPhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", carPhotoName)
                                                .then(function (success) {
                                                    if (vinfpPhotoUri != '') {
                                                        //copy vinfpPhoto to sdcard
                                                        url = vinfpPhotoUri.split("/");
                                                        fileName = url[url.length - 1];
                                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", vinfpPhotoName)
                                                                    .then(function (success) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    }, function (error) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    });
                                                    } else {
                                                        $cordovaToast.showShortBottom('保存成功');
                                                        $ionicHistory.nextViewOptions({
                                                            disableAnimate: true,
                                                            disableBack: true
                                                        });
                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                    }
                                                }, function (error) {
                                                    if (vinfpPhotoUri != '') {
                                                        //copy vinfpPhoto to sdcard
                                                        url = vinfpPhotoUri.split("/");
                                                        fileName = url[url.length - 1];
                                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", vinfpPhotoName)
                                                                    .then(function (success) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    }, function (error) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    });
                                                    } else {
                                                        $cordovaToast.showShortBottom('保存成功');
                                                        $ionicHistory.nextViewOptions({
                                                            disableAnimate: true,
                                                            disableBack: true
                                                        });
                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                    }
                                                });
                                }, function (error) {
                                    //copy carPhoto to sdcard
                                    url = carPhotoUri.split("/");
                                    fileName = url[url.length - 1];
                                    $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", carPhotoName)
                                                .then(function (success) {
                                                    if (vinfpPhotoUri != '') {
                                                        //copy vinfpPhoto to sdcard
                                                        url = vinfpPhotoUri.split("/");
                                                        fileName = url[url.length - 1];
                                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", vinfpPhotoName)
                                                                    .then(function (success) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    }, function (error) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    });
                                                    } else {
                                                        $cordovaToast.showShortBottom('保存成功');
                                                        $ionicHistory.nextViewOptions({
                                                            disableAnimate: true,
                                                            disableBack: true
                                                        });
                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                    }
                                                }, function (error) {
                                                    if (vinfpPhotoUri != '') {
                                                        //copy vinfpPhoto to sdcard
                                                        url = vinfpPhotoUri.split("/");
                                                        fileName = url[url.length - 1];
                                                        $cordovaFile.moveFile(cordova.file.externalApplicationStorageDirectory + "cache/", fileName, cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表", vinfpPhotoName)
                                                                    .then(function (success) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    }, function (error) {
                                                                        $cordovaToast.showShortBottom('保存成功');
                                                                        $ionicHistory.nextViewOptions({
                                                                            disableAnimate: true,
                                                                            disableBack: true
                                                                        });
                                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                                    });
                                                    } else {
                                                        $cordovaToast.showShortBottom('保存成功');
                                                        $ionicHistory.nextViewOptions({
                                                            disableAnimate: true,
                                                            disableBack: true
                                                        });
                                                        $state.go('tab.chats', { vinCode: '0' }, { reload: true });
                                                    }
                                                });
                                });
                });
            } else {
                alert(msg);
            }
        });
    };

    function initDataCallback(model) {

        for (var i = 0; i < $scope.carTypeList.length; i++) {
            if ($scope.carTypeList[i].CarTypeName == model.CarTypeName) {
                $scope.viewState.carType = $scope.carTypeList[i];
                break;
            }
        }

        if (model.Remark && model.Remark.length > 0) {
            var matched = false;
            for (var i = 0; i < $scope.noteList.length; i++) {
                if ($scope.noteList[i].NoteName == model.Remark) {
                    $scope.viewState.note = $scope.noteList[i];
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                $scope.viewState.note = $scope.noteList[$scope.noteList.length - 1];
                $scope.viewState.customNoteName = model.Remark;
            }
        }

        if (model.PhotoName == null || model.PhotoName == "") {

        }
        else {
            var photoNameArray = model.PhotoName.split(';');
            var vinPhotoName = photoNameArray[0];
            var carPhotoName = photoNameArray[1];
            var vinfpPhotoName = photoNameArray[2];

            $scope.viewState.vin_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + vinPhotoName + "?lastmod=" + (new Date()).toString();
            $scope.viewState.vinPhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + vinPhotoName;
            $scope.viewState.car_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + carPhotoName + "?lastmod=" + (new Date()).toString();
            $scope.viewState.carPhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + carPhotoName;
            if (vinfpPhotoName != null && vinfpPhotoName != "") {
                $scope.viewState.vinfp_img_uri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + vinfpPhotoName + "?lastmod=" + (new Date()).toString();
                $scope.viewState.vinfpPhotoUri = cordova.file.externalRootDirectory + "一汽丰田/" + $rootScope.projectCode + "/" + $rootScope.shopCode + $rootScope.shopName + "/在库未在系统统计表/" + vinfpPhotoName;
            }
        }

        $ionicLoading.hide();
    }
})

.controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})
//结果导出
.controller('AccountCtrl', function ($scope, $cordovaToast, Answer) {
    $scope.export = function () {
        try {
            Answer.getExportData(function (res1, res2) {
                var answerList1 = new Array();
                for (var i = 0; i < res1.rows.length; i++) {
                    if (res1.rows.item(i).PhotoName.indexOf("_销售发票") >= 0) {
                        res1.rows.item(i).PhotoName = "";
                    }
                    answerList1.push(res1.rows.item(i));
                }
                var answerList2 = new Array();
                for (var i = 0; i < res2.rows.length; i++) {
                    answerList2.push(res2.rows.item(i));
                }

                window.echo([answerList1, answerList2], function (echoValue) {
                    $cordovaToast.showLongCenter('导出成功\n' + '文件名：\n' + echoValue);
                });
            });
        } catch (e) {
            alert(e.message);
        }
    }
});