
#! /usr/bin/python
# -*- coding: utf-8 -*-

import subprocess, os, sys, re
import cv2
import json
import time
from datetime import datetime
import urllib2
import urllib
import dateutil.parser
from poster.encode import multipart_encode
from poster.streaminghttp import register_openers
import argparse
import RPi.GPIO as GPIO

import wiringpi

from pixels import pixels

SERVO = 12
# use 'GPIO naming'
wiringpi.wiringPiSetupGpio()
# set #18 to be a PWM output
wiringpi.pinMode(SERVO, wiringpi.GPIO.PWM_OUTPUT)
# set the PWM mode to milliseconds stype
wiringpi.pwmSetMode(wiringpi.GPIO.PWM_MODE_MS)
# divide down clock
wiringpi.pwmSetClock(192)
wiringpi.pwmSetRange(2000)
delay_period = 0.01

BUTTON=16
LED=20
DEVICE = 0
CARD   = 1
VOLUME = 30

speaker= 'hikari' #'haruka' 'takeru' 'santa' 'bear'

speech_path= '/home/pi/kai/speech.wav'
accuracy   = 70
hold_time  = 1.2

model_name = ""
fname =""

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(LED, GPIO.OUT)

models_cat  = ["fashion_style"] #, "fashion_color", "fashion_pattern", "fashion_type"]
res_fashions= {"business-black": "ブラックレザーバンドと黒ぶちメガネ",
              "casual-pink": "ピンクバングル",
              "sports-yellow": "スポーツオレンジストラップとイエローメガネ",
              "casual-blue": "マリンブルーバンドと青いメガネ"}

docomo_key = "xxx"
URL_CAT = "https://api.apigw.smt.docomo.ne.jp/imageRecognition/v1/concept/classify/?APIKEY="
URL_SPEECH= 'https://api.apigw.smt.docomo.ne.jp/voiceText/v1/textToSpeech?APIKEY='

def camera():
    now = datetime.now()
    dir_name = now.strftime('%Y%m%d')
    dir_path = '/home/pi/kai/image/' + dir_name + '/'
    file_name= now.strftime('%H%M%S') + '.jpg'
    fname    = dir_path + file_name
    try:
        os.mkdir(dir_path)
    except OSError:
        print 'Date dir already exists'
    os.system('sudo raspistill -o ' + fname)
    return fname
  
def getImage(fname, modelName):
  register_openers()
  f = open(fname, 'r')
  url = URL_CAT
  datagen, headers = multipart_encode({'image': f, 'modelName': modelName})

  url = url + docomo_key

  request = urllib2.Request(url, datagen, headers)
  response= urllib2.urlopen(request)
  res_dat = response.read()

  res_json = json.loads(res_dat)['candidates']
  return res_json

def speech(message, speaker, VOLUME):
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    data = {
        'text': message,
        'speaker': speaker,
        'volume': VOLUME,
        'emotion': 'happiness', #'sadness',
        'emotion_level': 2,
        'pitch': 100,
        'speed': 100,
    }

    try:
        values = urllib.urlencode(data)
        url = URL_SPEECH + docomo_key
        req = urllib2.Request(url, values, headers)
        res = urllib2.urlopen(req)
        header = res.info()
        data   = res.read()
        code   = res.getcode()
    except Exception as e:
        print e
        exit()
    print code, header
    return code,data

