#!/usr/bin/env bash
# REQUIREMENT: Bash v4+. On MacOS: Run brew install bash --upgrade
# This script prepares the directory for uploading to the cloud
# platform of your choice. It will unencrypt any configuration and
# private key files
set -e
trap '[ "$?" -ne 77 ] || exit 77' ERR
# Functions ==============================================

# return 1 if global command line program installed, else 0
# example
# echo "node: $(program_is_installed node)"
program_is_installed (){
  # set to 1 initially
  local return_=1
  # set to 0 if not found
  type $1 >/dev/null 2>&1 || { local return_=0; }
  # return value
  echo "$return_"
}

# return 1 if local npm package is installed at ./node_modules, else 0
# example
# echo "gruntacular : $(npm_package_is_installed gruntacular)"
npm_package_is_installed (){
  # set to 1 initially
  local return_=1
  # set to 0 if not found
  ls $(npm root -g) | grep -w $1 >/dev/null 2>&1 || { local return_=0; }
  # return value
  echo "$return_"
}
# display a message in red with a cross by it
# example
# echo echo_fail "No"
echo_fail (){
  # echo first argument in red
  printf "\e[31m✘ ${1}"
  # reset colours back to normal
  printf "\033\e[0m"
  echo ""
}

# display a message in green with a tick by it
# example
# echo echo_fail "Yes"
echo_pass (){
  # echo first argument in green
  printf "\e[32m✔ ${1}"
  # reset colours back to normal
  printf "\033\e[0m"
  echo ""
}

# echo pass or fail
# example
# echo echo_if 1 "Passed"
# echo echo_if 0 "Failed"
continue_if (){
  if [ $1 == 1 ]; then
    echo_pass $2
  else
    echo_fail $2
    echo "Exiting"
    exit 77
  fi
}

# ============================================== Functions

# ============================================== Global config
# files is an associative array that maps from input file to output file
# A
declare -A files
# .env file
if [ "$1" = "prod" ]; then
    files[".prod.env.aes"]=".env"
else
    files[".staging.env.aes"]=".env"
fi
# gcs config files
if [[ "$1" = "prod" ]]; then
    files["gcs_config.json.aes"]="gcs_config.json"
else
    files["gcs_config_staging.json.aes"]="gcs_config.json"
fi
# private key file
if [ "$1" = "prod" ]; then
    files["privatekey.aes"]="config.json"
else
    files["privatekey.staging.aes"]="config.json"
fi
files["hackpsu-18-serviceaccount.json.aes"]="hackpsu-18-serviceaccount.json"


echo "Checking for installation"
echo "node $(continue_if $(program_is_installed node))"
echo "node-cipher $(continue_if $(npm_package_is_installed node-cipher))"

echo "Checking that password was set"
if [ -z "$PKEY_PASS" ]; then
    echo_fail "PKEY_PASS"
    exit 1
fi


echo "Running decryption"
for file in "${!files[@]}";
do
   nodecipher decrypt "./api/$file" "./api/${files[$file]}" -p ${PKEY_PASS} -a aes-256-cbc-hmac-sha256
    if [ $? -ne 0 ]; then
        echo "Decryption failed for ./api/${files[$file]}"
        exit 1;
    fi
done
echo "Successfully decrypted"
