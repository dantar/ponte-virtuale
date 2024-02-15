#!/bin/bash
#set -v # do not expand variables
set -x # output
set -e # stop on error
set -u # stop if you use an uninitialized variable

SCRIPTDIR=`dirname $0`
cd $SCRIPTDIR
SCRIPTDIR=`pwd`
MAINDIR=`dirname $SCRIPTDIR`
cd -

TARGET=atlante
DEST=atlante.elabor.biz:dist/
die() { echo "$*" 1>&2 ; exit 1; }
while getopts h: flag;
do
    echo "FLAG ${flag}"
    case "${flag}" in
        h) case "${OPTARG}" in
                atlante) 
                    TARGET=${OPTARG}
                    DEST=atlante.elabor.biz
                ;;
                *) die "opzione invalida: ${OPTARG}";;
            esac
        ;;
        *) die "opzione invalida: ${flag}";;
    esac
done

cd $MAINDIR
ng build --base-href=./ --configuration=production && rsync --delete -varzh $MAINDIR/dist/* $DEST