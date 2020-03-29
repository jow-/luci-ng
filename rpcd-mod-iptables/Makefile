#
# Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=rpcd-mod-iptables
PKG_VERSION:=20200328
PKG_MAINTAINER:=Adrian Panella <ianchi74@outlook.com>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ./src/* $(PKG_BUILD_DIR)/
endef

define Package/rpcd-mod-iptables
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=RPC calls to query iptables
  DEPENDS:=+rpcd +libubox +libubus +kmod-ipt-core +libip4tc +libip6tc +libxtables 
endef



define Package/rpcd-mod-iptables/description
  Query iptables thru RPC.
endef

define Package/rpcd-mod-iptables/install
	$(INSTALL_DIR) $(1)/usr/lib/rpcd
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/iptables.so $(1)/usr/lib/rpcd/
endef

define Package/rpcd-mod-iptables/postinst
#!/bin/sh
/etc/init.d/rpcd restart
exit 0
endef

$(eval $(call BuildPackage,rpcd-mod-iptables))
