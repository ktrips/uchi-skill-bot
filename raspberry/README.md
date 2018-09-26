# RaspberryPi setup and Python scripts

## Raspberry Pi
- RasPi Zero
- Pi Camera
- BME280
- Button

1. Connect camera, BME280, and button to RasPi zero.
2. Set all of them to the case.
3. Additional Grove connecter can be exposed to the outside.

## Python scripts

- fusion_button.py: Hundle the movement by the number of the button press.
- bme280.py: Check the room tempelature, humidity, and pressure.
- fashion_servo.py: Main program to take a picture, detect what kind of the fashion on the picture, and suggest accessaries and stuff based on the picture analysis.

## Start the programs

- Set systemctl as startup
  - sudo cp fashion_button.service /etc/systemd/system/
  - sudo systemctl enable fashion_button.service
  - sudo systemctl start fashion_button.service
  - sudo systemctl status fashion_button.service
- Reboot the Raspberry Pi
  - Check the status
  - Push the fashion button!
