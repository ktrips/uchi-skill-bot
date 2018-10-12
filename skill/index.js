var clova  = require("love-clova");
const line = require('@line/bot-sdk');
var request= require('request');
var async = require('async');
var res;

var event;
var context;
var callback;
var https = require('https');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET_NAME = 'uchipacket';
const fs = require('fs');

var dynamodb     = new AWS.DynamoDB({region: 'us-east-1'});
const TableName  = "senseiData";

const speaker = "クローバ";
const skill_name = "おうち";
const line_bot_url = "https://api.line.me/v2/bot";

const morning_greet = ["おはよう","お早う"]
const go_greet = ["行ってきます","行って来ます"]
const home_greet = ["ただいま","只今"]
const night_greet = ["おやすみ","お休み"]                 

const greetConv= {"morning": {
                    "greetSlot": ["おはよう","お早う"],
                    "greetAction": ["room","food","schedule"],
                    "api": "https://calendar.google.com/calendar/r"
                    },
                  "go":{
                    "greetSlot": ["行ってきます","行って来ます"],
                    "greetAction": ["fashion","word","transit"],
                    "api": "https://calendar.google.com/calendar/r"
                    },
                  "home":{
                    "greetSlot": ["ただいま","只今"],
                    "greetAction": ["room","tv","food"],
                    "api": "https://calendar.google.com/calendar/r"
                    },
                  "evening":{
                    "greetSlot": ["おつかれ","お疲れ"],
                    "greetAction": ["weather"],
                    "api": "https://calendar.google.com/calendar/r"
                    },
                  "night":{
                    "greetSlot": ["おやすみ","お休み"],
                    "greetAction": ["room","alarm","schedule"],
                    "api": "https://calendar.google.com/calendar/r"
                    }
                 };

const test_sets = ["おはよう", "行って来ます", "ちはや", "N", "ゆっくり"]; //[grade, subject, read number, hyaku word, answer, speed]
const default_read = 10;
const ans_flag = "N";
const break_time = 5;

var start_message= skill_name + "は、おうちを便利にします！";
var add_message  = test_sets[0] + "や" + test_sets[1] + "などと、言ってみて下さい！";
var help_message = start_message + add_message;
var end_message  = skill_name + "を使ってくれてありがとう！また何でも聞いてね！";

var date  = new Date();
var dd    = date.getDate();
var dd0   = ("0"+date.getDate()).slice(-2);
var year  = date.getFullYear();
var month = date.getMonth()+1;
var month0= ("0"+(date.getMonth()+1)).slice(-2);
var week  = date.getDay();
var day   = date.getDate();
var hour  = date.getHours();
var minute=date.getMinutes();
var second=date.getSeconds();
var day0    = ("0"+date.getDate()).slice(-2);
var hour0   = ("0"+date.getHours()).slice(-2);
var minute0 =("0"+date.getMinutes()).slice(-2);
var second0 =("0"+date.getSeconds()).slice(-2);
var timetext= month+"月"+day+"日"+hour+"時"+minute+"分"; //+second;

function get_api(WordSlot, callback) {
    api = greetConv[wordSlot]["api"]
    console.log(WordSlot, api);
    
    const api_url = api; //'http://api.aoikujira.com/hyakunin/get.php?fmt=json&key=';
    const url  = api_url + WordSlot;
    const KEY_NAME = WordSlot+".json";
    var data = fs.readFileSync('./files/'+KEY_NAME, 'utf-8');
    var res = JSON.parse(data);
    /*const req = https.request(url, (res) => {
      res.on('data', chunk => {
        console.log("res:"+data);
        console.log(`BODY: ${chunk}`);
        res = JSON.parse(chunk);*/
        var min = 0;
        var max = res.length;
        var n = Math.floor( Math.random() * (max+1 - min) ) + min;
        console.log(min, max, n);

        //for (var i=0; i < res.length; i++) {
          console.log(res[n]);
          var kami   = res[n]["kami"];
          var simo   = res[n]["simo"];
          var sakusya= res[n]["sakusya"];
        //}
        //callback(null, kami + simo);
        return kami+"|"+simo+"|"+sakusya;
      //});
    //})
}

