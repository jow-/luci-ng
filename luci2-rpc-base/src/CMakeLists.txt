cmake_minimum_required(VERSION 2.6)

PROJECT(luci2-rpc-base C)

ADD_DEFINITIONS(-Os -Wall -Werror --std=gnu99 -g3 -Wmissing-declarations)

SET(CMAKE_SHARED_LIBRARY_LINK_C_FLAGS "")

IF(APPLE)
  INCLUDE_DIRECTORIES(/opt/local/include)
  LINK_DIRECTORIES(/opt/local/lib)
ENDIF()

FIND_LIBRARY(crypt NAMES crypt)
IF(crypt STREQUAL "LIBS-NOTFOUND")
  SET(crypt "")
ENDIF()

find_library(json NAMES json-c)

ADD_LIBRARY(luci2-rpc-base MODULE luci2.c)
TARGET_LINK_LIBRARIES(luci2-rpc-base ubox ubus uci blobmsg_json ${json} ${crypt})
SET_TARGET_PROPERTIES(luci2-rpc-base PROPERTIES OUTPUT_NAME luci2 PREFIX "")

INSTALL(TARGETS luci2-rpc-base LIBRARY DESTINATION lib)
