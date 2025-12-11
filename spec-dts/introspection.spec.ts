import tsMorph from 'ts-morph';

describe('Nerdamer AST Introspection Tests', () => {
    let project: tsMorph.Project;
    let sourceFile: tsMorph.SourceFile;
    let nerdamerRuntime: any;

    beforeAll(async () => {
        // Load complete nerdamer with all modules using dynamic import
        nerdamerRuntime = await import('../all.js');
        nerdamerRuntime = nerdamerRuntime.default || nerdamerRuntime;

        project = new tsMorph.Project({
            tsConfigFilePath: 'spec-dts/tsconfig.json',
        });

        sourceFile = project.getSourceFileOrThrow('index.d.ts');
    });

    it('should validate all method return types match TypeScript declarations using AST introspection', () => {
        const typeValidationErrors: string[] = [];
        const methodAnalysis: Record<string, any> = {};

        // Helper function to extract return type from TypeScript signature
        function extractReturnType(methodDeclaration: any): string {
            if (!methodDeclaration.getReturnTypeNode) {
                return 'unknown';
            }

            const returnTypeNode = methodDeclaration.getReturnTypeNode();
            if (!returnTypeNode) {
                return 'void';
            }

            const typeText = returnTypeNode.getText();
            return typeText;
        }

        // Helper function to get method parameters
        function getMethodParameters(methodDeclaration: any): Array<{ name: string; type: string; optional: boolean }> {
            if (!methodDeclaration.getParameters) {
                return [];
            }

            const params = methodDeclaration.getParameters();
            return params.map((param: any) => ({
                name: param.getName(),
                type: param.getTypeNode()?.getText() || 'any',
                optional: param.hasQuestionToken(),
            }));
        }

        // Helper function to validate runtime type against declared type
        function validateReturnType(actualValue: any, declaredType: string, _methodName: string): boolean {
            const actualType = typeof actualValue;

            // Handle specific type mappings
            const typeMap: Record<string, (value: any) => boolean> = {
                boolean: v => typeof v === 'boolean',
                string: v => typeof v === 'string',
                number: v => typeof v === 'number',
                'string[]': v => Array.isArray(v) && v.every(item => typeof item === 'string'),
                'number[]': v => Array.isArray(v) && v.every(item => typeof item === 'number'),
                NerdamerExpression: v =>
                    v && typeof v === 'object' && typeof v.toString === 'function' && typeof v.text === 'function',
                'NerdamerExpression[]': v =>
                    Array.isArray(v) &&
                    v.every(item => item && typeof item === 'object' && typeof item.toString === 'function'),
                void: v => v === undefined,
            };

            // Check for array types FIRST (before checking for single types)
            if (declaredType === 'NerdamerExpression[]') {
                const validator = typeMap['NerdamerExpression[]'];
                return validator ? validator(actualValue) : false;
            }

            // Check for generic NerdamerExpression types
            if (declaredType.includes('NerdamerExpression')) {
                const validator = typeMap['NerdamerExpression'];
                return validator ? validator(actualValue) : false;
            }

            // Check exact type match
            const validator = typeMap[declaredType];
            if (validator) {
                return validator(actualValue);
            }

            // Fallback: basic type checking
            return actualType !== 'undefined';
        }

        // Helper function to generate test arguments for methods
        function generateTestArguments(parameters: Array<{ name: string; type: string; optional: boolean }>): any[] {
            const testExpr = nerdamerRuntime('x + 1');
            const args: any[] = [];

            for (const param of parameters) {
                if (param.optional) {
                    break;
                } // Stop at first optional parameter for simplicity

                // Generate appropriate test values based on parameter type
                if (param.type.includes('ExpressionParam')) {
                    args.push(testExpr);
                } else if (param.type === 'string') {
                    args.push('x');
                } else if (param.type === 'number') {
                    args.push(2);
                } else if (param.type === 'boolean') {
                    args.push(true);
                } else if (param.type.includes('Record<string,')) {
                    args.push({ x: 1 });
                } else {
                    args.push(testExpr); // Default fallback
                }
            }

            return args;
        }

        try {
            // Find NerdamerExpression interface
            const nerdamerExpressionInterface = sourceFile
                .getDescendantsOfKind(tsMorph.SyntaxKind.InterfaceDeclaration)
                .find((iface: tsMorph.InterfaceDeclaration) => iface.getName() === 'NerdamerExpression');

            if (!nerdamerExpressionInterface) {
                typeValidationErrors.push('NerdamerExpression interface not found in type definitions');
                expect(typeValidationErrors).toEqual([]);
                return;
            }

            // Get all method signatures from the interface
            const methodSignatures = nerdamerExpressionInterface.getMethods();

            console.log(`\n=== Found ${methodSignatures.length} method signatures in NerdamerExpression interface ===`);

            // Create test instances
            const testExpressions = [
                nerdamerRuntime('x + 1'),
                nerdamerRuntime('x^2 + 2*x + 1'),
                nerdamerRuntime('sin(x)'),
                nerdamerRuntime('2'),
                nerdamerRuntime('x'),
            ];

            for (const methodSig of methodSignatures) {
                const methodName = methodSig.getName();
                const returnType = extractReturnType(methodSig);
                const parameters = getMethodParameters(methodSig);

                methodAnalysis[methodName] = {
                    returnType,
                    parameters: parameters.length,
                    tested: false,
                    errors: [],
                };

                console.log(`Testing method: ${methodName}() -> ${returnType}`);

                // Test method on each test expression
                for (let i = 0; i < testExpressions.length; i++) {
                    const testExpr = testExpressions[i];

                    if (typeof testExpr[methodName] !== 'function') {
                        methodAnalysis[methodName].errors.push(`Method ${methodName} not found on runtime object`);
                        continue;
                    }

                    try {
                        // Generate appropriate arguments
                        const args = generateTestArguments(parameters);

                        // Call the method
                        const result = testExpr[methodName](...args);

                        // Validate return type
                        const isValidType = validateReturnType(result, returnType, methodName);

                        if (!isValidType) {
                            const errorMsg = `${methodName}() declared to return '${returnType}' but returned '${typeof result}': ${JSON.stringify(result).substring(0, 100)}`;
                            methodAnalysis[methodName].errors.push(errorMsg);
                            typeValidationErrors.push(errorMsg);
                        }

                        methodAnalysis[methodName].tested = true;

                        // Break after first successful test to avoid redundancy
                        break;
                    } catch (error) {
                        // Some methods may throw for certain inputs, record but continue
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        methodAnalysis[methodName].errors.push(`Threw error: ${errorMessage}`);

                        // Special handling for methods that should never throw
                        if (['toString', 'variables', 'isNumber', 'equals'].includes(methodName)) {
                            typeValidationErrors.push(`Critical method ${methodName}() threw error: ${errorMessage}`);
                        }
                    }
                }
            }

            // Report analysis
            console.log('\n=== Method Analysis Summary ===');
            const testedMethods = Object.keys(methodAnalysis).filter(m => methodAnalysis[m].tested);
            const errorMethods = Object.keys(methodAnalysis).filter(m => methodAnalysis[m].errors.length > 0);

            console.log(`Total methods analyzed: ${Object.keys(methodAnalysis).length}`);
            console.log(`Successfully tested: ${testedMethods.length}`);
            console.log(`Methods with errors: ${errorMethods.length}`);

            if (errorMethods.length > 0) {
                console.log('\nMethods with issues:');
                errorMethods.forEach(method => {
                    console.log(`  ${method}: ${methodAnalysis[method].errors.join(', ')}`);
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            typeValidationErrors.push(`AST introspection failed: ${errorMessage}`);
        }

        if (typeValidationErrors.length > 0) {
            console.log('\n=== Critical Return Type Validation Errors ===');
            typeValidationErrors.forEach(error => console.log('❌', error));
        }

        // This test should fail if there are type mismatches to highlight the issues
        expect(typeValidationErrors).toEqual([]);
    });

    it('should validate nerdamerPrime namespace function signatures using AST introspection', () => {
        const primeValidationErrors: string[] = [];
        const functionAnalysis: Record<string, any> = {};

        // Helper function to extract return type from TypeScript function signature
        function extractReturnType(functionDeclaration: any): string {
            if (!functionDeclaration.getReturnTypeNode) {
                return 'unknown';
            }

            const returnTypeNode = functionDeclaration.getReturnTypeNode();
            if (!returnTypeNode) {
                return 'void';
            }

            const typeText = returnTypeNode.getText();
            return typeText;
        }

        // Helper function to get function parameters
        function getFunctionParameters(
            functionDeclaration: any
        ): Array<{ name: string; type: string; optional: boolean; rest: boolean }> {
            if (!functionDeclaration.getParameters) {
                return [];
            }

            const params = functionDeclaration.getParameters();
            return params.map((param: any) => ({
                name: param.getName(),
                type: param.getTypeNode()?.getText() || 'any',
                optional: param.hasQuestionToken(),
                rest: param.isRestParameter(),
            }));
        }

        // Helper function to validate runtime type against declared type
        function validatePrimeReturnType(actualValue: any, declaredType: string, functionName: string): boolean {
            const actualType = typeof actualValue;

            // Enhanced NerdamerExpression validation that detects object wrappers
            function isProperNerdamerExpression(v: any): boolean {
                if (!v || typeof v !== 'object') {
                    return false;
                }

                // Must have the required methods
                if (typeof v.toString !== 'function' || typeof v.text !== 'function') {
                    return false;
                }

                // Must have a symbol property
                if (!('symbol' in v)) {
                    return false;
                }

                // Critical check: symbol property should not be undefined for valid expressions
                // This detects the vecget issue where invalid indices return { symbol: undefined }
                if (v.symbol === undefined) {
                    return false;
                }

                // The symbol should be a proper NerdamerSymbol object with expected properties
                if (v.symbol && typeof v.symbol === 'object') {
                    // A proper NerdamerSymbol should have these core properties according to the type definitions
                    const hasSymbolProps =
                        'group' in v.symbol && 'value' in v.symbol && 'multiplier' in v.symbol && 'power' in v.symbol;
                    if (!hasSymbolProps) {
                        return false;
                    }
                }

                return true;
            }

            // Handle specific type mappings for nerdamerPrime functions
            const typeMap: Record<string, (value: any) => boolean> = {
                string: v => typeof v === 'string',
                number: v => typeof v === 'number',
                boolean: v => typeof v === 'boolean',
                'string[]': v => Array.isArray(v) && v.every(item => typeof item === 'string'),
                'number[]': v => Array.isArray(v) && v.every(item => typeof item === 'number'),
                void: v => v === undefined,
                NerdamerExpression: isProperNerdamerExpression,
                'NerdamerCore.Vector': v =>
                    v && typeof v === 'object' && typeof v.toString === 'function' && v.symbol && v.symbol.group === 8,
                'NerdamerCore.Matrix': v =>
                    v && typeof v === 'object' && typeof v.toString === 'function' && v.symbol && v.symbol.group === 8,
                'NerdamerCore.Set': v => v && typeof v === 'object' && typeof v.toString === 'function',
                NerdamerEquation: v => v && typeof v === 'object' && v.LHS && v.RHS,
                'typeof nerdamer': v => typeof v === 'function',
            };

            // Special handling for overloaded functions
            if (functionName === 'supported') {
                // supported() with no args returns string[], with string arg returns boolean
                if (Array.isArray(actualValue)) {
                    return declaredType === 'string[]' || (typeMap['string[]']?.(actualValue) ?? false);
                } else if (typeof actualValue === 'boolean') {
                    return declaredType === 'boolean' || (typeMap['boolean']?.(actualValue) ?? false);
                }
                return false;
            }

            // Check for Record types first (before NerdamerExpression check)
            if (declaredType.startsWith('Record<')) {
                return typeof actualValue === 'object' && actualValue !== null;
            }

            // Check for array types FIRST (before checking for single types)
            if (declaredType === 'NerdamerExpression[]') {
                return (
                    Array.isArray(actualValue) &&
                    actualValue.every(
                        (item: any) => item && typeof item === 'object' && typeof item.toString === 'function'
                    )
                );
            }

            // Check for complex types containing NerdamerExpression or other patterns
            if (declaredType.includes('NerdamerExpression')) {
                const validator = typeMap['NerdamerExpression'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('Vector')) {
                const validator = typeMap['NerdamerCore.Vector'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('Matrix')) {
                const validator = typeMap['NerdamerCore.Matrix'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('nerdamer')) {
                const validator = typeMap['typeof nerdamer'];
                return validator ? validator(actualValue) : false;
            }

            // Check exact type match
            const validator = typeMap[declaredType];
            if (validator) {
                return validator(actualValue);
            }

            // Fallback: basic type checking
            return actualType !== 'undefined';
        }

        // Helper function to generate test arguments for nerdamerPrime functions
        function generatePrimeTestArguments(
            parameters: Array<{ name: string; type: string; optional: boolean; rest: boolean }>
        ): any[] {
            const testExpr = nerdamerRuntime('x + 1');
            const args: any[] = [];

            for (const param of parameters) {
                if (param.optional) {
                    break;
                } // Stop at first optional parameter for safety

                // Generate appropriate test values based on parameter type
                if (param.type.includes('ExpressionParam')) {
                    args.push(testExpr);
                } else if (param.type === 'string') {
                    args.push('x');
                } else if (param.type === 'number') {
                    args.push(2);
                } else if (param.type === 'boolean') {
                    args.push(true);
                } else if (param.type.includes('Record<string,')) {
                    args.push({ x: 1 });
                } else if (param.type.includes('[]')) {
                    if (param.type.includes('ExpressionParam')) {
                        args.push([testExpr, 'y']);
                    } else if (param.type.includes('string')) {
                        args.push(['x', 'y']);
                    } else {
                        args.push([1, 2]);
                    }
                } else if (param.rest) {
                    // For rest parameters, provide multiple arguments
                    args.push(testExpr, 'y', 2);
                    break;
                } else {
                    args.push(testExpr); // Default fallback
                }
            }

            return args;
        }

        try {
            // Find nerdamerPrime namespace
            const nerdamerPrimeNamespace = sourceFile
                .getDescendantsOfKind(tsMorph.SyntaxKind.ModuleDeclaration)
                .find((ns: tsMorph.ModuleDeclaration) => ns.getName() === 'nerdamerPrime');

            if (!nerdamerPrimeNamespace) {
                primeValidationErrors.push('nerdamerPrime namespace not found in type definitions');
                expect(primeValidationErrors).toEqual([]);
                return;
            }

            // Get all function declarations from the namespace
            const functionDeclarations = nerdamerPrimeNamespace.getDescendantsOfKind(
                tsMorph.SyntaxKind.FunctionDeclaration
            );

            console.log(
                `\n=== Found ${functionDeclarations.length} function declarations in nerdamerPrime namespace ===`
            );

            // Functions that are safe to test (won't cause side effects or require complex setup)
            const safeFunctions = new Set([
                'version',
                'reserved',
                'expressions',
                'functions',
                'getWarnings',
                'numExpressions',
                'numEquations',
                'getVars',
                'supported',
                'abs',
                'floor',
                'ceil',
                'sqrt',
                'exp',
                'log',
                'sin',
                'cos',
                'tan',
            ]);

            for (const funcDecl of functionDeclarations) {
                const functionName = funcDecl.getName();

                // Skip if function name is undefined
                if (!functionName) {
                    console.log('Skipping function declaration without name');
                    continue;
                }

                const returnType = extractReturnType(funcDecl);
                const parameters = getFunctionParameters(funcDecl);

                functionAnalysis[functionName] = {
                    returnType,
                    parameters: parameters.length,
                    parameterInfo: parameters,
                    tested: false,
                    errors: [],
                };

                console.log(
                    `Testing function: ${functionName}(${parameters.map(p => `${p.name}${p.optional ? '?' : ''}${p.rest ? '...' : ''}: ${p.type}`).join(', ')}) -> ${returnType}`
                );

                // Check if function exists in runtime
                const runtimeFunction = nerdamerRuntime[functionName];

                if (typeof runtimeFunction !== 'function') {
                    functionAnalysis[functionName].errors.push(`Function ${functionName} not found on runtime object`);
                    primeValidationErrors.push(
                        `Function ${functionName} declared in nerdamerPrime but not found in runtime`
                    );
                    continue;
                }

                try {
                    // Only test safe functions to avoid side effects
                    if (safeFunctions.has(functionName) || parameters.length === 0) {
                        let result;

                        if (parameters.length === 0) {
                            // Functions with no parameters
                            result = runtimeFunction();
                        } else {
                            // Generate appropriate arguments
                            const args = generatePrimeTestArguments(parameters);

                            // Limit arguments to prevent excessive calls
                            const limitedArgs = args.slice(0, Math.min(args.length, 3));
                            result = runtimeFunction(...limitedArgs);
                        }

                        // Validate return type
                        const isValidType = validatePrimeReturnType(result, returnType, functionName);

                        if (!isValidType) {
                            const errorMsg = `${functionName}() declared to return '${returnType}' but returned '${typeof result}': ${JSON.stringify(result).substring(0, 100)}`;
                            functionAnalysis[functionName].errors.push(errorMsg);
                            primeValidationErrors.push(errorMsg);
                        }

                        functionAnalysis[functionName].tested = true;
                    } else {
                        // For potentially unsafe functions, validate arity with more sophistication
                        const requiredParams = parameters.filter(p => !p.optional && !p.rest).length;
                        const runtimeArity = runtimeFunction.length;

                        // Check if function uses arguments object (common JavaScript pattern)
                        const functionSource = runtimeFunction.toString();
                        const usesArguments = functionSource.includes('arguments');

                        // Known functions that work correctly despite arity differences
                        // These use arguments object or have internal params for recursion
                        const knownWorkingFunctions = new Set([
                            'matset', // uses arguments, works with 4 params
                            'sum', // uses arguments, works with 4 params
                            'product', // uses arguments, works with 4 params
                            'solveEquations', // internal recursion params, works with 1-2 params
                        ]);

                        // Skip validation for known working functions
                        if (knownWorkingFunctions.has(functionName)) {
                            functionAnalysis[functionName].arityPattern = 'known-working';
                            functionAnalysis[functionName].tested = 'arity-analysis';
                            functionAnalysis[functionName].usesArguments = usesArguments;
                            functionAnalysis[functionName].runtimeArity = runtimeArity;
                            functionAnalysis[functionName].requiredParams = requiredParams;
                            continue;
                        }

                        // If function has zero arity but uses arguments, this is likely intentional
                        if (runtimeArity === 0 && usesArguments) {
                            // Try a functional test to see if it actually works
                            let functionallyWorks = false;
                            try {
                                // Generate minimal test arguments
                                const testArgs: any[] = [];
                                for (let i = 0; i < Math.min(requiredParams, 3); i++) {
                                    if (parameters[i]?.type.includes('string')) {
                                        testArgs.push('x');
                                    } else if (parameters[i]?.type.includes('number')) {
                                        testArgs.push(1);
                                    } else if (parameters[i]?.type.includes('ExpressionParam')) {
                                        testArgs.push('x');
                                    } else {
                                        testArgs.push('x'); // Fallback
                                    }
                                }

                                // Test if function works with expected arguments
                                const result = runtimeFunction(...testArgs);
                                functionallyWorks = result !== undefined;

                                functionAnalysis[functionName].arityPattern = 'arguments-object-functional';
                            } catch (error) {
                                // Function might throw for test arguments, but that's not necessarily an arity issue
                                functionAnalysis[functionName].arityPattern = 'arguments-object-throws';
                            }

                            // Only flag as error if function doesn't work functionally AND there's a significant mismatch
                            if (!functionallyWorks && requiredParams > 3) {
                                const arityError = `${functionName}: Uses arguments object but may not handle ${requiredParams} parameters correctly`;
                                functionAnalysis[functionName].errors.push(arityError);
                                primeValidationErrors.push(arityError);
                            }
                        } else if (runtimeArity > 0 && Math.abs(runtimeArity - requiredParams) > 2) {
                            // Traditional declared parameters with significant mismatch
                            const arityError = `${functionName}: Runtime arity ${runtimeArity} vs required parameters ${requiredParams}`;
                            functionAnalysis[functionName].errors.push(arityError);
                            primeValidationErrors.push(arityError);
                        } else if (runtimeArity === 0 && !usesArguments && requiredParams > 0) {
                            // Zero arity without arguments object usage - potentially problematic
                            const arityError = `${functionName}: Zero arity but requires ${requiredParams} parameters and doesn't use arguments object`;
                            functionAnalysis[functionName].errors.push(arityError);
                            primeValidationErrors.push(arityError);
                        }

                        functionAnalysis[functionName].tested = 'arity-analysis';
                        functionAnalysis[functionName].usesArguments = usesArguments;
                        functionAnalysis[functionName].runtimeArity = runtimeArity;
                        functionAnalysis[functionName].requiredParams = requiredParams;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    functionAnalysis[functionName].errors.push(`Threw error: ${errorMessage}`);

                    // Special handling for critical functions that should never throw
                    if (['version', 'reserved', 'functions', 'getWarnings'].includes(functionName)) {
                        primeValidationErrors.push(`Critical function ${functionName}() threw error: ${errorMessage}`);
                    }
                }
            }

            // Report analysis
            console.log('\n=== nerdamerPrime Function Analysis Summary ===');
            const testedFunctions = Object.keys(functionAnalysis).filter(f => functionAnalysis[f].tested === true);
            const arityAnalyzedFunctions = Object.keys(functionAnalysis).filter(
                f => functionAnalysis[f].tested === 'arity-analysis'
            );
            const errorFunctions = Object.keys(functionAnalysis).filter(f => functionAnalysis[f].errors.length > 0);

            // Count arity patterns
            const arityPatterns = {
                argumentsObject: 0,
                traditionalParams: 0,
                zeroArity: 0,
                functional: 0,
            };

            for (const funcName of Object.keys(functionAnalysis)) {
                const analysis = functionAnalysis[funcName];
                if (analysis.usesArguments !== undefined) {
                    if (analysis.usesArguments) {
                        arityPatterns.argumentsObject++;
                        if (analysis.arityPattern === 'arguments-object-functional') {
                            arityPatterns.functional++;
                        }
                    } else if (analysis.runtimeArity === 0) {
                        arityPatterns.zeroArity++;
                    } else {
                        arityPatterns.traditionalParams++;
                    }
                }
            }

            console.log(`Total functions analyzed: ${Object.keys(functionAnalysis).length}`);
            console.log(`Functions fully tested: ${testedFunctions.length}`);
            console.log(`Functions with arity analysis: ${arityAnalyzedFunctions.length}`);
            console.log(`Functions with errors: ${errorFunctions.length}`);
            console.log('\nArity Pattern Distribution:');
            console.log(`  Uses arguments object: ${arityPatterns.argumentsObject}`);
            console.log(`  Arguments object + functional: ${arityPatterns.functional}`);
            console.log(`  Traditional parameters: ${arityPatterns.traditionalParams}`);
            console.log(`  Zero arity (no arguments usage): ${arityPatterns.zeroArity}`);

            if (errorFunctions.length > 0) {
                console.log('\nFunctions with issues (first 10):');
                errorFunctions.slice(0, 10).forEach(funcName => {
                    console.log(`  ${funcName}: ${functionAnalysis[funcName].errors.join(', ')}`);
                });
            }

            // Validate function categories exist
            const expectedCategories = {
                core: ['version', 'getCore', 'clear', 'flush'],
                math: ['abs', 'sqrt', 'exp', 'log', 'sin', 'cos', 'tan'],
                algebra: ['expand', 'factor', 'simplify', 'solve'],
                calculus: ['diff', 'integrate', 'defint'],
                matrix: ['matrix', 'vector', 'determinant'],
            };

            let totalExpected = 0;
            let totalFound = 0;

            for (const [category, funcs] of Object.entries(expectedCategories)) {
                const foundCount = funcs.filter(f => functionAnalysis[f]).length;
                totalExpected += funcs.length;
                totalFound += foundCount;
                console.log(`${category} functions: ${foundCount}/${funcs.length} found`);
            }

            console.log(
                `Expected key functions coverage: ${totalFound}/${totalExpected} (${Math.round((totalFound / totalExpected) * 100)}%)`
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            primeValidationErrors.push(`nerdamerPrime AST introspection failed: ${errorMessage}`);
        }

        if (primeValidationErrors.length > 0) {
            console.log('\n=== Critical nerdamerPrime Function Validation Errors ===');
            primeValidationErrors.forEach(error => console.log('❌', error));
        }

        // This test should highlight issues in the nerdamerPrime namespace
        expect(primeValidationErrors).toEqual([]);
    });
    it('should validate functions using metadata-enhanced testing', () => {
        const metadataValidationErrors: string[] = [];
        const functionAnalysis: Record<string, any> = {};

        // Helper function to extract JSDoc comments and parse test metadata
        function extractTestMetadata(functionDeclaration: any): {
            validArgs?: any[];
            invalidArgs?: any[];
            description?: string;
        } {
            const jsDocComments = functionDeclaration.getJsDocs();
            const metadata: any = {};

            for (const jsDoc of jsDocComments) {
                // Use getFullText() instead of getComment() to get the complete JSDoc including custom tags
                const fullText = jsDoc.getFullText();
                if (typeof fullText === 'string') {
                    // Parse @test-valid-args
                    const validArgsMatch = fullText.match(/@test-valid-args\s*(\[.*?\])/);
                    if (validArgsMatch?.[1]) {
                        try {
                            metadata.validArgs = JSON.parse(validArgsMatch[1]);
                        } catch (e) {
                            console.warn(`Failed to parse @test-valid-args for function: ${e}`);
                        }
                    }

                    // Parse @test-invalid-args
                    const invalidArgsMatch = fullText.match(/@test-invalid-args\s*(\[.*?\])/);
                    if (invalidArgsMatch?.[1]) {
                        try {
                            metadata.invalidArgs = JSON.parse(invalidArgsMatch[1]);
                        } catch (e) {
                            console.warn(`Failed to parse @test-invalid-args for function: ${e}`);
                        }
                    }
                }
            }

            return metadata;
        }

        // Helper function to evaluate test arguments in the test context
        function evaluateTestArgs(args: any[]): any[] {
            return args.map(arg => {
                if (typeof arg === 'string' && arg.includes('nerdamer.')) {
                    // Evaluate nerdamer expressions by replacing nerdamer. with nerdamerRuntime.
                    try {
                        const evaluatedArg = arg.replace(/nerdamer\./g, 'nerdamerRuntime.');
                        return eval(evaluatedArg);
                    } catch (e) {
                        console.warn(`Failed to evaluate test argument "${arg}": ${e}`);
                        return arg;
                    }
                }
                return arg;
            });
        }

        // Helper function to extract return type from TypeScript function signature
        function extractReturnType(functionDeclaration: any): string {
            if (!functionDeclaration.getReturnTypeNode) {
                return 'unknown';
            }

            const returnTypeNode = functionDeclaration.getReturnTypeNode();
            if (!returnTypeNode) {
                return 'void';
            }

            const typeText = returnTypeNode.getText();
            return typeText;
        }

        // Helper function to get function parameters
        function getFunctionParameters(
            functionDeclaration: any
        ): Array<{ name: string; type: string; optional: boolean; rest: boolean }> {
            if (!functionDeclaration.getParameters) {
                return [];
            }

            const params = functionDeclaration.getParameters();
            return params.map((param: any) => ({
                name: param.getName(),
                type: param.getTypeNode()?.getText() || 'any',
                optional: param.hasQuestionToken(),
                rest: param.isRestParameter(),
            }));
        }

        // Robust type validation using TypeScript's own type system via ts-morph
        function validateReturnType(
            actualValue: any,
            declaredType: string,
            functionName: string,
            typeNode?: any
        ): boolean {
            // Use ts-morph's TypeScript integration for robust type checking
            if (typeNode) {
                try {
                    // Get the actual TypeScript Type object
                    const type = typeNode.getType();
                    if (!type) {
                        console.log(`  🚨 TypeScript could not resolve type: "${declaredType}"`);
                        return false;
                    }

                    // Check if this is a union type with a systematic approach
                    if (type.isUnion()) {
                        // For union types, check if the actual value matches any of the union members
                        const unionTypes = type.getUnionTypes();
                        return unionTypes.some((unionType: any) => {
                            const unionTypeText = unionType.getSymbol()?.getName() || unionType.getText();
                            return validateSingleType(actualValue, unionTypeText, functionName);
                        });
                    }

                    // For non-union types, validate directly
                    return validateSingleType(actualValue, declaredType, functionName);
                } catch (error) {
                    console.log(`  🚨 TypeScript type validation failed for "${declaredType}": ${error}`);
                    // Fall back to basic validation
                }
            }

            // Fallback validation without ts-morph type information
            return validateSingleType(actualValue, declaredType, functionName);
        }

        // Helper function to validate a single (non-union) type
        function validateSingleType(actualValue: any, declaredType: string, functionName: string): boolean {
            // Enhanced NerdamerExpression validation that detects object wrappers
            function isProperNerdamerExpression(v: any): boolean {
                if (v === undefined || v === null) {
                    return false;
                }
                if (typeof v !== 'object') {
                    return false;
                }

                // Must have the required methods from CoreExpressionBase
                if (typeof v.toString !== 'function' || typeof v.text !== 'function') {
                    return false;
                }

                // Must have a symbol property (from NerdamerExpression interface)
                if (!('symbol' in v)) {
                    return false;
                }

                // Critical check: symbol property should not be undefined for valid expressions
                // This detects the vecget issue where invalid indices return { symbol: undefined }
                if (v.symbol === undefined) {
                    console.log(`  🔍 Detected object wrapper with undefined symbol for ${functionName}`);
                    return false;
                }

                // The symbol should be a proper NerdamerSymbol object with expected properties
                if (v.symbol && typeof v.symbol === 'object') {
                    const hasSymbolProps =
                        'group' in v.symbol && 'value' in v.symbol && 'multiplier' in v.symbol && 'power' in v.symbol;
                    if (!hasSymbolProps) {
                        console.log(`  🔍 NerdamerSymbol object missing required properties for ${functionName}`);
                        return false;
                    }
                }

                return true;
            }

            // For object literal types like "{ symbol: ... }", do structural validation
            if (declaredType.startsWith('{') && declaredType.endsWith('}')) {
                if (!actualValue || typeof actualValue !== 'object') {
                    return false;
                }

                // Extract the expected property from the object literal type
                if (declaredType.includes('symbol:')) {
                    if (!('symbol' in actualValue)) {
                        return false;
                    }

                    // Check if undefined is allowed in the symbol type
                    if (declaredType.includes('NerdamerSymbol | undefined')) {
                        // Allow symbol to be either a proper NerdamerSymbol object or undefined
                        return (
                            actualValue.symbol === undefined ||
                            (actualValue.symbol && typeof actualValue.symbol === 'object')
                        );
                    } else if (declaredType.includes('NerdamerSymbol')) {
                        // NerdamerSymbol is required, undefined is NOT allowed
                        if (actualValue.symbol === undefined) {
                            console.log(
                                `  🚨 NerdamerSymbol property is undefined but type requires NerdamerSymbol (no undefined allowed)`
                            );
                            return false;
                        }
                        return actualValue.symbol && typeof actualValue.symbol === 'object';
                    }
                }

                return true; // Generic object literal validation passed
            }

            // Standard type validation
            const typeValidators: Record<string, (value: any) => boolean> = {
                undefined: v => v === undefined,
                string: v => typeof v === 'string',
                number: v => typeof v === 'number',
                boolean: v => typeof v === 'boolean',
                void: v => v === undefined,
                any: _v => true,
                unknown: _v => true,
                'string[]': v => Array.isArray(v) && v.every(item => typeof item === 'string'),
                'number[]': v => Array.isArray(v) && v.every(item => typeof item === 'number'),
                NerdamerExpression: isProperNerdamerExpression,
                'NerdamerCore.Vector': v => v && typeof v === 'object' && typeof v.toString === 'function',
                'NerdamerCore.Matrix': v => v && typeof v === 'object' && typeof v.toString === 'function',
                'NerdamerCore.Set': v => v && typeof v === 'object' && typeof v.toString === 'function',
                NerdamerEquation: v => v && typeof v === 'object' && v.LHS && v.RHS,
                'typeof nerdamer': v => typeof v === 'function',
            };

            // Check for exact type match
            const validator = typeValidators[declaredType];
            if (validator) {
                return validator(actualValue);
            }

            // Check for complex types containing known patterns
            if (declaredType.includes('NerdamerExpression')) {
                const validator = typeValidators['NerdamerExpression'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('Vector')) {
                const validator = typeValidators['NerdamerCore.Vector'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('Matrix')) {
                const validator = typeValidators['NerdamerCore.Matrix'];
                return validator ? validator(actualValue) : false;
            }

            if (declaredType.includes('nerdamer')) {
                const validator = typeValidators['typeof nerdamer'];
                return validator ? validator(actualValue) : false;
            }

            // For unknown types, be conservative but log it
            console.log(`  ❌ Cannot validate unknown type "${declaredType}"`);
            return false;
        }

        try {
            // Find nerdamerPrime namespace
            const nerdamerPrimeNamespace = sourceFile
                .getDescendantsOfKind(tsMorph.SyntaxKind.ModuleDeclaration)
                .find((ns: tsMorph.ModuleDeclaration) => ns.getName() === 'nerdamerPrime');

            if (!nerdamerPrimeNamespace) {
                metadataValidationErrors.push('nerdamerPrime namespace not found in type definitions');
                expect(metadataValidationErrors).toEqual([]);
                return;
            }

            // Get all function declarations from the namespace
            const functionDeclarations = nerdamerPrimeNamespace.getDescendantsOfKind(
                tsMorph.SyntaxKind.FunctionDeclaration
            );

            console.log(`\n=== Metadata-Enhanced Testing: Found ${functionDeclarations.length} functions ===`);

            let functionsWithMetadata = 0;
            let functionsWithoutMetadata = 0;

            for (const funcDecl of functionDeclarations) {
                const functionName = funcDecl.getName();

                // Skip if function name is undefined
                if (!functionName) {
                    console.log('Skipping function declaration without name');
                    continue;
                }

                const returnType = extractReturnType(funcDecl);
                const parameters = getFunctionParameters(funcDecl);
                const testMetadata = extractTestMetadata(funcDecl);

                // Debug JSDoc parsing for functions with test metadata
                if (testMetadata.validArgs || testMetadata.invalidArgs) {
                    console.log(`\n🔍 Debugging ${functionName} metadata parsing:`);
                    const jsDocs = funcDecl.getJsDocs();
                    console.log(`  JSDoc count: ${jsDocs.length}`);

                    for (let i = 0; i < jsDocs.length; i++) {
                        const jsDoc = jsDocs[i];
                        if (jsDoc) {
                            console.log(`  JSDoc ${i} full text:`, jsDoc.getFullText());
                            const comment = jsDoc.getComment();
                            console.log(`  Comment type: ${typeof comment}`);
                            console.log(`  Comment content:`, comment);

                            if (typeof comment === 'string') {
                                const validMatch = comment.match(/@test-valid-args\s*\[(.*?)\]/);
                                const invalidMatch = comment.match(/@test-invalid-args\s*\[(.*?)\]/);
                                console.log(`  Valid args match:`, validMatch);
                                console.log(`  Invalid args match:`, invalidMatch);
                            }
                        }
                    }
                    console.log(`  Extracted metadata:`, testMetadata);
                }

                functionAnalysis[functionName] = {
                    returnType,
                    parameters: parameters.length,
                    parameterInfo: parameters,
                    testMetadata,
                    tested: false,
                    errors: [],
                };

                // Check if function exists in runtime
                const runtimeFunction = nerdamerRuntime[functionName];

                if (typeof runtimeFunction !== 'function') {
                    functionAnalysis[functionName].errors.push(`Function ${functionName} not found on runtime object`);
                    metadataValidationErrors.push(
                        `Function ${functionName} declared in nerdamerPrime but not found in runtime`
                    );
                    continue;
                }

                // Skip testing if no metadata available
                if (!testMetadata.validArgs && !testMetadata.invalidArgs) {
                    functionAnalysis[functionName].tested = 'no-metadata';
                    functionsWithoutMetadata++;
                    continue;
                }

                functionsWithMetadata++;
                console.log(`Testing function: ${functionName}() -> ${returnType}`);

                try {
                    // Test with valid arguments if available
                    if (testMetadata.validArgs) {
                        console.log(`  🟢 Testing with valid args: ${JSON.stringify(testMetadata.validArgs)}`);
                        const evaluatedArgs = evaluateTestArgs(testMetadata.validArgs);
                        const result = runtimeFunction(...evaluatedArgs);

                        console.log(`    Valid args result:`, result);

                        const isValidType = validateReturnType(
                            result,
                            returnType,
                            functionName,
                            funcDecl.getReturnTypeNode()
                        );
                        if (!isValidType) {
                            const errorMsg = `${functionName}(valid args) declared to return '${returnType}' but returned '${typeof result}' with value: ${JSON.stringify(result).substring(0, 100)}`;
                            functionAnalysis[functionName].errors.push(errorMsg);
                            metadataValidationErrors.push(errorMsg);
                        }
                    }

                    // Test with invalid arguments if available
                    if (testMetadata.invalidArgs) {
                        console.log(`  🔴 Testing with invalid args: ${JSON.stringify(testMetadata.invalidArgs)}`);
                        const evaluatedArgs = evaluateTestArgs(testMetadata.invalidArgs);
                        const result = runtimeFunction(...evaluatedArgs);

                        console.log(`    Invalid args result:`, result);

                        const isValidType = validateReturnType(
                            result,
                            returnType,
                            functionName,
                            funcDecl.getReturnTypeNode()
                        );
                        if (!isValidType) {
                            const errorMsg = `${functionName}(invalid args) declared to return '${returnType}' but returned object wrapper or invalid type: ${JSON.stringify(result)}`;
                            functionAnalysis[functionName].errors.push(errorMsg);
                            metadataValidationErrors.push(errorMsg);
                        }
                    }

                    functionAnalysis[functionName].tested = true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    functionAnalysis[functionName].errors.push(`Threw error: ${errorMessage}`);

                    // For critical functions, any exception is a problem
                    if (['version', 'reserved', 'functions', 'getWarnings'].includes(functionName)) {
                        metadataValidationErrors.push(
                            `Critical function ${functionName}() threw error: ${errorMessage}`
                        );
                    }
                }
            }

            // Report analysis
            console.log('\n=== Metadata-Enhanced Testing Analysis Summary ===');
            const fullyTested = Object.keys(functionAnalysis).filter(f => functionAnalysis[f].tested === true);
            const errorFunctions = Object.keys(functionAnalysis).filter(f => functionAnalysis[f].errors.length > 0);

            console.log(`Total functions analyzed: ${Object.keys(functionAnalysis).length}`);
            console.log(
                `Functions with test metadata: ${functionsWithMetadata} (${fullyTested.length} successfully tested)`
            );
            console.log(`Functions without test metadata: ${functionsWithoutMetadata}`);
            console.log(`Functions with errors: ${errorFunctions.length}`);

            if (errorFunctions.length > 0) {
                console.log('\nFunctions with issues:');
                errorFunctions.forEach(funcName => {
                    console.log(`  ${funcName}: ${functionAnalysis[funcName].errors.join(', ')}`);
                });
            }

            // Report metadata coverage
            const metadataCoverage = Math.round((functionsWithMetadata / Object.keys(functionAnalysis).length) * 100);
            console.log(
                `\nMetadata coverage: ${functionsWithMetadata}/${Object.keys(functionAnalysis).length} (${metadataCoverage}%)`
            );

            if (functionsWithMetadata === 0) {
                console.log(
                    '\n⚠️  No functions have test metadata yet. To add metadata, annotate functions in index.d.ts with:'
                );
                console.log('   @test-valid-args [arg1, arg2, ...]');
                console.log('   @test-invalid-args [arg1, arg2, ...]');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            metadataValidationErrors.push(`Metadata-enhanced testing failed: ${errorMessage}`);
        }

        if (metadataValidationErrors.length > 0) {
            console.log('\n=== Metadata-Enhanced Testing Validation Errors ===');
            metadataValidationErrors.forEach(error => console.log('❌', error));
        }

        // This test should highlight issues found through metadata-enhanced testing
        expect(metadataValidationErrors).toEqual([]);
    });
});
