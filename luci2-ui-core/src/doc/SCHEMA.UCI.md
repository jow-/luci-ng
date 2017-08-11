# UCI Schema definition

## General Structure 
Each UCI config file defines its structure with a schema with the same name, which describes possible sections types and the available options.
The general structure is a wrapper object representing the config file, with properties representing each *section type*. Each *section type*  should be an object whose properties are the available options.

If an UCI file doesn't have an associated schema file, a default one should be derived from all the current options present in the config.


### Example
```
{
  "type": "object",
  "title": "title of the UCI config",
  "description": "description of the config",

  "properties" : {
    "section_type_1": {
      "type": "object",
      "title": "Section Type 1",
      "description": "options for configuring ...",
      
      "properties": {
        "option1": {
          "title": "",
          "description": ""
          "type": "string",
          "format": "ip",
          "required": true

        },
        "option2": {...},
        "option3": {...}
      },
      "order": ["option1", "option2", "option3"]
    },
    "section_type_2": {...}
  }
  
}
```

## Section
A section always has `type` *object*, with the following general attributes:
+ general info (title/description)
+ name rules
+ validations
+ child options 

### General info
+ `title`
+ `description`

### Name Rules
Section **name** is governed by the following attributes:
+ `anonymous`: boolean indicating if it has a name
+ `pattern`: for name validation on non anonymous sections
+ `default`: name template for new section (an ordinal is appended at the end)
+ `unique`: the name cannot be repeated within this section type

### Validations

+ `required`: boolean. At least one section of this type must be present
+ `minLength`, `maxLength`: integer. Restricts the number of sections of this type
+ `freezed`: 


### Child Options
Available options in the section are descrived by a  `properties` object, with a property with the name of each option and a schema object defining it.
Optionally it can have nested objects grouping options logicaclly.

## Options
Each option can be defined by
+ general info (title/description)
+ data type 
+ additional validation rules (min, max, etc)
+ possible values (fixed or from Ubus method)
+ dependencies on other options

### General info
+ `title`
+ `description`
+ `examples`
+ `default`
+ `required`

### Data types & Basic Validation
The data type (and uci representation) of the option is defined by a combination of the *type* and *format* fields.
If the option is a *list option* then the *items* field is used to complete the definition.

Possible `type` values include the standard JSON Schema types: 
+ string
+ boolean
+ integer
+ number
+ array
+ the builtin *nul* is forbidden as it is not valid UCI values
+ object, is a special case, it generates a grouping of options defined as its properties, it has no direct mapping to UCI concepts, it is just for better conceptual and UI representation

Additional non standard data types as shortcuts are also available:
+ device
+ network
+ ???

#### String
`"type": "string"`

Is the __default__ when no type info is present.

It can be further restricted by:
+ Length: `minLength`, `maxLength`
+ RegEx pattern: `pattern`

As a shortcut restriction the `format` field can be used, which can be any of:
+ "ipaddr"
+ "ipv4"
+ "ipv6"
+ "netmask4"
+ "netmask6"
+ "cidr4"
+ "cidr6"
+ "ipmask4"
+ "ipmask6"
+ "macaddr"
+ "host"
+ "hostname"
+ "wpakey"
+ "wepkey"

#### Boolean
`"type": "boolean"`

To convert from UCI values to boolean, the valid strings can be defined in the `enum` field in the form of *[true value,false value]*, which __default__ to "[1,0]"

### Numbers
`"type": "integer"`
Valid values are signed or unsigned integers. 

`"type": "number"` floating point value

Both can be restricted with the fields:
+ Multiples: `multipleOf`
+ Range: `minimum`, `maximum` (specifies a numeric value).
`exclusiveMinimum`, `exclusiveMaximum` (boolean. When true, it indicates that the range excludes the limit value. When false or not included, it indicates that the range includes the limit value).

