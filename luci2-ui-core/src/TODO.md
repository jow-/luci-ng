# User Input

widget form fields:

Bindings: All this are evaluated to truthy

- `bind` binds control value to model
- `if=` completely remove the widget and its childs from the view and validation
- `disabled=` show the widget in disabled, non editable state, no validation computed
- `required=` field must have a value to validate form

`isTouched` The control has been visited.

# Widget Types

without bindings to data model (output)

- plain
- plain with children

bound to data model (input)

- field
- field group
- field array

## Output widgets

- `widget` string
- `onInit?` expression (string)
- `waitFor?` expression (string)
- `displayIf?` expression (string)

- `content?` only if it has children

- `options?` widget specific. All properties are allowed to be expression if "property="

## Primitive Field widgets

- `bind` <object.property> "object" must exist and be reactive. "property" is added if necessary
- `options?` extends ISchema

in schema??
disabled
read-only
required
hidden

## case of array of primitives!!!

## Compound Field widgets (group - array of fields)

- `bind` <object | parent.object> "parent" must exist ¿not necesarly reactive?. "object" is created if necessary (as reactive object/array)
- `exportAs?` alias to export "object" in child contexts. The idea is to have a path independent
  access from children, referencing only the parent level, but not all ancestors
- `elementAs?` in array export the current element to child context under this element
- `indexAs?` in array export the current index to child context

- `content`
- `options?` extends ISchema

Compound Field widgets export into the context a "$form" object with the form's view model state

### View Model:

- `parentForm`
- `isValid` The control's value is valid.
- `isDisabled` This control is exempt from validation checks.
- `value`

not observables!!:

- `isDirty` The control's value has changed.
-

### Context object

`"onInit": "var1 = expr, var2 = expr, var3=expr"`

export $parentContext
to share a result with parent & siblings


ng.probe($0).componentInstance