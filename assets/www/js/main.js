/* 2014/01/01 start */
/* by wenjen sung */

//service name
//var SRV_GetListItems = "http://192.168.1.109:5000/api/items/"; // 需要URL參數
//var SRV_PostData = "http://192.168.1.109:5000/api/post/"; //上傳資料
//var SRV_QueryAll = "http://192.168.1.109:5000/api/query/all/"; // 查詢所有資料
//var SRV_GetImage = "http://192.168.1.109:5000/api/file/";//透過ID抓圖 需要URL參數
//var SRV_CheckUserHashCode = "http://192.168.1.109:5000/api/user/check/"; //驗證使用者雜湊碼(sha1) 需要URL參數

var SRV_GetListItems = "http://infosrv.hanlin.com.tw/api/items/"; // 需要URL參數
var SRV_PostData = "http://infosrv.hanlin.com.tw/api/post/"; //上傳資料
var SRV_QueryAll = "http://infosrv.hanlin.com.tw/api/query/all/"; // 查詢所有資料
var SRV_GetImage = "http://infosrv.hanlin.com.tw/api/file/";//透過ID抓圖 需要URL參數
var SRV_CheckUserHashCode = "http://infosrv.hanlin.com.tw/api/user/check/"; //驗證使用者雜湊碼(sha1) 需要URL參數

var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var file_items_infoYear = "info_year.txt";
var file_items_infoTarget = "info_Target.txt";
var file_items_infoClass = "info_Class.txt";
var file_items_infoField = "info_Field.txt";
var file_items_infoCreator = "info_Creator.txt";
//可以改成檔案或後端資料庫維護方式更具彈性
var FIELD_NAME_MAP = {
    "info_Year":"年段",
    "info_Content":"內容",
    "info_Field":"領域",
    "info_Create_Date":"建立日期",
    "info_Creator":"建立者",
    "info_Class":"情報種類",
    "info_Memo":"備註",
    "info_Target":"情報目標",
    "info_Subject":"主旨" };

var JSON_KEY_MAP_VALUE = "";
var file_account = "my.txt";

//認證資訊
var HASH_CODE = "";
var USERNAME = "";
var PASSWORD = "";

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;


    //Page2 select Items refresh
    $(document).delegate("#page2", "pagecreate", function(){
        listItemSetup('year','page2_txtYear');
        listItemSetup('target','page2_txtTarget');
        listItemSetup('creator','page2_txtCreator');
        listItemSetup('class','page2_txtClass');
        listItemSetup('field','page2_txtField');
    });

    //Page2 select Items refresh
    $(document).delegate("#page32", "pagecreate", function(){
        loadAccountInfo();
    });

}

/*$(document).ready(function(){

 })*/

/* ------------------------------------------ Func  ------------------------------------------*/

/*=============== datePicker() 日期欄位 ===================*/
{
    function datePicker(){
        var currentField = $("#page2_txtCreateDate");
        var myNewDate = new Date();

        // Same handling for iPhone and Android
        window.plugins.datePicker.show({
            date : myNewDate,
            mode : 'date', // date or time or blank for both
            allowOldDates : true
        }, function(returnDate) {
            var array = returnDate.split("/");
            var day = array[2], month = array[1];
            if (day <= 9)
                day = "0" + day;
            if (month <= 9)
                month = "0" + month;
            currentField.val(array[0] + "-" + month + "-" + day);
            // This fixes the problem you mention at the bottom of this script with it not working a second/third time around, because it is in focus.
            currentField.blur();
        });
    }
}

/*===============  fileSystemFail() Filesystem 共通性錯誤處理 ===================*/
{
    function fileSystemFail(error) {
        alert("FileSystem Fail!! "+error.code);
    }
}

