#
# Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-app-base
PKG_VERSION:=20200227
PKG_MAINTAINER:=Adrian Panella <ianchi74@outlook.com>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Package/luci2-app-base
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=LuCI2 Base Application
  DEPENDS:=+luci2-ui-core +rpcd-mod-iwinfo +rpcd-mod-rpcsys +luci2-rpc-bwmon +luci2-io-helper +rpcd-mod-iptables
endef

define Package/luci2-app-base/description
 Provides the base applications width standard functionality for the LuCI2 web interface.
endef

define Build/Compile/Default

endef
Build/Compile = $(Build/Compile/Default)

define Package/luci2-app-base/install
	$(INSTALL_DIR) $(1)/usr/share
	$(CP) ./root/usr/share/* $(1)/usr/share/

	$(INSTALL_DIR) $(1)/www/luci2/assets/modules
	$(CP) ./root/www/luci2/modules/* $(1)/www/luci2/assets/modules/
endef

$(eval $(call BuildPackage,luci2-app-base))
