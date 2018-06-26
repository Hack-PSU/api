#!/usr/bin/env bash
# Functions ==============================================

# return 1 if global command line program installed, else 0
# example
# echo "node: $(program_is_installed node)"
function program_is_installed {
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
function npm_package_is_installed {
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
function echo_fail {
  # echo first argument in red
  printf "\e[31m✘ ${1}"
  # reset colours back to normal
  printf "\033\e[0m"
  echo ""
}

# display a message in green with a tick by it
# example
# echo echo_fail "Yes"
function echo_pass {
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
function continue_if {
  if [ $1 == 1 ]; then
    echo_pass $2
  else
    echo_fail $2
    echo "Exiting"
    exit 1
  fi
}

# ============================================== Functions
echo "Checking for installation"
echo "node $(continue_if $(program_is_installed node))"
echo "node-cipher $(continue_if $(npm_package_is_installed node-cipher))"

echo "Checking for args"
if [ $# -ne "3" ]
  then
    echo "Correct arguments not supplied"
    echo "Usage: addenv.sh <KEY> <VALUE> <ENV_FILE>"
    exit 1
fi

echo "Checking that password was set"
if [ -z "$PKEY_PASS" ]; then
    echo_fail "PKEY_PASS"
    exit 1
fi

# Add to env file
file_name=${3:-".staging.env.aes"}
out_name=$(echo "./api/${file_name}" | sed -e "s/\.aes$//")
nodecipher decrypt ./api/${file_name} ${out_name} -p ${PKEY_PASS} -a aes-256-cbc-hmac-sha256
echo "$1=$2"
echo "$1=$2" >> "${out_name}"
nodecipher encrypt ${out_name} "./api/${file_name}" -p ${PKEY_PASS} -a aes-256-cbc-hmac-sha256
echo "DONE"