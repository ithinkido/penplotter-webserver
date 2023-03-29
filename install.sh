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
lsb_release -ds
python -V

if ! command -v python3 &>/dev/null; then
    echo "Python 3 is not installed."
    return 1
else
    if [[ $(python3 -c 'import sys; print(sys.version_info >= (3, 9, 2))') == False ]]; then
        echo "Python version 3.9.2 or newer is required."
        return 1
    fi
fi

#get the curret debian version info
piversion=$(grep VERSION_ID /etc/os-release | cut -d '"' -f 2)
if [[ "$piversion" -lt 11 ]]; then
    echo "PiOS (Bullseys) 11 or newer is required."
    return 1
fi

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
    git clone -q -b graphtec https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null
    # git clone -q -b PiPlot https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null
    
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
    sleep 2
    if sudo systemctl is-active --quiet webplotter; then
        echo "Web plotter has started successfully"
    else
        echo "Something has gone wrong...."
        exit
    fi
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
    git clone -q -b graphtec https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null 
    # git clone -q -b PiPlot https://github.com/ithinkido/penplotter-webserver.git "$dir" > /dev/null

    # add user files back
    rm -R $dir/uploads
    mv temp/* $dir/
    #clean up
    rm -R temp
    (python3 -m pip install -r $dir/requirements.txt -U -q) & spinner
    echo ""
    python3 -m pipx upgrade vpype
    sudo systemctl restart webplotter
    if sudo systemctl is-active --quiet webplotter; then
        echo "Web plotter has started successfully"
    else
        echo "Something has gone wrong...."
    fi
    printf "\033[?25h"
fi
