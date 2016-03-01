#
# Copyright (C) 2016 Florian Eckert <Eckert.Florian@googlemail.com>
#
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci2-app-dsl
PKG_VERSION:=2016-03-01
PKG_MAINTAINER:=Florian Eckert <Eckert.Florian@googlemail.com>

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Build/Compile
endef

define Package/luci2-app-dsl
  SECTION:=luci2
  CATEGORY:=LuCI2
  TITLE:=LuCI2 support for DSL status
  MAINTAINER:=Eckert.Florian@googlemail.com
  DEPENDS:=+luci2-ui-base @TARGET_lantiq @TARGET_lantiq_xrx200
endef

define Package/luci2-app-dsl/description
 Provides the LuCI2 web interface with lantiq dsl status informations.
endef

define Package/luci2-app-dsl/postinst
#!/bin/sh
/etc/init.d/rpcd restart
exit 0
endef

define Package/luci2-app-dsl/postrm
#!/bin/sh
/etc/init.d/rpcd restart
exit 0
endef

define Package/luci2-app-dsl/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./rpcd/status.dsl $(1)/usr/libexec/rpcd/status.dsl

	$(INSTALL_DIR) $(1)/usr/share/rpcd
	$(CP) ./share/* $(1)/usr/share/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-ng
	$(CP) ./www/* $(1)/www/luci-ng/
endef

$(eval $(call BuildPackage,luci2-app-dsl))
