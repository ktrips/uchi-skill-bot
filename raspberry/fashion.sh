#!/bin/bash --rcfile
source /etc/bash.bashrc
source ~/.bashrc
cd ~/web/cgi-bin/
echo "Fashion_servo.py --exec Y"
sudo python fashion_servo.py --exec Y
echo "Fashion is done!"
