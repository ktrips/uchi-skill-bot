const line = require('@line/bot-sdk');
var request = require('request');
var async = require('async');
var res;

var event;
var context;
var callback;
var https= require('https');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKETNAME;
const fs = require('fs');

var dynamodb       = new AWS.DynamoDB({region: 'us-east-1'});
var dynamoDocClient= new AWS.DynamoDB.DocumentClient();
const TableName    = process.env.TABLENAME;
var dataTypeWords  = "答え、問題、その他";
var dataCategoryWords = "漢字、英語、質問";

var skillName= "うちの神";
var kanjiSlot= ["漢字","かんじ","漢", "漢語"];
var engSlot  = ["English","english","英語","英","えいご","米語"];
var engWord  = {"N":"名詞","V":"動詞","A":"形容詞","O":"その他"};
var hyakuSlot= ["百人一首","かるた","カルタ","百人","一首"];
var kanNum   = {"一":1, "二":2, "三":3, "四":4, "五":5, "六":6, "１":1, "２":2, "３":3, "４":4, "５":5, "６":6};
var grades   = {"幼":"k", "小":"", "中":"j", "高":"h", "大":"u"};

//random_grade = "小"+str(random.randint(1,6));

var testSets= ["小3", "漢字", 2, "ちはや", "N", "ゆっくり"];
//[grade, subject, read number, hyaku word, answer, speed]
var default_read= 10;
var break_time  = 5;
var add_message = testSets[0]+"の"+testSets[1]+"を読み上げて！などと聞いてみて下さい！";
var help_message= skillName+"は、小・中学生の漢字や、中学の英語、百人一首などを読み上げます。"+add_message;
var end_message = skillName+"を使ってくれてありがとう！また何でも聞いてね！";

var prb_word = ["問題","問い","質問","Pr"]
var ans_word = ["答え","応え","回答","解答","解","応","答","An"]

var speaker = "クローバ";
var line_bot_url = "https://api.line.me/v2/bot";

