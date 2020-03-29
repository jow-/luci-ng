cmake_minimum_required(VERSION 2.6)

PROJECT(rpcd-mod-iptables C)

ADD_DEFINITIONS(-Os -Wall -Werror --std=gnu99 -g3 -Wmissing-declarations)

SET(CMAKE_SHARED_LIBRARY_LINK_C_FLAGS "")

IF(APPLE)
  INCLUDE_DIRECTORIES(/opt/local/include)
  LINK_DIRECTORIES(/opt/local/lib)
ENDIF()


ADD_LIBRARY(rpcd-mod-iptables MODULE main.c shared.c iptables.c iptables6.c)
TARGET_LINK_LIBRARIES(rpcd-mod-iptables ubox ubus xtables ip4tc ip6tc iptext iptext4 iptext6 )
SET_TARGET_PROPERTIES(rpcd-mod-iptables PROPERTIES OUTPUT_NAME iptables PREFIX "")

INSTALL(TARGETS rpcd-mod-iptables LIBRARY DESTINATION lib)