/*=============== itemsSetup() 設定選項 ===================*/
{
    function listItemSetup(SelectFieldName, FieldId){
        //$('#'+FieldId).empty();
        // 檔案載入
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            var itemsFileName = "";
            if(SelectFieldName=="year"){
                itemsFileName = file_items_infoYear;
            }else if(SelectFieldName=="target"){
                itemsFileName = file_items_infoTarget;
            }else if(SelectFieldName=="class"){
                itemsFileName = file_items_infoClass;
            }else if(SelectFieldName=="field"){
                itemsFileName = file_items_infoField;
            }else if(SelectFieldName=="creator"){
                itemsFileName = file_items_infoCreator;
            }

            fileSystem.root.getFile(itemsFileName, null, function(fileEntry){
                fileEntry.file(function(file){
                    var reader = new FileReader();
                    reader.onloadend = function(evt){
                        var s = evt.target.result;
                        //var lines = s.replace(/\r\n/g, "\n").split("\n");
                        var lines = s.split("\r\n");
                        //餵給選項
                        $('#'+FieldId).find("option").remove();
                        for(var v1=0; v1<lines.length; v1++){
                            //alert(lines[v1]);
                            try{
                                var obj_json = $.parseJSON(lines[v1]);// string to json
                                //如果值與顯示不同
                                //$('#'+FieldId).append('<option value="' + obj_json.value + '">' + obj_json.name + '</option>');
                                //如果值與顯示相同
                                $('#'+FieldId).append('<option value="' + obj_json.name + '">' + obj_json.name + '</option>');
                            }catch(err) {
                                alert(err.toString());
                            }
                        }
                    }
                    reader.readAsText(file);
                }, fileSystemFail);
            }, fileSystemFail);
        }, fileSystemFail);
    }
}

/*=============== updateItemsList() 更新選項來源 =================== */
// year , target , field , class , creator
{
    function updateItemsList(SelectFieldName){
        //從遠端服務更新，存入檔案
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            var itemsFileName = "";
            if(SelectFieldName=="year"){
                itemsFileName = file_items_infoYear;
            }else if(SelectFieldName=="target"){
                itemsFileName = file_items_infoTarget;
            }else if(SelectFieldName=="class"){
                itemsFileName = file_items_infoClass;
            }else if(SelectFieldName=="field"){
                itemsFileName = file_items_infoField;
            }else if(SelectFieldName=="creator"){
                itemsFileName = file_items_infoCreator;
            }
            fileSystem.root.getFile(itemsFileName, {create: true, exclusive: false}, function(fileEntry){
                fileEntry.createWriter(function(writer){
                    writer.onwriteend = function(evt) {
                        alert(itemsFileName+"更新完成!");
                    };
                    //從遠端服務更新
                    var request = $.ajax({
                        url:SRV_GetListItems+SelectFieldName+"/",
                        type: 'GET',
                        contentType: 'application/json; charset=utf-8', //"text/html; charset=utf-8"
                        dataType: 'json',
                        success:function(r){
                            var optionsStr = "";
                            //alert(r.toLocaleString());
                            var rCount = 0;
                            for(var key in r){
                                var count = 0;
                                var item = $.parseJSON(r[key]);
                                if(item){
                                    //var title = count.toString();
                                    if(rCount==0){
                                        optionsStr += "{";
                                    }else{
                                        optionsStr += "\r\n{";
                                    }
                                    for(var key1 in item){
                                        if (count == 0){
                                            optionsStr += "\"" +key1 + "\":\"" + item[key1] + "\"";
                                            //optionsStr += key1 + ":" + item[key1];
                                        }else{
                                            optionsStr += ",\"" + key1 + "\":\"" + item[key1] + "\"";
                                            //optionsStr += "," + key1 + ":" + item[key1];
                                        }
                                        count++;
                                    }
                                    optionsStr += "}";
                                }
                                rCount++;
                            }
                            writer.write(optionsStr);//結果寫入
                        },
                        error:function(error){
                            alert("updateItemsFile_infoYear error: " + error.toString());
                        }
                    });
                },fileSystemFail);
            }, fileSystemFail);
        }, fileSystemFail);
    }
}

