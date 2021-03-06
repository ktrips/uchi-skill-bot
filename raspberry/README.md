# RaspberryPi setup and Python scripts

## Raspberry Pi
- RasPi Zero
- Pi Camera
- BME280
- Button

1. Connect camera, BME280, and button to RasPi zero.
2. Set all of them to the case.
3. Additional Grove connecter can be exposed to the outside.

### Prerequisite software

sudo apt-get install python3-requests python3-dateutil
pip3 install rpi.gpio

Tensorflow

Download an appropriate file from ttps://github.com/lhelontra/tensorflow-on-arm/releases
sudo pip3 install tensorflow-1.4.1-cp35-none-linux_armv7l.whl

## Python scripts

- bme280.py: Check the room tempelature, humidity, and pressure.
- fashion_servo.py: Main program to take a picture, detect what kind of the fashion on the picture, and suggest accessaries and stuff based on the picture analysis.

## Start the programs

- Set systemctl as startup
  - sudo cp fashion.service /etc/systemd/system/
  - sudo systemctl enable fashion.service
  - sudo systemctl start fashion.service
  - sudo systemctl status fashion.service
- Reboot the Raspberry Pi
  - Check the status
  - Push the fashion button!