var date = new Date();
var dd = ("0"+date.getDate()).slice(-2);
var year = date.getFullYear();
var month= ("0"+(date.getMonth()+1)).slice(-2);
var week = date.getDay();
var day  = ("0"+date.getDate()).slice(-2);
var hour = ("0"+date.getHours()).slice(-2);
var minute=("0"+date.getMinutes()).slice(-2);
var second=("0"+date.getSeconds()).slice(-2);
var today = year + month + day;
var timetext= year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second;

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    res = event.events[0];
    var msgReply= res.replyToken.toString();
  	var msgType = res.message.type;
  	var msgId   = res.message.id;
  	var msgOriginal = res.message.text;
  	var userId  = res.source.userId;
  	var userType= res.source.type;
  	var msgTime = timetext; //res.timestamp.toString();
  	var msgImage= line_bot_url + '/message/' + res.message.id +'/content';
    var displayName= "Noname"
    console.log(msgId+"-"+msgType+"-"+msgReply+"-"+userType+userId+"-"+msgTime+msgImage+displayName);

    var comm = "";
    async.waterfall([
        function recognize(callback) {
            if (msgType === 'text') {
            	console.log('rec text:' + msgOriginal.substr(0, 2));
              if (msgOriginal.substr(0, 2) == "設定") {
              	comm = "setup";
              	if (msgOriginal.substr(3, 2) == "写真") {
              		comm += "-image";
              	} else if (msgOriginal.substr(3, 2) == "名前") {
		              comm += '-name';
		            } else if (msgOriginal.substr(3, 2) == "予定" || msgOriginal.substr(3, 2) == "カレ") {
		              comm += '-calendar';
		            } else if (msgOriginal.substr(3, 2) == "ニュ" || msgOriginal.substr(3, 2) == "情報") {
		              comm += '-news';
		            } else if (msgOriginal.substr(3, 2) == "経路" || msgOriginal.substr(3, 2) == "行き") {
		              comm += '-route';
		            } else if (msgOriginal.substr(3, 3) == "家" || msgOriginal.substr(3, 2) == "会社") {
		              comm += '-fromto';

              	} else if (msgOriginal.substr(3, 2) == "お家" || msgOriginal.substr(3, 1) == "家" || msgOriginal.substr(3, 3) == "おうち") {
              		comm += "-uchi";
              	} else if (msgOriginal.substr(3, 4) == "おはよう") {
              		comm += "-morning";
              	} else if (msgOriginal.substr(3, 3) == "いって" || msgOriginal.substr(3, 3) == "行って") {
              		comm += "-go";
              	} else if (msgOriginal.substr(3, 4) == "ただいま") {
              		comm += "-home";
              	} else if (msgOriginal.substr(3, 4) == "おやすみ") {
              		comm += "-night";
              	} else if (msgOriginal.substr(3, 2) == "好み" || msgOriginal.substr(3, 3) == "お気に") {
              		comm += "-favorite";
              	}

              } else if (msgOriginal.substr(0, 2) == "名前") {
            	comm = 'def-name';
              } else if (msgOriginal.substr(0, 2) == "予定" || msgOriginal.substr(0, 2) == "カレ") {
            	comm = 'def-calendar';
              } else if (msgOriginal.substr(0, 2) == "経路" || msgOriginal.substr(0, 2) == "行き") {
            	comm = 'def-route';
              } else if (msgOriginal.substr(0, 2) == "時間" || msgOriginal.substr(0, 2) == "タイ") {
            	comm = 'def-time';
              } else if (msgOriginal.substr(0, 2) == "ニュ" || msgOriginal.substr(0, 2) == "記事") {
            	comm = 'def-news';
              } else if (msgOriginal.substr(0, 2) == "ファ" || msgOriginal.substr(0, 2) == "fa") {
            	comm = 'def-fashion';
              }
              console.log(comm);
              callback(null, comm);

            } else if (msgType === 'image') {
              callback(null, 'image');

            } else {
              callback(null, 'other');
            }
        },
        function main_exec(data, callback) {
         async.waterfall([
          function recognize(callback2) {
            if (userType == 'user') {
              var opts = {
                  url: line_bot_url + '/profile/' + userId,
                  json: true,
                  headers: {'Authorization': 'Bearer '+process.env.ACCESSTOKEN}
              };
              request.get(opts, function(error, response, body) {
                  if (!error && response.statusCode == 200) {
                      console.log(body);
                      displayName = body.displayName;
                  } else {
                    displayName = 'No name';
                  }
              });
            } else {
              displayName = 'No name';
            }
            callback2(null, displayName);
            console.log(msgId+"-"+msgType+"-"+msgReply+"-"+userType+userId+"-"+msgTime+msgImage+displayName);
          },
		 
          function run(displayName, callback) {
            console.log('run data:'+data, displayName);
            const client = new line.Client({
              channelAccessToken: process.env.ACCESSTOKEN
            });
            var dataCategory = "";
            var columns_text = "";
            if (data.substr(0, 5) == "setup") {
              if (data === 'setup-image') {
                dataCategory = "image";
                label = "写真の変更";
                //text = "\uDBC0\uDCB3では、↓下の写真ボタンから、顔写真を撮るか\uDBC0\uDC6A、アップロードしてみて下さい。\uDBC0\uDCB3";
                //carousel
                var message_text = {"type": "template",
                    "altText": label,
                    "template": {"type": "carousel",
                      "actions":[],
                      "columns": [
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/pic_ken.png",
                          "title": "お父さん",
                          "text": "予定: GoogleCalendar\n経路: 丸の内",
                          "actions": [
                            {"type": "message","label": label,"text": "設定 お父さん"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/pic_yura.png",
                          "title": "小学生",
                          "text": "予定: 給食\n経路: 学校",
                          "actions": [
                            {"type": "message","label": label,"text": "設定 小学生"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/pic_sho.png",
                          "title": "中学生",
                          "text": "予定: 時間割\n経路: バス",
                          "actions": [
                            {"type": "message","label": label,"text": "設定 中学生"}
                          ]
                        }
                      ]
                    }
                };

              } else if (data === 'setup-morning') {
                label = "「設定 おはよう」で登録して下さい。";
		var place = "世田谷";
		var today_forcast= get_forcast(place);
		var today_room   = get_room();
		var today_news   = get_news(today);
                //carousel
                var message_text = {"type": "template",
                    "altText": label,
                    "template": {"type": "carousel",
                      "actions":[],
                      "columns": [
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/weather_cloud.png",
                          "title": "天気",
                          "text": today_forcast, //"今日の天気は曇り時々雨\n傘が必要です！",
                          "actions": [
                            {"type":"message", "label":"場所の変更","text":"設定 場所"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/room_living.png",
                          "title": "お部屋",
                          "text": today_room, //"室温: 29度\n湿度: 50％\nエアコン付けましょうか！",
                          "actions": [
                            {"type":"message", "label":"部屋の設定", "text":"設定 部屋"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/news_caster.png",
                          "title": "ニュース",
                          "text": today_news, //"LINE News\n",
                          "actions": [
                            {"type":"message", "label":"ニュースの変更", "text":"設定 ニュース"}
                          ]
                        }
                      ]
                }};

              } else if (data === 'setup-go') {
                label = "「設定 いってきます」で登録して下さい。";
                var message_text = {"type": "template",
                    "altText": label,
                    "template": {"type": "carousel",
                      "actions":[],
                      "columns": [
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/train.png",
                          "title": "経路",
                          "text": "世田谷から秋葉原までの行き方：\n小田急線-(新宿)-JR中央線-(神田)-山手線",
                          "actions": [
                            {"type":"message", "label":"経路の変更","text":"設定 経路"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/fashion.png",
                          "title": "ファッション",
                          "text": "今日の洋服にピッタリのアクセサリーは\n黒ぶち眼鏡です！",
                          "actions": [
                            {"type":"message", "label":"ファッション設定", "text":"設定 ファッション"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/news_blog.png",
                          "title": "注目ブログ",
                          "text": "今日の注目のブログは\nこんな内容です。",
                          "actions": [
                            {"type":"message", "label":"注目の変更", "text":"設定 ニュース"}
                          ]
                        }
                      ]
                }};

              } else if (data === 'setup-home') {
                label = "「設定 ただいま」で登録して下さい。";
                var message_text = {"type": "template",
                    "altText": label,
                    "template": {"type": "carousel",
                      "actions":[],
                      "columns": [
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/room.jpg",
                          "title": "お部屋",
                          "text": "室温: 29度\n湿度: 50％\nエアコン付けましょうか！",
                          "actions": [
                            {"type":"message", "label":"部屋の設定", "text":"設定 部屋"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/room_living.png",
                          "title": "電気",
                          "text": "帰宅時の電球は\nピンクに光ります！",
                          "actions": [
                            {"type":"message", "label":"電球の変更","text":"設定 電球"}
                          ]
                        },
                        {"thumbnailImageUrl": "https://s3.amazonaws.com/uchipacket/room_tv.png",
                          "title": "テレビ",
                          "text": "帰宅時に見たいテレビは\nE-TVのビズチューンです！",
                          "actions": [
                            {"type":"message", "label":"部屋の設定", "text":"設定 部屋"}
                          ]
                        }
                      ]
                }};
              }

              console.log(message_text);
              client.replyMessage(res.replyToken, message_text)
              .then(() => {
                callback(null, {});
              })
              .catch((error) => {
                callback(null, {});
              });
              //callback(null, message_text);

            } else if (data.substr(0, 3) == "def") {
              if (data === 'setup-name') {
                text = "例えば「設定 ケン」など名前を登録して下さい。";

              } else if (data === 'setup-calendar') {
                text = "例えば「予定 ケン GoogleCalendarName」などカレンダーを登録して下さい。";

              } else if (data === 'setup-route') {
                text = "例えば「家 世田谷」、「会社 丸の内」など経路を登録して下さい。";

              } else if (data === 'setup-time') {
                text = "例えば「時間 7時」など起きる時間を登録して下さい。";

              } else if (data == 'def-name') {
		              var keyName = msgOriginal.replace("名前","");
		              if (keyName == "undefined") { keyName = "ゲスト"; }
		              var dataText = keyName;
		              var dataType= "name";

            	} else if (data == 'def-calendar') {
		              var up_msg  = msgOriginal.replace("予定","");
		              var reg     = new RegExp("((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))");
		              var keyName = up_msg.replace(reg,"");
		              var dataText= up_msg.replace(keyName, "");
		              if (dataText== "undefined") {
		              	dataText  = "https://calendar.google.com/calendar/embed?src=oqoob5jal3chv5iq1mombt310k%40group.calendar.google.com";
		              }
		              var dataType= "calendar";

	            } else if (data == 'def-time') {
		              var up_msg  = msgOriginal.replace("時間","");
		              if ( msgOriginal.match(/\d{1}/) ) {
                  		var dataText = msgOriginal.match(/\d{1}/);
                	  } else {
                  		var dataText = 7;
                	  }
		              var keyName = up_msg.replace(dataText,"");
		              var dataType= "time";

	            } else if (data == 'def-news') {
	            	  var up_msg  = msgOriginal.replace("ニュース","");
		              var reg     = new RegExp("((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))");
		              var keyName = up_msg.replace(reg,"");
		              if (keyName == "undefined") { news = "LINE News"; }
		              var dataText= up_msg.replace(keyName, "");
		              var dataType= "news";

	            } else if (data == 'def-fashion') {
		              var keyName = msgOriginal.replace("ファッション","");
		              if (keyName == "undefined") { keyName = "ピアス"; }
		              var dataText = keyName;
		              var dataType= "name";
	            }

		          console.log(msgId+"-"+msgType+"-"+keyName+"-"+userType+dataText+"-"+msgTime+displayName);
	              dynamodb.putItem(
	                  {"TableName": TableName,
	                  "Item": {"id": {"S": msgId},
	                          "msgType": {"S": msgType},
	                          "msgReply": {"S": msgReply},
	                          "displayName": {"S": displayName},
	                          "dataType":{"S": dataType},
	                          "dataCategory":{"S": keyName},
	                          "text": {"S": dataText},
	                          "userId": {"S": userId},
	                          "msgTime": {"S": msgTime},
	                          "msgImage": {"S": msgImage} }
	                  },
	                  function (err, data) {
	                      if (err) { console.log(err, err.stack);
	                      } else { console.log("api_data:"+data);
	                      }
	                  }
	              );

                const problem_text = {
                    "type": "template",
                    "altText": "Problem or Answer?",
                    "template": {
                      "type": "confirm",
                      "text": text,
                      "actions": [
                        {"type": "message", "label": "読み上げ！", "text": "クローバ、読みの神を開いて、問題を読み上げて！と言ってみて下さい \uDBC0\uDC79"},
                        {"type": "message", "label": "採点する！", "text": "マル付けしますね、ちょっと待って下さい \uDBC0\uDC41 \uDBC0\uDC6C"}
                      ]
                    }
                }

	              if (text == "undefined") {
                  text = dataText + "がセットされました！";
                }
                var message_text = {type: 'text', text: text}; //+"\uDBC0\uDC79"};
                console.log(message_text);

                client.replyMessage(res.replyToken, message_text)
                .then(() => {
                  callback(null, {});
                })
                .catch((error) => {
                  callback(null, {});
                });

	              //callback(null, message_text);

            } else if (data === 'answer') {
              console.log("dispN:"+displayName);
              var params = {
                 TableName : TableName,
                 IndexName: 'displayName-index',//インデックス名を指定
                 ExpressionAttributeNames:{'#c': 'displayName'},
                 ExpressionAttributeValues:{':val': 'Ktrips'},
                 KeyConditionExpression: '#c = :val',//検索対象が満たすべき条件を指定
                 ScanIndexForward: false
              }
              dynamoDocClient.query(params, function(err, data) {
                 if (err){ console.log(err, err.stack);
                 } else {
                  var problemData= [];//"No problem!";
                  var answerData = [];//"No answer!";
                   data.Items.forEach(function(mydata, index){
                     console.log(index, mydata.dataType, mydata.text);
                     if (mydata.dataType == 'answer') {
                       answerData = mydata.text;
                     } else if (mydata.dataType == 'problem') {
                       problemData = mydata.text;
                     }
                   });
                   var ansData = answerData.split(','); //Array.of(answerData);
                   var prbData = problemData.split(','); //Array.of(problemData);
                   console.log(ansData, prbData);
                   var result = "アップロード問題の採点結果は、\n";
                   ansData.forEach(function(ans, index){
                      console.log("ans"+index+ans);
                      for (var i=0; i<prbData.length; i++) {
                        console.log("prb"+i+prbData[i]);
                        if (index == i) {
                         if (ans == prbData[i]) {
                           result += "("+index+")"+ans+"は、正解！\n";
                           break;
                         } else {
                           result += "("+index+")"+ans+"は、残念。。\n";
                           break;
                         }
                        }
                      }
                   });
                   text = result+"またやってみて下さいね！\uDBC0\uDC8E"; //"全10問中、3問正解の30点でした！もっとがんばりましょう" + "\uDBC0\uDC8E";
                   callback(null, text);
                 }
              });

            } else if (data === 'time') {
                console.log('run time');
                var text = timetext; //year+"年"+month+"月"+day+"日"+hour+"時"+minute+"分"+second+"秒";
                callback(null, text);

            } else if (data === 'image') {
                async.waterfall([
                    function getImage(callback2) {
                        console.log('get image'+msgId);
                        var opts = {
                            url: line_bot_url + '/message/'+msgId+'/content',
              							headers: {
              								"Content-type": "application/json; charset=UTF-8",
              								"Authorization": " Bearer " + process.env.ACCESSTOKEN
              							},
              							method:'GET',
              							encoding: null
                        };
                        console.log(opts);
                        request(opts, function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var img = body.toString('base64');
                                //console.log(body)
                                // dataは画像のバイナリデータ
                                var save_image = function(body){
                                    var params = {
                                        Bucket: BUCKET_NAME, // ←バケット名
                                        Key: msgId+'.png', // ←バケットに保存するファイル名
                                        Body: Buffer.concat(body)
                                    };
                                    console.log("Keyimg"+Key);
                                    s3.putObject(params, function(err, data) {
                                        // 画像保存後の処理
                                        console.log(data);
                                    });
                                };

                                callback2(null, img);

                            } else {
                                callback2(error);
                            }
                        });

                    },
                    function sendCloudAPI(img, callback2) {
                       console.log('send cloud api');
                        var data = {
                            "requests":[
                                {
                                    "image":{"content": img},
                                    "features":[
                                        //{"type": "TEXT_DETECTION", "maxResults": 3},

                                        {"type": "FACE_DETECTION", "maxResults": 3}

                                        /*{"type": "LABEL_DETECTION", "maxResults": 3},
                                        {"type": "LANDMARK_DETECTION", "maxResults": 5},
                                        {"type": "LOGO_DETECTION", "maxResults": 5},
                                        {"type": "SAFE_SEARCH_DETECTION", "maxResults": 5}*/

                                    ]
                                }
                            ]
                        };
                        var opts = {
                            url: 'https://vision.googleapis.com/v1/images:annotate?key=' + process.env.GAPKEY,
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(data)
                        };
                        var text = '';
                        var text2= '';
                        request.post(opts, function (error, response, body) {
                            console.log(body);
                            body = JSON.parse(body);
                            /*var textAnnotations = body.responses[0].textAnnotations;
                            var labelAnnotations = body.responses[0].labelAnnotations;*/

                            var faceAnnotations = body.responses[0].faceAnnotations;

                            /*var landmarkAnnotations = body.responses[0].landmarkAnnotations;
                            var logoAnnotations = body.responses[0].logoAnnotations;
                            var safeSearchAnnotation = body.responses[0].safeSearchAnnotation;
                            if (labelAnnotations !== undefined) {
                                for (var i = 0; i < labelAnnotations.length; i++) {
                                    text += '"' + labelAnnotations[i].description + '"' + " and \n";
                                }
                            }
                            if (landmarkAnnotations !== undefined) {
                                text += landmarkAnnotations[0].description + " place \n\n";
                            }
                            */

                            if (faceAnnotations !== undefined) {
                                text += faceAnnotations.length + "人の顔\n";
                            }

                            /*
                            if (textAnnotations !== undefined) {
                                for (var i = 1; i < textAnnotations.length; i++) {
                                	j = parseInt(i/10);
                                	var textAnnotate = textAnnotations[i].description.replace(/\n/g, ' ');
                                	console.log(textAnnotate);
                                	if (j < 1) {
                                		text += textAnnotate + ", ";
                                	} else if (1<= j < 2) {
                                		text2+= textAnnotate + ", ";
                                	}
                                }
                            }
                            text2= text2.replace(/\n+$/g,'');
                            var text12= text + text2;
                            console.log(text12);*/

                            var dataType = "face";
                            var dataCategory="image";

                            text = text.replace(/\n+$/g,'');
                            console.log("TableName:"+TableName + " id:"+msgId + " msgType:"+msgType + " msgReply:"+msgReply + " displayName:"+displayName + " dataType:" + dataType + " dataCategory:" + dataCategory + " text:"+text + " userId:"+userId + " msgTime:"+msgTime + " msgImage:"+msgImage);

                            dynamodb.putItem(
                                {"TableName": TableName,
                                  "Item": {"id": {"S": msgId},
                                        "msgType": {"S": msgType},
                                        "msgReply": {"S": msgReply},
                                        "displayName": {"S": displayName},
                                        "dataType":{"S": dataType},
                                        "dataCategory":{"S": dataCategory},
                                        "text": {"S": text},
                                        "userId": {"S": userId},
                                        "msgTime": {"S": msgTime},
                                        "msgImage": {"S": msgImage} }
                                },
                                function (err, data) {
                                    if (err) { console.log(err, err.stack);
                                    } else { console.log("dynamo_image:"+data); }
                                }
                            );

              		        text = "アップロード画像から、\n" + text.substr(0, 100) + "\nを読み取りました。\nこの方の呼び方を「名前 ○○」と入れて下さい。"
                          var message_text = {type: 'text', text: text}; //+"\uDBC0\uDC79"};
                          console.log(message_text);
                          client.replyMessage(res.replyToken, message_text)
                          .then(() => {
                            callback(null, {});
                          })
                          .catch((error) => {
                            callback(null, {});
                          });
                          //callback2(null, text);
                        });
                    }
                ], function (err, result) {
                    callback(null, result);
                });

            } else {
                console.log('run else');
                var text = '分かりませんでした！';
                var message_text = {type: 'text', text: text}; //+"\uDBC0\uDC79"};
                console.log(message_text);
                client.replyMessage(res.replyToken, message_text)
                .then(() => {
                  callback(null, {});
                })
                .catch((error) => {
                  callback(null, {});
                });
                //callback(null, text);
            }
          }
         ], function (err, result) {
            callback(null, result);
         });
        }
    ], function (err, result) {
    });
};