/*=============== page2_Camera() 使用照相 ===================*/
{
    // 使用照相
    function page2_Camera(source){
        navigator.camera.getPicture(
            function(imageURI){
                var largeImage = document.getElementById('page2_cameraImage');
                largeImage.style.display = 'block';
                largeImage.src = imageURI;
            },
            function(evt){
                alert(evt.target.error.code);
            },
            {
                quality: 50,
                destinationType: destinationType.FILE_URI,
                allowEdit:true,
                saveToPhotoAlbum:true,
                correctOrientation:true,
                sourceType:source
            });
    }
}

/*=============== page2_Save() 儲存資料 ===================*/
{
    //儲存資料
    function page2_Save(){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            function(fileSystem){
                var image_path = $("#page2_cameraImage").prop("src");
                alert($("#page2_cameraImage").prop("src"));
                var rootDir = fileSystem.root;//檔案系統根路徑(filesystem用法上Phonegap官網API文件詳查)
                var image_rel_path = image_path.replace(rootDir.fullPath+"/", ""); // 只要 root 以下的路徑
                //照片+表單資料 傳遞給遠端服務
                var fs = rootDir.getFile(image_rel_path, null,
                    function(fileEntry){
                        fileEntry.file(function(file){
                            var upload_url = SRV_PostData; //遠端服務位置名稱
                            var options = new FileUploadOptions();
                            var filename = file.fullPath;
                            options.fileKey = "info_img1";
                            options.fileName = filename.substr(filename.lastIndexOf("/")+1);
                            options.mimeType = "image/jpeg";
                            var params = {};
                            // 表單文字資料藉由 Filesystem 的 FileTransfer 上傳檔案之便，以參數型式順便丟過去
                            params.info_Year = $("#page2_txtYear").val();
                            params.info_Create_Date = $("#page2_txtCreateDate").val();
                            params.info_Target = $("#page2_txtTarget").val();
                            params.info_Creator = $("#page2_txtCreator").val();
                            params.info_Class = $("#page2_txtClass").val();
                            params.info_Field = $("#page2_txtField").val();
                            params.info_Subject = $("#page2_txtSubject").val();
                            params.info_Content = $("#page2_txtContent").val();
                            params.info_Memo = $("#page2_txtMemo").val();
                            options.params = params;
                            var ft = new FileTransfer();
                            // 開始上傳
                            ft.upload(filename, upload_url,
                                function(r){
                                    alert("Code = " + r.responseCode);
                                    alert("Response = " + r.response);
                                    alert("Sent = " + r.bytesSent);
                                    //page2_Submit_TextData(r.response);
                                },
                                function(error){
                                    alert("An error has occurred: Code = " + error.code);
                                    alert("upload error source " + error.source);
                                    alert("upload error target " + error.target);
                                },
                                options, true);
                        }, page2_Submit_Fail);
                    },
                    function(error){
                        alert("filesystem getFile fail: "+error.code);
                    });
            },
            page2_Submit_Fail
        );
    }

    function page2_Submit_Fail(evt){
        alert(evt.target.error.code);
    }
}

/*=============== page1_QueryData() 查詢資料 ===================*/
function page1_QueryData(){
    $('#page1_first_content').empty();
    var request = $.ajax({
        url:SRV_QueryAll,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success:function(r){
            var count = 0;
            for(var key in r){
                count++;
                var item = $.parseJSON(r[key]);
                if(item){
                    var title = count.toString();
                    var span_content1 = '';
                    for(var key1 in item){
                        if(key1=='image'){
                            //圖片資料
                            var image_id_object = item[key1];
                            var image_id = image_id_object['$oid'];
                            var image_url = SRV_GetImage + image_id;
                        }else{
                            //文字資料
                            compareJSONKeyReturnValue(key1, FIELD_NAME_MAP);
                            //span_content1 += '<p>'+key1+':'+item[key1]+'</p>';
                            span_content1 += '<p>'+JSON_KEY_MAP_VALUE+':'+item[key1]+'</p>';
                        }
                    }
                    // 有圖片
                    if(image_url){
                        span_content1 += '<img  style="width: 100px; height: 100px" src="'+ image_url +'" />';
                    }
                    var html = '<div data-role="collapsible" data-collapsed="true"><h3>'+title+'</h3><span style="text-align: left">'+span_content1+'</span></div>';
                    var $element = $(html).appendTo($('#page1_first_content'));
                    $element.collapsible();
                }
            }
        },
        error:function(error){
            alert("An error has occurred: Code = " + error.code);
            alert("upload error source " + error.source);
            alert("upload error target " + error.target);
        }
    });
}

