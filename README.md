![Install script test](https://github.com/ithinkido/penplotter-webserver/actions/workflows/install_test.yml/badge.svg)


[![Image of WebPlot - A Web interface for Pen Plotter](https://raw.githubusercontent.com/ithinkido/penplotter-webserver/PiPlot/docs/img/Demo.gif)](https://github.com/ithinkido/penplotter-webserver/tree/flowcontrol)

This branch has been modifed for use with the [Pi Plot shiled](https://github.com/ithinkido/PiPlot)

### Changes made in this version

- Add folowing plotters : HP7440a, HP7550, Roland DXY 1xxx, Roland Sketchmate, Houston Instrument DMP-161, Calcomp Designmate, and Calcomp Artisan. 
- Support for HP-IB through Plug n Plot.
- Plot optimization options through Vpype.
- Add Buffer space info graph when plotting (Not availible when using XON/XOFF nor HP-IB)
- Auto baud rate detection function.
- Simple resizing of input SVG when converting to HPGL
- Add fix for pyserial bug when using hardware flow control over CTS /RTS.
- Plot speed definition + support for other custom vpype commands
- Telegram notifications
- HPGL preview


# WebPlot - A Web interface for Pen Plotters

Python webservice to simplify working with pen plotters:
- Supported plotters: Graphtec MP4200, HP7475a
- Created for Raspberry Pi.
- Upload *.SVG and *.HPGL files.
- Convert *.SVG into *.HPGL files using [vpype](https://github.com/abey79/vpype)
- Telegram notification on print end
- Power off your plotter on print end using a Tasmota-enabled Sonoff controller   


## Installation

This quick and easy easy install script is intended to be used with Raspibain OS.
Currently, the following versions are supported:  

Pi-OS Bullseye - 32 and 64 bit  
Pi-OS Bookworm - 32 and 64 bit  

From the home directory, run:

```bash
curl -sSL https://raw.githubusercontent.com/ithinkido/penplotter-webserver/PiPlot/install.sh | bash
```
This will install the Pen Plotter Web Server and reboot the Raspberry Pi once installation is completed.

## Usage

After the install, open a browser and got to:
```bash
http://{{your Raspberry-Pi IP address}}:5000
```

Optional:
Configure options in *config.ini* using the web interface to set:
- Tasmota device IP.
- Telegram Chat ID for notifications.
- Timelapse Settings

## ToDO

- [x] Fix Mobile UI
- [x] Add plotter name to toolbar
- [x] Add defaults to configuration file
- [x] Stop print via UI?
- [x] List current printing filename

- [ ] More plotter options?

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)  

![visitors](https://vbr.nathanchung.dev/badge?page_id=ithinkido.PenPlotterWebServer)

