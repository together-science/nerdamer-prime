_version 0.8.0_

- Order of arguments changed for _defint_ in `nerdamer.convertToLaTeX`
- `nerdamer.toRPN` not returns array of tokens. Token class can be found in Parser.classes
- The `Operator` class was removed. A simple `object` can be passed to method
- nerdamer.setOperator and nerdamer.getOperators have been deprecated. Use `core.PARSER.setOperator` instead.
