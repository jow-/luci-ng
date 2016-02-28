#
# Copyright (C) 2013-2015 Jo-Philipp Wich <jow@openwrt.org>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-io-helper
PKG_VERSION:=20141219
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

define Package/luci2-io-helper
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=LuCI2 IO Helper
  DEPENDS:=+libubox +libubus
endef

define Package/luci2-io-helper/description
 Provides a CGI multicall executable to handle large binary up/download tasks.
endef

define Package/luci2-io-helper/install
	$(INSTALL_DIR) $(1)/usr/libexec $(1)/www/cgi-bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/luci2-io $(1)/usr/libexec/
	$(LN) /usr/libexec/luci2-io $(1)/www/cgi-bin/luci-upload
	$(LN) /usr/libexec/luci2-io $(1)/www/cgi-bin/luci-backup
endef

$(eval $(call BuildPackage,luci2-io-helper))
