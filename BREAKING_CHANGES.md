_version 1.4.0_

- `continued_fraction` function renamed to `continuedFraction` for camelCase consistency
- `is_subset` function renamed to `isSubset` for camelCase consistency
- `is_in` function renamed to `isIn` for camelCase consistency

_version 0.8.0_

- Order of arguments changed for _defint_ in `nerdamer.convertToLaTeX`
- `nerdamer.toRPN` not returns array of tokens. Token class can be found in Parser.classes
- The `Operator` class was removed. A simple `object` can be passed to method
- nerdamer.setOperator and nerdamer.getOperators have been deprecated. Use `core.PARSER.setOperator` instead.
