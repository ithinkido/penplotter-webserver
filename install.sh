#!/bin/bash

dir="$HOME/webplotter"
venv="$HOME/penplotter_venv"
git="https://github.com/ithinkido/penplotter-webserver.git"

#######################################################
#######################################################

spinner()
{
    local pid=$!
    local delay=1
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

#System Info
echo -e "\e[1m$(lsb_release -ds)\e[0m"
echo -e "\e[1m$(getconf LONG_BIT)-bit OS\e[0m"
echo -e "\e[1m$(python -V)\e[0m"

BRANCH=$(lsb_release -cs)"_$(getconf LONG_BIT)"

if ! command -v python3 &>/dev/null; then
    echo -e "\e[1;31m Python 3 is not installed.\e[0m"
    return 1
else
    if [[ $(python3 -c 'import sys; print(sys.version_info >= (3, 9, 2))') == False ]]; then
        echo -e "\e[1;31m Python version 3.9.2 or newer is required.\e[0m"
        return 1
    fi
fi

#get the curret debian version info
piversion=$(grep VERSION_ID /etc/os-release | cut -d '"' -f 2)
if [[ "$piversion" -lt 11 ]]; then
    echo -e "\e[1;31mPiOS 11 (Bullseye) or newer is required for this script to work.\e[0m"
    return 1
fi

echo ""
echo "Updating apt. This will take a while..."
(sudo apt-get update -qq > /dev/null) & spinner
wait
echo -e "\e[32m Done.\e[0m"


## Check for dir, if not found create it using the mkdir ##
if [ ! -d "$dir" ] ; then
    echo ""

    echo "Installing apt packages"
    (sudo apt-get install -qq -y \
        git \
        python3-pip \
        libopenblas-dev \
        libgeos-c1v5 \
        libgeos-dev \
        libatlas-base-dev \
        python3-venv \
        libssl-dev \
        hp2xx \
    > /dev/null) & spinner    
    if [ $? -eq 0 ]; then
        echo -e "\e[32m Packages installed successfully.\e[0m"
    else
        echo -e "\e[1;31m Error: Failed to install packages. Exiting\e[0m">&2
        exit 1
    fi
    echo ""

    echo "Downloading Web Plotter for $BRANCH from Github"
    if git ls-remote --exit-code --heads $git "$BRANCH" > /dev/null; then
        # DO NOT CHANGE without changing git actions 
        # git clone -q -b "$BRANCH" $git "$dir" > /dev/null
        git clone -q -b "$BRANCH" $git "$dir" 
        echo -e "\e[32m Done.\e[0m"
    else
        echo -e "\e[1;31m Branch does not exist\e[0m"
        return 1
    fi
    wait
    echo ""

    echo "Creating python venv"
    python3 -m venv $venv
    source $venv/bin/activate &&
    if [ -n "$VIRTUAL_ENV" ]; then    
        echo -e "\e[32m Pen plotter web server venv has been activated.\e[0m"
        echo " Path: $VIRTUAL_ENV"
    else
        # echo "Virtual environment could not be activated"
        echo -e "\e[1;31m Virtual environment could not be activated.\e[0m"
        return 1
    fi
    echo ""

    echo "Fix pip certs"
    (python3 -m pip install pip_system_certs -q > /dev/null) & spinner
    echo -e "\e[32m Done.\e[0m"
    echo ""

    while IFS= read -r package; do
        echo "Installing $package" && \
        if (python3 -m pip install -q "$package" > /dev/null) & spinner; then
            echo -e "\e[32m $package was installed successfully.\e[0m"
        else
            echo -e "\e[31m Failed to install $package.\e[0m"
        fi
        echo ""

    done < "$dir/requirements.txt"

    echo "Installing vpype"
    if (python3 -m pip install vpype --prefer-binary vpype -q > /dev/null) & spinner; then
        echo -e "\e[32m vpype was installed successfully.\e[0m"
    else
        echo -e "\e[31m Failed to install vpype.\e[0m"
    fi
    echo ""
   
    echo "Preapre penplotter webserver config"
    cp $dir/config.ini.sample $dir/config.ini
    echo -e "\e[32m Done.\e[0m"
    echo ""

    current_user=$(whoami)
    if [ "$current_user" != "pi" ]; then
        echo -e "\e[33m Fix user define\e[0m"
        echo "Setup user '$current_user' in webplotter.service" 
        sed -i "s/pi/$current_user/g" $dir/webplotter.service
        echo -e "\e[32m Done.\e[0m"
        echo ""
    fi 

    echo "Setup auto start for Web Plotter on boot"   
    sudo cp $dir/webplotter.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable webplotter > /dev/null
    sudo systemctl start webplotter
    echo ""

    sleep 2
    if sudo systemctl is-active --quiet webplotter; then
        IP_ADDRESS=$(hostname -I | awk '{print $1}')
        echo -e "\e[1m After reboot - Web plotter can be found at http://$IP_ADDRESS:5000\e[0m"
        echo ""
    else
        echo -e "\e[1;31m Something has gone wrong.....\e[0m"
        cd $dir
        $venv/bin/python3 $dir/main.py &
        printf "\033[?25h"
        sleep 5
        exit 1
    fi

    printf "\033[?25h"
    printf "Rebooting in 5 sec "
    # echo -e "\e[33mRebooting in 5 sec \e[0m"

    (for i in $(seq 4 -1 1); do
        sleep 1;
        printf ".";
    done;)
    echo ""
    echo ""
    echo "Rebooting"
    sleep 1
    sudo reboot


##########################################
###      UPDATE EXISTING INSTALL      ####
##########################################


else
    printf "\033[?25l"
    echo ""
    # echo "Directory "$dir" already exists"
    echo -e "\e[32m Directory "$dir" already exists\e[0m"
    echo ""
    mkdir -p temp
    if [ ! -d "$venv/" ]; then
        echo -e "\e[33m Looks like you do not have a penplotter_venv virtual environment.\e[0m"
        echo " Let's take care of that."
        python3 -m venv $venv
        wait
    fi

    echo "Updating pen plotter web server"
    if git ls-remote --exit-code --heads $git "$BRANCH" > /dev/null; then

        if [ -d "$dir/uploads/" ]; then
            mv "$dir/uploads/" temp/
        else
            echo -e "\e[33m $dir/uploads/ does not exist. No files moved.\e[0m"
        fi
        if [ -e "$dir/config.ini" ]; then
            mv "$dir/config.ini" temp/
        else
            cp $dir/config.ini.sample temp/config.ini
        fi
            rm -rf "$dir"

            # DO NOT CHANGE BRANCH NAME without changing git actions 
            git clone -q -b "$BRANCH" $git "$dir" > /dev/null
    else
        echo -e "\e[1;31m Branch does not exist\e[0m"
        return 1
    fi
    wait    # add user files back
    echo ""

    rm -R $dir/uploads
    mv -f temp/* $dir/
    #clean up
    rm -R temp
    
    source $venv/bin/activate &&
    if [ -n "$VIRTUAL_ENV" ]; then    
    echo -e "\e[32m Pen plotter web server venv has been activated.\e[0m"
    echo "Path: $VIRTUAL_ENV"
    else
        echo -e "\e[1;31m Virtual environment could not be activated.\e[0m"
        return 1
    fi
    echo ""

    # python3 -m pip install -q --upgrade -r $dir/requirements.txt
    python3 -m pip install --upgrade pip_system_certs -q 
    python3 -m pip install --upgrade -r $dir/requirements.txt > /dev/null
    python3 -m pip install --upgrade vpype --prefer-binary vpype -q
    sudo rm -rf /etc/systemd/system/webplotter.service

    current_user=$(whoami)
    if [ "$current_user" != "pi" ]; then
        echo -e "\e[33m Fix user define\e[0m"
        echo "Setup user '$current_user' in webplotter.service" 
        sed -i "s/pi/$current_user/g" $dir/webplotter.service
        echo ""
    fi 

    sudo cp $dir/webplotter.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable webplotter
    sudo systemctl start webplotter

    sleep 2
    if sudo systemctl is-active --quiet webplotter; then
        IP_ADDRESS=$(hostname -I | awk '{print $1}')
        echo -e "\e[1m After reboot - Web plotter can be found at http://$IP_ADDRESS:5000\e[0m"
        echo ""
    else
        echo -e "\e[1;31m Something has gone wrong.....\e[0m"
        source $venv/bin/activate &&
        cd $dir
        python3 $dir/main.py &
        printf "\033[?25h"
        sleep 5
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
fi
