

# System

* why does luci save hostname via Lua, instead of default uci behaviour via procd?
`fs.writefile( "/proc/sys/kernel/hostname", newname )`

* why does Luci save timezone via Lua, instead of default uci behaviour via procd?
`fs.writefile("/etc/TZ", timezone .. "\n")`

* check for `/usr/sbin/ntpd` to enable ntpd settings?

* why Luci doesn't allow modifying `zonename`, it is valid in init scripts?
* what is `luci.sys.zoneinfo.tzoffset` used for?

* best place to store `tz_data` to be dynamic with current year data?

* why does Luci change ntpd status directly and not via uci/procd?
`sys.call("env -i /etc/init.d/sysntpd start >/dev/null")`
if it was disabled, the init script is not registered and no trigger will reload the config!?

* who is responsible for enabling/disabling startup scripts to sync with uci `enabled` status?
Luci called `/etc/init.d/sysntpd enable` (or disable) on change

* why are `use_dhcp` and  `dhcp_interface` not configurable via Luci?
they are also not documented in [](https://openwrt.org/docs/guide-user/advanced/ntp_configuration)

* UCI method to set device time