#!/bin/sh
# Copyright (C) 2016 OpenWrt.org

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

case "$1" in
	list)
		json_init

		json_add_object "getDslStatus"
		json_close_object

		json_dump
	;;
	call)
		case "$2" in
			getDslStatus)
				IFS=$'\n'
				dsl_status=$(/etc/init.d/dsl_control lucistat)
				json_init
				json_add_object "dsl"
				for dsl in $dsl_status; do
					if [ "${dsl/dsl.}" != "${dsl}" ] ; then
						status=${dsl:4}
						param=${status#*=}
						param=${param/nil/}
						param=${param//\"/}
						value=${status%=*}
						json_add_string "${value}" "${param}"
					fi
				done
				json_close_object
				json_dump
			;;
		esac
	;;
esac
