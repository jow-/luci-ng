cmake_minimum_required(VERSION 2.6)

PROJECT(luci2-rpc-bwmon C)

ADD_DEFINITIONS(-Os -Wall -Werror --std=gnu99 -g3 -Wmissing-declarations)

SET(CMAKE_SHARED_LIBRARY_LINK_C_FLAGS "")

IF(APPLE)
  INCLUDE_DIRECTORIES(/opt/local/include)
  LINK_DIRECTORIES(/opt/local/lib)
ENDIF()

ADD_LIBRARY(luci2-rpc-bwmon MODULE bwmon.c)
TARGET_LINK_LIBRARIES(luci2-rpc-bwmon ubox ubus)
SET_TARGET_PROPERTIES(luci2-rpc-bwmon PROPERTIES OUTPUT_NAME bwmon PREFIX "")

INSTALL(TARGETS luci2-rpc-bwmon LIBRARY DESTINATION lib)
