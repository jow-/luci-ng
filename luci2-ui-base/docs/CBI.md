# CBI Directives:

## cbiMap

Parent element to edit UCI config files. It manages updates to underlying config files, adding controls for saving/applying/reseting changes.

### Attributes

|Attribute|Description|
|---|---|
| _cbiMap_|Name of the default uci config file to use|
| _title_| Title shown in the page as h2|
| _description_| Description shown as paragraph|
| _waitfor_|Promise objecto to wait for|

## cbiSection

This directive describes a section of a UCI config file. It may be all sections of a given _type_ or a specific named sections.
It must be nested inside a cbiMap.

### Attributes
|Attribute|Description|
|---|---|
| _cbiSection_| UCI section, in the form `[package.](@type[#] or name)` if package is not specified it is inherited from parent cbiMap|
| _title_| title of the section, shown as h3|
| _placeholder_| message to show if the section is empty. Default "There are no entries defined yet"|
| _addTitle_| default "Add new section"|
| _addCaption_| default "Add..."|
| _addPlaceholder_| default "New section name"|
| _removeTitle_|default "Remove this section"|
| _removeCaption_| default "Remove"|
| _sortable_| adds 'Move up/down' controls|
| _anonymous_| if set, when adding new sections, the name of the section cannot be set (_addTitle_ is used)|
| _addremove_| adds 'Add/Remove' controls|
| _collapse_| if set only one of the sibbling sections is open at a time|
| _onadd_| callback function|
| _onremove_| callback function|
| _filter_| callback function({sectionName, sectionObject, controller})|
| _waitfor_| Promise object to wait for|


## cbiOption

###	Attributes

|Attribute|Description|
|---|---|
| _cbiOption_| 		uci option to link with this control (`[file.][section.]option`) if not specified file is infered from cbiMap and section from cbiSection parent elements.|
| _title_|			to be shown before the control|
| _description_|	to be shown bellow the control|
| _placeholder_|	text to be passed to a child input element as placeholder|
| _name_|			used to generate internal ID instead of option from cbiOption|
|_list_|			if attribute is present option is a list|
| _preview_|		if present field is shown in summary when section is closed|
| _waitfor_| Promise object to wait for|
| _validate_| `[optional] rule`  if 'optional' is not specifyied the value is required <br> `rule` has the form `type or val_func(param1, paramN)` where _param_ is a number a quoted string or a nested call to another val_func. See l2validation for a list of validation functions and type checks|
| _depends_|		option-value that must be set for this option to be available, possible forms:  <br> `"option1"` <br> `"option1, option2, option3"`<br> `[option1, option2]`<br> all this options imply value=true <br> `[{option1: value}, {option2:value}]` <br> `{option1: value}` <br><br> 'value' can be: <br> `true`: only check for non empty <br> `value`:	check for this value <br> `[value1, value2]`: check for any of the values in the array <br> `function(val)`:	pointer to a fuction with the value of the dependant option. Must return true/false|
 
						
# Helper functions

## l2validation

Used by cbiOptions to validate the values entered in forms

### Validation functions

|Function|Description|
|---|---|
|**Type Check**|
|_intenger_||
|_uinteger_||
|_float_||
|_ufloat_||
|_string_||
|_phonedigit_| Any valid phone number digit: 0-9*#!.|
|_ipaddr_| any valid IPv4 or IPv6 address|
|_ip4addr_||
|_ip6addr_||
|_netmask4_| a valid IPv4 netmask|
|_netmask6_| a valid IPv6 netmask|
|_cidr4_|IPv4/prefix|
|_cidr6_|IPv6/prefix|
|_ipmask4_| ip4addr/netmask4|
|_ipmask6_| ip6addr/netmask6|
|_port_| Valid port number (0-65535)|
|_portrange_| range in form #-#|
|_macaddr_| valid mac address|
|_host_| Hostname or ip address|
|_hostname_| Valid hostname|
|_uciname_| Valid UCI identifier|
|_network_| Valid network name (hostname or uciname)|
|_wpakey_||
|_wepkey_||
|**Functions**|
|_range(min,max)_| a number between _min_ and _max_|
|_min(min)_| a number greater or equal to _min_|
|_max(max)_| a number lower or equal to _max_|
|_rangelenght(min,max)_| Between _min_ and _max_ characters|
|_minlength(min)_| At least _min_ characters|
|_maxlength(max)_| At moste _max_ characters|
|_list(subvalidator, subargs)_| checks _subvalidator(subargs)_ on each token of a list field|
|**Logical Functions**| intended to nest other functions or type checks|
|_or(func1(),func2,...)_||
|_and(func1(),func2,...)_||
|_neg(func)_|removes '!' from front of value before evaluating _func()_|

### Examples:

* validates= "integer"
* validates= "and(intenger, max(25))"
* validates= "rangelength(10,15)"
* validates= "portrange"
* validates= "list(integer)"
* validates= "list(range(20,35))"