### List options
`"type": "array"`
UCI list options are defined with the *array* type. It is __mandatory__ to also include an `items` property with an schema object defining the valid type for each value.
All values must be of the same type (i.e. positional types are not supported)
The array itself can be restricted with the fields:
+ Length: `minItems`, `maxItems`
+ `uniqueItems`

```
{
  "type": "array",
  "items": {
    "type": "string",
    "format": "ipv4"
  }
}
```

## Possible values
It is possible to restrict an option to a list of possible values. This can be done in two ways:
+ Fixed value list, with standard `enum` field with array of valid values
+ Dynamic values, with an extension to get the list from an Ubus service or UCI config, with `enumBinding` field
+ Additionally, a non standard, `additionalItems` property can be set with a schema to signal that the list of possible values is not restrictive, and new values are allow providing that it validates against this schema.

If both `enum` and `enumBinding` are present, the union of both sets are valid values.


### Static values
`"enum": [value1, value2, value3]`

Only the specified values are valid, they must be matching the *type* of the option.

### Dynamic value list
Valid values are determined at run time as a result of an Ubus call or other UCI data.
```
"enumBinding": ["ubusServiceName", "methodName", {params}, "jsonPath"] |
              "uciSelector" 
``` 

The difference of getting data thru the `uci` vs getting the same data thru `ubus` with a call to *"uci get"*, is that when binding with `uci` you get a *live* binding to the data currently present on the form (even if it has not yet been saved), whereas the ubus call can only get what the router currently has saved.

#### Parsing result of UBUS call

To generate the final list with valid elements for this option, the result of the ubus call can be queried/transformed with a valid [JSON Path selector ](https://github.com/dchester/jsonpath).

Examples:
+ $.leds[*].name
+ $.leds[?(@.name==${sysfs})].triggers[*]


#### Parameter expansion
Prior to evaluating a `<parameters>` and `<jsonPath>` a parameter expansion is performed, so that other UCI data from the same config file can be used to dynamically define them.
Parameters are written in the syntax: `${uciSelector}`

If the uciSelector returns an array (case of list options, or selection of multiple sections), it is expanded to **only** it's first item.

In any case that the referenced section/option is invalid, the parameter expands to an empty string.

Any number of parameters can be included in the expressions, but nested expansions are not allowed.


#### UCI Selectors

There are two kind of selectors: to retrieve the value of a specific option, to retrieve the name of a section

Returning **option value or array of values** (if it is a list option or multiple sections):

+ `(config.)(sectionName.)option` to extract data from a fixed and known named section. Optionally a config file and section can be supplied, if either is omitted defaults to the current config and the current section. If "config" is supplied, "section" must also be supplied.

+ `(config.)@sectionType[matchExpr].option` to extract data from sections with the given type. If mor than one section is matched, an array with all the values is returned

Returning **sections' name**:

+ `(config.)@sectionType[matchExpr]`

In either case `[matchExpr]` can be any of:
+ `[]`: empty expression select all sections
+ `[number]`: select specific section by current ordinal position within the type (negative numbers start from the end)
+ `[.name: 'pattern', option1:'pattern', option2: 'pattern']` Select sections that satisfies the condition between brackets. The criteria is defined by an **option** name without quotes followed by a colon, and then a **singled** quoted string with the regexp pattern to match.


## Dependencies

Each option can specify dependencies on other options of the same section that must be met for the option to be available.

They can be defined with:
```
dependencies: { option1: boolean | [ "values" ] | "pattern" ,
  option2: boolean | [ "values" ] | "pattern" 
}
```
+ `option: boolean`, if "true" that option must be present and non empty/false. If "false", it must be blank/
+ `option: ["values"]`, option must be set to any of the listed string values
+ `option: "pattern"` option value must match the pattern

A shorthand to only validate presence of other options (like first alternative) is:
```
dependencies: ["options" ]
```

All dependencies must be met to validate.

No cyclic dependencies check is made, so be careful no to make a loop of dependencies between options as it might create a situation where all options of the chain disappear, and there is no way to edit them.

