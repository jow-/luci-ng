#
# Copyright (C) 2013-2015 Jo-Philipp Wich <jow@openwrt.org>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-ui-base
PKG_VERSION:=$(shell git --git-dir=$(CURDIR)/../.git log -1 --pretty="%ci %h" | awk '{ print $$1 "-" $$4 }')
PKG_MAINTAINER:=Jo-Philipp Wich <jow@openwrt.org>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Build/Compile
endef

define Package/luci2-ui-base
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=LuCI2 UI
  DEPENDS:=+rpcd +rpcd-mod-iwinfo +rpcd-mod-rpcsys +uhttpd +uhttpd-mod-ubus +libubox +libubus \
	+luci2-rpc-base +luci2-rpc-bwmon +luci2-io-helper
endef

define Package/luci2-ui-base/description
 Provides the LuCI2 web interface with standard functionality.
endef

define Package/luci2-ui-base/install
	$(INSTALL_DIR) $(1)/www
	$(CP) ./www/* $(1)/www/
	$(INSTALL_DIR) $(1)/usr/share
	$(CP) ./share/* $(1)/usr/share/
endef

define Package/luci2-ui-base/postinst
#!/bin/sh

if [ "$$(uci -q get uhttpd.main.ubus_prefix)" != "/ubus" ]; then
	uci set uhttpd.main.ubus_prefix="/ubus"
	uci commit uhttpd
fi

exit 0
endef

$(eval $(call BuildPackage,luci2-ui-base))
