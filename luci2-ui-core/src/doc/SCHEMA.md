# Introduction

The definition is heavily inspired by various JSON Forms libraries:
+ [jsonforms.io](http://jsonforms.io)
+ [joshfire/jsonform](https://github.com/joshfire/jsonform)
+ [json-schema-form/angular-schema-form](https://github.com/json-schema-form/angular-schema-form)

Besides semantics, the most notable difference being that we also include the binding to the data source (Uci/Ubus) in the json definitions, as the goal is to eliminate the need of doing this in manual js code for each view, and the data source is fixed.

# Highlights


+ The data schema defines the underlying data to be shown in the UI (uci configs, sections and options, and their types).
+ The UI schema defines how this data is rendered as a form, e.g. the order of controls, their visibility, and the layout, and as status views.
+ Additional information is embedded in this definitions to also include the data source. Initially only Ubus calls and UCI files are allowed

All this information is translated at runtime to generate the corresponding views and forms and bindings to the underling data.

## Data Schema

All data schemes are defined using a subset of [JsonSchema](http://jsons-schema.org), with some additional custom properties.
As the main source of data are 

### UCI config files
Each config file defines its structure with a schema with the same name, which describes possible sections types and the available options.
The general structure is a wrapper object representing the config file, with properties representing each *section type*. Each *section type*  should be an object whose properties are the available options.

If an UCI file doesn't have an associated schema file, a default one should be derived from all the current options present in the config.

See [SCHEMA.UCI.md](SCHEMA.UCI.md) for detailed definition.

## UI Schema

The UI schema describes the general layout of a view and is just a regular JSON object. It describes the view by means of different UI schema elements, which can be categorized into Navigation, Controls and Layouts. 
It also describes the bindings to the underling data (ubus/uci).

UI Schemas uses arrays to define properties, so as to define deterministic order of the UI elements.
See [SCHEMA.UI.md](SCHEMA.UI.md) for detailed definition.

When there is no explicit UI Schema defined, a default one should be generated based on the data schema.

## Additional files

Additionally to the schemas, to complete the definition of a view the necessary ACLs and Menu definitions must be provided.


