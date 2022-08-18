#!/bin/bash

spinner()
{
    local pid=$!
    local delay=0.75
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}
printf "\033[?25l"
#get the curret debian version info
lsb_release -ds
python -V
echo ""
echo "Updating apt. This will take a while..."
(sudo apt-get update -qq) & spinner
wait
dir="$HOME/webplotter"
## Check for dir, if not found create it using the mkdir ##
if [ ! -d "$dir" ] ; then
    echo ""
    echo "Installing apt packages"
    (sudo apt-get install -y git python3-pip libgeos-c1v5 libatlas-base-dev python3-venv > /dev/null) & spinner 
    wait
    echo ""
    echo "Downloading Web Plotter from Github"
    git clone -q -b PiPlot https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null
    echo ""
    echo "Installing pip packages"
    (python3 -m pip install -r $dir/requirements.txt -qq) & spinner 
    echo ""
    echo "Installing pipx"
    (python3 -m pip install --user --no-warn-script-location pipx -qq) & spinner 
    python3 -m pipx ensurepath > /dev/null
    export PATH="$PATH:/home/pi/.local/bin" > /dev/null
    echo ""
    python3 -m pipx install --pip-args "--prefer-binary vpype" vpype
    echo ""
    echo "Auto start Web Plotter on boot"
    echo ""
    cp $dir/config.ini.sample $dir/config.ini    
    sudo cp $dir/webplotter.service /etc/systemd/system/
    sudo systemctl daemon-reload 
    sudo systemctl enable webplotter 
    sudo systemctl start webplotter 
    printf "\033[?25h"
    printf "Rebooting in 5 sec "
    (for i in $(seq 4 -1 1); do
        sleep 1;
        printf ".";
    done;)
    echo ""
    echo "Rebooting"
    sleep 1 
    sudo reboot
else
    printf "\033[?25l"
    echo ""
    echo "Directory "$dir" already exists"
    echo ""
    echo "Updating packages"
    # move user files out
    mkdir temp
    mv $dir/uploads/ temp/uploads/
    mv $dir/config.ini temp/config.ini
    rm -rf "$dir"
    git clone -q -b PiPlot https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null 
    # add user files back
    rm -R $dir/uploads
    mv temp/* $dir/
    #clean up
    rm -R temp
    (python3 -m pip install -r $dir/requirements.txt -U -q) & spinner
    echo ""
    python3 -m pipx upgrade vpype
    sudo systemctl restart webplotter
    printf "\033[?25h"
fi
