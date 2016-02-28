#
# Copyright (C) 2015-2016 Jo-Philipp Wich <jow@openwrt.org>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-rpc-bwmon
PKG_VERSION:=20150125
PKG_MAINTAINER:=Jo-Philipp Wich <jow@openwrt.org>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ./src/* $(PKG_BUILD_DIR)/
endef

define Package/luci2-rpc-bwmon
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=Bandwidth monitoring stats for RPC server
  DEPENDS:=+rpcd +libubox +libubus
endef

define Package/luci2-rpc-bwmon/description
 Provides bandwidth monitoring data via the RPC server.
endef

define Package/luci2-rpc-bwmon/install
	$(INSTALL_DIR) $(1)/usr/lib/rpcd
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/bwmon.so $(1)/usr/lib/rpcd/
endef

define Package/luci2-rpc-bwmon/postinst
#!/bin/sh
killall -HUP rpcd 2>/dev/null
exit 0
endef

$(eval $(call BuildPackage,luci2-rpc-bwmon))