def talk(message):
    GPIO.output(LED, GPIO.HIGH)
    code, data = speech(message, speaker, VOLUME)
    if code == 200:
        f=open(speech_path, 'w')
        f.write(data)
        f.close()
        os.system('aplay -D plughw:{},{} '.format(CARD, DEVICE) + speech_path)
    else:
        print "Speech response is not 200"
    GPIO.output(LED, GPIO.LOW)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', nargs='?', dest='fname', type=str, default='', help='name of input image')
    parser.add_argument('--model', nargs='?', dest='model_name', type=str, default='', help='modelName = {scene, fasion_pattern, fashion_type, fashion_style, fashion_color, food, flower, kinoko, bodyPart, curren$
    parser.add_argument('--exec', nargs='?', dest='exec_flag', type=str, default='B', help='If exec is 1 then start detection automatically')

    args = parser.parse_args()
    #model_name = args.model if args.model else ''
    #fname = args.image if args.image else ''
    exec_flag = args.exec_flag if args.exec_flag else 'B'
    print exec_flag #model_name, fname
    if exec_flag == "B":
      for i in range(3):
        GPIO.output(LED, GPIO.HIGH)
        pixels.listen()
        for pulse in range(50, 200, 1):
          wiringpi.pwmWrite(SERVO, pulse)
          time.sleep(delay_period)
        #GPIO.output(LED, GPIO.HIGH)
        #time.sleep(0.5)
        GPIO.output(LED, GPIO.LOW)
        pixels.off()
        time.sleep(0.5)
        
    GPIO.add_event_detect(BUTTON,GPIO.FALLING)
    while exec_flag != "N": #True:
        pixels.listen()
        time.sleep(0.5)
        pixels.off()
        #print "Press #" + str(BUTTON) + " button!"
        if GPIO.event_detected(BUTTON) or exec_flag == "Y":
            GPIO.remove_event_detect(BUTTON)
            now = time.time()
            count = 1 if exec_flag == "Y" else 0
            GPIO.add_event_detect(BUTTON,GPIO.RISING)
            while time.time() < now + hold_time:
                if GPIO.event_detected(BUTTON):
                    count +=1
                    time.sleep(.3) # debounce time

            print count
            if count > 0:
                pixels.listen()
                GPIO.output(LED, GPIO.HIGH)
                fname = camera()
                time.sleep(.5)
                GPIO.output(LED, GPIO.LOW)
                pixels.off()

                if fname:
                    pixels.speak()
                    img = cv2.imread(fname)
                    oname = fname.replace('.jpg', '_o.jpg')

                    candidate_list = []
                    if model_name == '':
                        for model in models_cat:
                            print model
                            candidate_list += getImage(fname, model)
                    else:
                        image_list = getImage(fname, model_name)
                        if model_name == 'word':
                            candidate_list = getWordList(image_list)
                        else:
                            candidate_list = image_list
                   #print candidate_list
                    pixels.off()

                    obj= 0
                    objects   = ''
                    if candidate_list:
                        for can in candidate_list:
                            score    = round(can['score']*100, 1)
                            object   = can['tag']
                            obj_model= model_name
                            if score > accuracy:
                                obj +=1
                                print object + "(" + str(score) + "%)"
                                if object: objects += object + u'、'

                        message = "きょうは、"
                        if objects:
                            message += objects.encode('utf-8')
                    else:
                        message = "No candidate list"

                pixels.speak()
                if message:
                    msg = message + "なファッションですね！"
                    print msg
                    os.system('/home/pi/kai/aquestalkpi/AquesTalkPi -g {} {} | aplay -D plughw:{},{}'.format(VOLUME, msg, CARD, DEVICE))
                else:
                    print "No message"
                pixels.off()
                result = ""
                res_num= 0
                if message:
                  if message.find('ビジネス') > 0:
                    result = res_fashions["business-black"]
                    res_num= 50
                  elif message.find('レッド') > 0:
                    result = res_fashions["casual-pink"]
                    res_num= 100
                  elif message.find('スポーティー') > 0:
                    result = res_fashions["sports-yellow"]
                    res_num= 150
                  elif message.find('カジュアル') > 0:
                    result = res_fashions["casual-blue"]
                    res_num= 200

                  result = "それなら"+result+"がぴったりです！" if result else "ごめんなさい。ピッタリなものが見つかりませんでした！この機会に新しいものをオーダーしては如何ですか？"
                  print result

                  GPIO.output(LED, GPIO.HIGH)
                  for pulse in range(0, res_num, 2):
                      wiringpi.pwmWrite(SERVO, pulse)
                      time.sleep(delay_period)
                  GPIO.output(LED, GPIO.LOW)
                  time.sleep(0.5)

                  os.system('/home/pi/kai/aquestalkpi/AquesTalkPi -g {} {} | aplay -D plughw:{},{}'.format(VOLUME, result, CARD, DEVICE))
                  #talk(result)
                  exec_flag = "N"
                  #pixels.off()

    wiringpi.pwmWrite(SERVO, 0)
    GPIO.remove_event_detect(BUTTON)