function get_random(KEY_NAME, callback) {
  console.log(KEY_NAME);
  var data= fs.readFileSync('./files/'+KEY_NAME+'.json', 'utf-8');
  var res = JSON.parse(data);
  var min = 0;
  var max = res.length;
  var n = Math.floor( Math.random() * (max - min) ) + min;
  console.log(min, max, n, res[n]);
  var all_text = res[n][value];
  return all_text;
}

function get_image(data, callback) {
    
  return "ヨシケンさん、ですね！";
    
}
function get_room(data="", callback) {
    
  return "今の室温は22度、湿度は55%。";
    
}

function get_forcast(place, callback) {
  var focast_result = ["晴れ", 20, 25];
  var result = "今日の天気は、" + focast_result[0] + "、最低気温" + focast_result[1] + "度、最高は" + focast_result[2] + "度です！";  
  return result;
}

function get_transit(from, to, callback) {
  var transit_result = "小田急線と千代田線";
  var result = from + "から" + to + "へは" + transit_result + "が最適です！";  
  return result;
}

function get_read_text(GreetSlot, callback) {
    
  console.log(GreetSlot);
  var place = "世田谷";
  var today_forcast= get_forcast("place");
  var today_room   = get_room();
  var image_result = get_image();
  var keyGreet     = "";
  var keyGreetW    = "";
  var greetText    = "";

  if (GreetSlot.match(/^greetConv["morning"]["greetSlot"]/)) {
    keyGreet  = "morning";
    keyGreetW = "おはようございます！";
    greetText+= today_forcast;
    greetText+= today_room;
    greetText+= get_random("foods") + "は、いかかでしょうか？";

  } else if (GreetSlot.match(/^greetConv["go"]["greetSlot"]/)) {
    keyGreet  = "go";
    keyGreetW = "いってらっしゃい！";
    greetText+= today_forcast;
    greetText+= "今日にピッタリなのは、" + get_fashion() + "です！";
    greetText+= "今日の名言は、" + get_random("words") + "です！";
    greetText+= keyGreetW;

  } else if (GreetSlot.match(/^greetConv["home"]["greetSlot"]/)) {
    keyGreet = "home";
    keyGreetW= "おかえりなさい！";
    greetText+= today_room;

  } else if (GreetSlot.match(/^greetConv["night"]["greetSlot"]/)) {
    keyGreet = "night";
    keyGreetW= "おやすみなさい";
    greetText+= today_room;
    greetText+= "タイマーをセットしますか？";
    greetText+= keyGreetW;

  } else {
    keyGreet = "hello";
    keyGreetW= "こんにちは！";

  }

  var text= keyGreetW+ "時刻は"+timetext+"！";
  text   += greetText;
    
  var text_line= keyGreet + timetext+" LINE\n";  
  text_line   += today_room+ today_forcast+"\n";
  text_line   += greetText+"\n";

  var all_text = text + "|" + text_line;
  return all_text;
}

const LaunchRequestHandler = {
  //canHandle(handlerInput){
  canHandle: function(handlerInput){
    return handlerInput.requestEnvelope.isMatch('LaunchRequest');
  },
  //async handle(handlerInput){
  handle: function(handlerInput){
    var GreetSlots= ["おはよう", "いってきます", "ただいま"];
    var GreetSlot = GreetSlots[Math.floor(Math.random() * GreetSlots.length)];

    var all_text = get_read_text(GreetSlot); //test_sets[1], test_sets[0], test_sets[2]);
    var yomi_msg = all_text.split("|")[0]
    //var msg = start_message;
    var msg = yomi_msg + add_message; //.replace(/ポッ、ポッ、ポッ、ポーン！/g, "") + add_message;
    console.log("out:"+msg);
    return handlerInput.responseBuilder.speak(msg).reprompt(msg).getResponse();
  }
}

const SessionEndedRequestHandler = {
  canHandle: function(handlerInput){
    return handlerInput.requestEnvelope.isMatch('SessionEndedRequest');
  },
  handle: function(handlerInput){
    var msg = end_message;
    return handlerInput.responseBuilder.speak(msg).reprompt(msg).getResponse();
  }
}