/*=============== compareJSONKeyReturnValue() 比對JSON取值 ===================*/
function compareJSONKeyReturnValue(compareString, jsonObject){
    JSONMAPVALUE = "";
    try{
        jQuery.each(jsonObject, function(i, val){
            if(i==compareString){
                JSON_KEY_MAP_VALUE = val;
            }
        });
    }catch (ex){
        return ex.toString();
    }
}

/*=============== saveUserAccount()  儲存帳號資訊===================*/
function saveUserAccount(){
    //儲存帳號資訊
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        var username = $("#page32_UserName").val();
        var password = $("#page32_Password").val();
        fileSystem.root.getFile(file_account, {create: true, exclusive: false}, function(fileEntry){
            fileEntry.createWriter(function(writer){
                writer.onwriteend = function(evt) {
                    alert(file_account+"儲存完成!");
                };
                writer.write('{"username":"'+username+'","password":"'+password+'"}');//結果寫入
            },fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
}

/*=============== securityCheck()  提取帳號資訊驗證===================*/
function userCheck(){
    // 帳號資訊檔案載入
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    HASH_CODE = $.sha256(obj_json.password);
                    USERNAME = obj_json.username;
                    PASSWORD = obj_json.password;
                }
                reader.readAsText(file);
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);

    //傳送資訊驗證
    if(HASH_CODE=="" || HASH_CODE==null || HASH_CODE=="undefined" || HASH_CODE==false){
        return false;
    }
    var request = $.ajax({
        url:SRV_CheckUserHashCode+HASH_CODE,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success:function(r){
            //alert("OK! ");
            var count = 0;
            for(var key in r){
                count++;
                var item = $.parseJSON(r[key]);
                if(item){
                    var title = count.toString();
                    var span_content1 = '';
                    for(var key1 in item){
                        if(key1=='image'){
                            //圖片資料
                            var image_id_object = item[key1];
                            var image_id = image_id_object['$oid'];
                            var image_url = SRV_GetImage + image_id;
                        }else{
                            //文字資料
                            compareJSONKeyReturnValue(key1, FIELD_NAME_MAP);
                            //span_content1 += '<p>'+key1+':'+item[key1]+'</p>';
                            span_content1 += '<p>'+JSON_KEY_MAP_VALUE+':'+item[key1]+'</p>';
                        }
                    }
                    // 有圖片
                    if(image_url){
                        span_content1 += '<img  style="width: 100px; height: 100px" src="'+ image_url +'" />';
                    }
                    var html = '<div data-role="collapsible" data-collapsed="true"><h3>'+title+'</h3><span style="text-align: left">'+span_content1+'</span></div>';
                    var $element = $(html).appendTo($('#page1_first_content'));
                    $element.collapsible();
                }
            }
        },
        error:function(error){
            alert("An error has occurred: Code = " + error.code);
            alert("upload error source " + error.source);
            alert("upload error target " + error.target);
        }
    });

}

/*=============== loadAccountInfo()  載入帳號資訊到頁面上===================*/
function loadAccountInfo(){
    // 帳號資訊檔案載入
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    $("#page32_UserName").attr("value", obj_json.username);
                    $("#page32_Password").attr("value", obj_json.password);
                    HASH_CODE = $.sha256(obj_json.password);
                    USERNAME = obj_json.username;
                    PASSWORD = obj_json.password;
                }
                reader.readAsText(file);
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
}


