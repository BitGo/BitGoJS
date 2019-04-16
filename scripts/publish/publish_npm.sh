#!/bin/sh
#
#-------------------------------------------------------------------------------
#
# Script
#	publish_to_npm.sh
#
# Purpose:
# 	Script to npm publish a BitGo product package to external npmjs repository.
#
# History	
#	4/12/19 - James - Developed initial version.
#
#-------------------------------------------------------------------------------
#

# Component: SDK or BitGoJS
# SDK_PUBLISH_URL="https://github.com/BitGo/BitGoJS/archive/"

# Component: @bitgo/unspents
UNSPENTS_PUB_URL="https://github.com/BitGo/unspents/archive/"

# Component: CLI v1 and v2
CLI_V1_PUBLISH_URL="https://github.com/BitGo/bitgo-cli/archive/"
CLI_V2_PUBLISH_URL_CLI_V2="https://github.com/BitGo/bitgo-cli-v2/archive/"

# Component: BitgoD
BITGOD_PUBLISH_URL="https://github.com/BitGo/bitgod/archive/"

#-------------------------------------------------------------------------------
# Function
#-------------------------------------------------------------------------------
#
bold='\e[1;033m%s\e[0m\n'
function usage {
   printf "\n${bold}" "NAME"
   printf "%s\t$0 - Script to publish BitGo product component to NPMJS repository."
   printf "\n\n${bold}" "SYNOPSIS"
   printf "%s\t$0 [-h] [-d dryrun] -c <component> -t <tag>"
   printf "\n"
   printf "\n${bold}" "DESCRIPTION"
   printf "%s\tScript to take provided Github project repo and its Git tag, create a package, and publish it to the NPMJS repo, npmjs.com."
   printf "\n"
   printf "%s\tYou must have an user account and sufficient privileges to publish a package to NPMJS repo."
   printf "\n"
   printf "\n${bold}" "OPTIONS"
   printf "%s\t-c component (required)"
   printf "\n%s\t\tBitGo product component. Valid values are as below without double quotes."   
   printf "\n%s\t\t\"sdk\" \t\tfor SDK or BitGoJS,"   
   printf "\n%s\t\t\"unspents\" \tfor @bitgo/unspents,"   
   printf "\n%s\t\t\"cli-v1\" \tfor CLI v1,"   
   printf "\n%s\t\t\"cli-v2\" \tfor CLI v2,"   
   printf "\n%s\t\t\"bitgod\" \tfor BitgoD."
   printf "\n"
   printf "\n%s\t-t tag (required)"
   printf "\n%s\t\tGit tag."
   printf "\n"
   printf "\n%s\t-d dryrun"
   printf "\n%s\t\tEnable dryrun whereas the script will NOT actually publish a package to npmjs repo."
   printf "\n"
   printf "\n%s\t-h"
   printf "\n%s\t\tPrint out help or usage information."
   printf "\n"
   printf "\n${bold}" "USAGE EXAMPLES"
   printf "%s\tPublish SDK 5.1.0:  $0 -c sdk -t 5.1.0"
   printf "\n%s\tPublish unspents 0.5.1:  $0 -c unspents -t 0.5.1\n\n" 1>&2; exit 1;
}

#-------------------------------------------------------------------------------
# Function: publishSDK
#-------------------------------------------------------------------------------
#
function publishSDK {
   args
	: @required local productComp=$1
	: @required local relTag=$2
	: local enableDryrun=$3
	
	
	
}

#-------------------------------------------------------------------------------
# Function: publishGeneral
#-------------------------------------------------------------------------------
#
function publishGeneral {
   args
	: @required local productComp=$1
	: @required local relTag=$2
	: local enableDryrun=$3

	# Assumption: 

}

#===============================================================================
# MAIN starts here.
#===============================================================================
#
# Print out help info if input parameter was provided.
if [ $# = 0 ]; then
	printf "\nERROR: No input paramemter has been provided. Please refer to the detailed usage information.\n"
	usage
	exit 0
fi

# Retrieve provided input paramemter(s).
while getopts ":c:t:d:" input; do
    case "${input}" in
		c)
			COMPONENT=${OPTARG}
			;;
        t)
            TAG=${OPTARG}
            ;;
        d)
            DRYRUN=${OPTARG}
            ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))

# Since both "component" and "tag" are the required input parameters, check for them.
echo "Component: ${COMPONENT}"
echo "Tag: ${TAG}"
if [ -z ${COMPONENT} ] || [ -z ${TAG} ]; then
	printf "ERROR: Insufficient inputs - Both component and tag must be provided.\n"
	usage
	exit 0
fi

case $COMPONENT in
	"sdk")
		publishSDK "${COMPONENT}" "${TAG}" "${DRYRUN}"
		;;
	
	"unspents")
		publishGeneral "${COMPONENT}" "${TAG}" "${DRYRUN}"
		;;
	
	"cli-v1")
		publishGeneral "${COMPONENT}" "${TAG}" "${DRYRUN}"
		;;
	
	"cli-v2")
		publishGeneral "${COMPONENT}" "${TAG}" "${DRYRUN}"
		;;
	
	"bitgod")
		publishGeneral "${COMPONENT}" "${TAG}" "${DRYRUN}"
		;;
	
	*)
		printf "\nERROR: The provided product component is invalid.Please refer to the detailed usage information.\n"
		usage
		exit 0
esac

exit 0


# Publish GitgoD.
echo "Git tag used: $git_tag"
npm publish https://github.com/BitGo/bitgod/archive/${git_tag}.tar.gz