const ClovaGuideIntentHandler = {
  canHandle: function(handlerInput){
    return handlerInput.requestEnvelope.isMatch('Clova.GuideIntent');
  },
  handle: function(handlerInput){
    var msg = help_message; //"このスキルは漢字、英語、百人一種などを読み上げます。小3の漢字を読み上げて！などと聞いてみて下さい";
    return handlerInput.responseBuilder.speak(msg).reprompt(msg).getResponse();
  }
}

const GreetingIntentHandler = {
  canHandle: function(handlerInput){
    return handlerInput.requestEnvelope.isMatch('GreetingIntent');
  },
  handle: function(handlerInput){
      console.log('Request GreetingIntent');
      var GreetSlot = handlerInput.requestEnvelope.request.intent.slots.GreetingSlot;
      console.log(GreetSlot);
      if (typeof GreetSlot !== "undefined") {
        var GreetSlot= GreetSlot.value;
      } else {
        var GreetSlot = "hello";
      }

      var all_text= get_read_text(GreetSlot);
      var yomi_msg= all_text.split("|")[0];
      var line_msg= all_text.split("|")[1];
      var msg     = yomi_msg + add_message;
      //msg += "の読み上げ、書き取りです。ポーンの合図の後にスタートします！" //" + NumberSlot + "個を " + break_time + "秒おきに
      //msg += "用意はいいですか？ポッ、ポッ、ポッ、ポーン！"; //<break time=\"1s\" />

      async.waterfall([
          function post_line_msg(callback) {
              msg_txt = {
                "type": "text",
                "text": line_msg
              }
              console.log(line_msg, msg_txt);
              const client = new line.Client({
                channelAccessToken: process.env.ACCESSTOKEN
              });
              client.pushMessage(process.env.USERID, msg_txt)
              .then(() => {
                callback(null, {});
              })
              .catch((error) => {
                callback(null, {});
              });
          }
        ], function (err, result) {
      });

      console.log("speak:"+msg);
      return handlerInput.responseBuilder.speak(msg).getResponse();
  }
}

const errorHandler = {
  canHandle: function(handlerInput){
    return true;
  },
  handle: function(handlerInput){
    var msg = "エラー発生!もう一度聞いてみて下さい！";
    return handlerInput.responseBuilder.speak(msg).reprompt(msg).getResponse();
  }
}

exports.handler = clova.extensionBuilders
  .addRequestHandlers(LaunchRequestHandler,SessionEndedRequestHandler,ClovaGuideIntentHandler,GreetingIntentHandler)
  .addErrorHandlers(errorHandler)
  .lambda()
/*
exports.handler = async function(event, content) {
  // 公開鍵を取得
  const certificateBody = getCertificateBody();

  // signatureを検証
  var headerSignature = event.headers.signaturecek || event.headers.SignatureCEK;
  checkSignature(certificateBody, headerSignature, JSON.stringify(event.requestParameters));

  // applicationIdを検証
  var applicationId = 'net.ktrips.yomi';
  checkApplicationId(event.requestParameters, applicationId);

  clova.extensionBuilders.addRequestHandlers(
    LaunchRequestHandler,
    SessionEndedRequestHandler,
    ClovaGuideIntentHandler,
    ReadIntentHandler
  )
    .addErrorHandlers(errorHandler)
  return clova.extensionBuilders.invoke(event.requestParameters);
};

// signatureを検証
function checkSignature(certificateBody, signature, requestParameters) {
  const { createVerify} = require('crypto')
  const veri = createVerify('RSA-SHA256');
  veri.update(requestParameters, 'utf8');

  if (!veri.verify(certificateBody, signature, 'base64')) {
    throw new Error('signatureが違うよ!! これはCEKからのリクエストじゃないかもよ!!');
  }
}

// applicationIdの検証
function checkApplicationId(jsonRequestBody, applicationId) {
  if (jsonRequestBody.context.System.application.applicationId !== applicationId) {
    throw new Error('ExtensionId(applicationId)が間違ってるよ');
  }
}

// ./signature-public-key.pemを読み込む
function getCertificateBody() {
  var fs = require('fs');
  var cert = fs.readFileSync('./signature-public-key.pem', 'utf8');
  return cert;
}*/
