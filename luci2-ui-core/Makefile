#
# Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-ui-core
PKG_VERSION:=20200227
PKG_MAINTAINER:=Adrian Panella <ianchi74@outlook.com>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

PKG_BUILD_DEPENDS:=!LUCI2_USE_HOST_NODE:node/host
PKG_CONFIG_DEPENDS:=CONFIG_LUCI2_USE_HOST_NODE

include $(INCLUDE_DIR)/package.mk

define Package/luci2-ui-core
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=Luci2 UI Core
  DEPENDS:=+rpcd +uhttpd +uhttpd-mod-ubus +luci2-rpc-base 
endef

define Package/luci2-ui-core/description
 Provides the LuCI2 web interface with standard functionality.
endef

define Package/luci2-ui-core/config
  config LUCI2_USE_HOST_NODE
	bool "Use existing nodejs installation on the host system"
	default y
	help
	  This disables the build dependency on the node package from
	  the OpenWrt packages feed, allowing for faster development
	  builds.
endef

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	find ./src -maxdepth 1 -type f -exec cp -f {} $(PKG_BUILD_DIR) \;
	$(CP) ./src/src $(PKG_BUILD_DIR)/src
	$(MAKE) -C $(PKG_BUILD_DIR) prepare
endef

define Package/luci2-ui-core/install
	$(INSTALL_DIR) $(1)/www/luci2
	$(CP) $(PKG_BUILD_DIR)/dist/* $(1)/www/luci2
	$(INSTALL_DIR) $(1)/etc/uhttpd
	$(CP) ./root/etc/uhttpd/* $(1)/etc/uhttpd/
endef

define Package/luci2-ui-core/postinst
#!/bin/sh

if [ "$$(uci -q get uhttpd.main.ubus_prefix)" != "/ubus" ]; then
	uci set uhttpd.main.ubus_prefix="/ubus"
	uci commit uhttpd
fi

exit 0
endef

$(eval $(call BuildPackage,luci2-ui-core))
