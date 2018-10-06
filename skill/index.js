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

const KanjiSlot= ["漢字","かんじ","漢", "漢語", "漢検", "かんけん", "カンケン", "漢字検定"];
const KankenConv={10:"小1", 9:"小2", 8:"小3", 7:"小4", 6:"小5", 5:"小6", 4:"中1", 3:"中2", 2:"中3"};
const EngSlot  = ["English","english","英語","英","えいご","米語", "英検", "えいけん", "エイケン", "英語検定"];
const EikenConv= {5:"中1", 4:"中2", 3:"中3", 2.5:"高1", 2:"高2", 1.5:"高3", 1:"大"};
const HyakuSlot= ["百人一首","かるた","カルタ","百人","一首"];
const RandomGrades= ["小1","小2","小3","小4","小5","小6"];
const EngWord  = {"N":"名詞","V":"動詞","A":"形容詞","O":"その他"};
const kan_num  = {"一":1, "二":2, "三":3, "四":4, "五":5, "六":6,  "七":7,  "八":8,  "九":9,  "十":10, "１":1, "２":2, "３":3, "４":4, "５":5, "６":6};
const grades   = {"幼":"k", "小":"", "中":"j", "高":"h", "大":"u"};
//var RandomGrade = RandomGrades[Math.floor(Math.random() * RandomGrades.length)];
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

function get_api(WordSlot, api, callback) {
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
function get_room(data, callback) {
  return "今の室温は22度、湿度は55%。";
}
function get_forcast(place, callback) {
  return "今日の天気は晴れ、最低気温20度、最高は25度です！";
}

function get_read_text(GreetSlot, callback) {
  console.log(GreetSlot);
  var today_forcast= get_forcast("place");
  var today_room   = get_room("temp");

  if (GreetSlot.match(/^おはよう/) || GreetSlot.match(/^お早う/)) {
    keyGreet = "morning";
    keyGreetW= "おはようございます！";
    var image_result = get_image();
    var today_word   = get_random("foods");

  } else if (GreetSlot.match(/^行ってきます/) || GreetSlot.match(/^行って来ます/)) {
    keyGreet = "go";
    keyGreetW= "いってらっしゃい！";
    var image_result = get_image();
    var today_word  = get_random("words");

  } else if (GreetSlot.match(/^ただいま/) || GreetSlot.match(/^只今/)) {
    keyGreet = "home";
    keyGreetW= "おかえりなさい！";
    var image_result = get_image();

  } else if (GreetSlot.match(/^おやすみ/) || GreetSlot.match(/^お休み/)) {
    keyGreet = "night";
    keyGreetW= "おやすみなさい";

  } else {
    keyGreet = "hello";
    keyGreetW= "こんにちは！";

  }

  var text= keyGreetW+ "時刻は"+timetext+"！"; //GradeSlot+"の"+SubjectSlot+":\n";
  text   += today_room + today_forcast;
  text   += "今日にピッタリなのは、" + today_word + " です！";
  var text_line= keyGreet + timetext+" LINE\n";
  text_line   += today_word+"\n";
  text_line   += today_room+ today_forcast;

  if (keyGreet == "hyaku") {
    var WordSlot = keyGreet;
    var api = 'https://api.aoikujira.com/hyakunin/get.php?fmt=json&key=';
    api_text = get_api(WordSlot, api);
    console.log(api_text);
    text = "それでは、"+api_text.split("|")[2]+"の詠んだ、"+api_text.split("|")[0]+"、の下の句は、ポッ、ポッ、ポッ、ポーン！"+api_text.split("|")[1]+"です！";
    text_line = api_text.split("|")[0]+"、"+api_text.split("|")[1]+"は、"+api_text.split("|")[2]+"が詠みました！";

  } else if (keyGreet == "kanji" || keyGreet == "eng") {
    var KEY_NAME = keyGreet + grdSeg + keyGrd + ".json";
    console.log(text, KEY_NAME);

    var data = fs.readFileSync('./files/'+KEY_NAME, 'utf-8');
    var objects = JSON.parse(data);
    //var objects = JSON.stringify(data); //JSON.parse(data.Body.toString());
    //console.log(objects);
    var min = 0;
    var max = objects.length;
    if (max < read_num) { read_num = max-1; }
    for (var i = 1; i < read_num+1; i++) {
        var n = Math.floor( Math.random() * (max - min) ) + min;
        var word   = objects[n]["word"];
        var read   = objects[n]["read"][0];
        var meaning= read["maening"];
        var example= read["example"][0];
        console.log(word, meaning, example);
        if (keyGreet == "kanji" || keyGreet == "problem") {
          text += "、ポッ、ポッ、ポッ、ポーン！" + word + "について、" + example.split("|")[0];
          text_line += "("+i+")"+example.split("|")[1]+"、答えは "+example.split("|")[0]+"\n";
        } else {
          text += "、ポッ、ポッ、ポッ、ポーン！" + EngWord[meaning.substr(0,1)] + "の" + example;
          text_line += "("+i+")"+EngWord[meaning.substr(0,1)]+"の"+example+"、答えは "+word+"\n";
        }
    }
  }
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
