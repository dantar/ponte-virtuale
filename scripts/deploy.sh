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
INCLUDEZIP=true
PROJECT=ponte-virtuale
die() { echo "$*" 1>&2 ; exit 1; }
while getopts h:p: flag;
do
    echo "FLAG ${flag}"
    case "${flag}" in
        h) case "${OPTARG}" in
                atlante) 
                    TARGET=${OPTARG}
                    DEST=atlante.elabor.biz:dist/
                    INCLUDEZIP=true
                ;;
                mars) 
                    TARGET=${OPTARG}
                    DEST=mars.elabor.biz:dist/
                    INCLUDEZIP=false
                ;;
                dantar) 
                    TARGET=${OPTARG}
                    DEST=dantar:html/
                    INCLUDEZIP=false
                ;;
                *) die "opzione invalida: ${OPTARG}";;
            esac
        ;;
        p) PROJECT=${OPTARG} ;;
        *) die "opzione invalida: ${flag}";;
    esac
done

cd $MAINDIR

ng build --base-href=./ --configuration=production
TMPDIR=`mktemp -d`
mv $MAINDIR/dist/ponte-virtuale ${TMPDIR}/${PROJECT}
rsync --delete -varzh ${TMPDIR}/${PROJECT} $DEST

if [ $INCLUDEZIP = "true" ]; then
    cd ${TMPDIR}/${PROJECT} && \
    zip -r /tmp/ponte-virtuale.zip * && \
    scp /tmp/ponte-virtuale.zip atlante.elabor.biz:/var/www/html/download
fi
