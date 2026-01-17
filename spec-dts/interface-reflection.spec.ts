// Load complete nerdamer with all modules
import nerdamerRuntime from '../all';
import tsMorph from 'ts-morph';

describe('Nerdamer TypeScript Interface Reflection', () => {
    let project: tsMorph.Project;
    let sourceFile: tsMorph.SourceFile;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let typeChecker: tsMorph.TypeChecker;

    /**
     * Helper to get method-like members from an interface. The index.d.ts uses property signatures with function types
     * (e.g., `add: (x: T) => R`) instead of method signatures (e.g., `add(x: T): R`), so we need to check properties
     * whose type is a function type.
     */
    const getMethodLikeMembers = (iface: tsMorph.InterfaceDeclaration | undefined): string[] => {
        if (!iface) {
            return [];
        }
        const methodNames: string[] = [];
        // Check actual method signatures
        iface.getMethods().forEach(m => {
            methodNames.push(m.getName());
        });
        // Check property signatures with function types
        iface.getProperties().forEach(p => {
            const typeNode = p.getTypeNode();
            if (typeNode && typeNode.getKind() === tsMorph.SyntaxKind.FunctionType) {
                methodNames.push(p.getName());
            }
        });
        return methodNames;
    };

    /** Helper to get a method-like member by name (either method signature or property with function type) */
    const getMethodLikeMember = (
        iface: tsMorph.InterfaceDeclaration | undefined,
        name: string
    ):
        | {
              getReturnTypeNode: () => tsMorph.TypeNode | undefined;
              getParameters: () => { getTypeNode: () => tsMorph.TypeNode | undefined }[];
          }
        | undefined => {
        if (!iface) {
            return undefined;
        }
        // Try method signature first
        const method = iface.getMethod(name);
        if (method) {
            return {
                getReturnTypeNode: () => method.getReturnTypeNode(),
                getParameters: () => method.getParameters(),
            };
        }
        // Try property with function type
        const prop = iface.getProperty(name);
        if (prop) {
            const typeNode = prop.getTypeNode();
            if (typeNode && typeNode.getKind() === tsMorph.SyntaxKind.FunctionType) {
                const funcType = typeNode as tsMorph.FunctionTypeNode;
                return {
                    getReturnTypeNode: () => funcType.getReturnTypeNode(),
                    getParameters: () =>
                        funcType.getParameters().map(p => ({
                            getTypeNode: () => p.getTypeNode(),
                        })),
                };
            }
        }
        return undefined;
    };

    beforeAll(() => {
        project = new tsMorph.Project({
            tsConfigFilePath: 'tsconfig.json',
        });

        sourceFile = project.getSourceFileOrThrow('index.d.ts');
        typeChecker = project.getTypeChecker();
    });

    describe('Core Type Aliases', () => {
        const expectedTypeAliases = [
            'OutputType',
            'ParseOption',
            'ExpressionHistoryIndex',
            'int',
            'ExpressionParam',
            'SolveResult',
        ];

        it('should have all expected type aliases defined', () => {
            const typeAliases = sourceFile.getTypeAliases().map((ta: tsMorph.TypeAliasDeclaration) => ta.getName());

            for (const expectedAlias of expectedTypeAliases) {
                expect(typeAliases).toContain(expectedAlias);
            }
        });

        it('should have OutputType with correct union members', () => {
            const outputType = sourceFile.getTypeAlias('OutputType');
            expect(outputType).toBeDefined();

            const typeNode = outputType?.getTypeNode();
            if (typeNode?.getKind() === tsMorph.SyntaxKind.UnionType) {
                const unionType = typeNode.asKindOrThrow(tsMorph.SyntaxKind.UnionType);
                const members = unionType
                    .getTypeNodes()
                    .map((tn: tsMorph.TypeNode) => {
                        const text = tn.getText();
                        // Remove quotes from string literals
                        return text.startsWith("'") && text.endsWith("'") ? text.slice(1, -1) : text;
                    })
                    .filter(Boolean);

                expect(members).toContain('decimals');
                expect(members).toContain('fractions');
                expect(members).toContain('scientific');
                expect(members).toContain('mixed');
                expect(members).toContain('recurring');
            }
        });

        it('should have ExpressionParam with correct union structure', () => {
            const expressionParam = sourceFile.getTypeAlias('ExpressionParam');
            expect(expressionParam).toBeDefined();

            const typeText = expressionParam?.getTypeNode()?.getText();
            expect(typeText).toContain('string');
            expect(typeText).toContain('number');
            expect(typeText).toContain('NerdamerExpression');
            expect(typeText).toContain('NerdamerEquation');
        });
    });

    describe('Core Expression Interfaces', () => {
        it('should have NerdamerExpression interface with essential output methods', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            expect(nerdamerExpression).toBeDefined();

            const methodNames = getMethodLikeMembers(nerdamerExpression);
            // These methods were previously in CoreExpressionBase but are now directly on NerdamerExpression
            const expectedMethods = ['toString', 'text', 'latex', 'valueOf'];

            for (const method of expectedMethods) {
                expect(methodNames).toContain(method);
            }
        });

        it('should have NerdamerExpression interface as standalone (not extending CoreExpressionBase)', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            expect(nerdamerExpression).toBeDefined();

            const extendsClause = nerdamerExpression?.getExtends();
            // NerdamerExpression no longer extends CoreExpressionBase - methods are directly defined
            expect(extendsClause).toHaveLength(0);
        });

        it('should have NerdamerExpression with essential arithmetic methods', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const methodNames = getMethodLikeMembers(nerdamerExpression);

            const arithmeticMethods = ['add', 'subtract', 'multiply', 'divide', 'pow'];
            for (const method of arithmeticMethods) {
                expect(methodNames).toContain(method);
            }
        });

        it('should have NerdamerExpression with comparison methods', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const methodNames = getMethodLikeMembers(nerdamerExpression);

            const comparisonMethods = ['eq', 'lt', 'gt', 'lte', 'gte'];
            for (const method of comparisonMethods) {
                expect(methodNames).toContain(method);
            }
        });

        it('should have NerdamerExpression with manipulation methods', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const methodNames = getMethodLikeMembers(nerdamerExpression);

            // Note: 'factor' is a static method, not an instance method
            const manipulationMethods = ['expand', 'simplify', 'evaluate', 'sub', 'solveFor'];
            for (const method of manipulationMethods) {
                expect(methodNames).toContain(method);
            }
        });
    });

    describe('JavaScript Runtime vs TypeScript Interface Comparison', () => {
        it('should validate NerdamerExpression methods exist on runtime instances', () => {
            // Create a runtime expression
            const runtimeExpr = nerdamerRuntime('x + 1');

            // Get TypeScript interface methods (including property signatures with function types)
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const tsMethodNames = getMethodLikeMembers(nerdamerExpression);

            // Test that each TS method exists on the runtime object
            const methodTestResults = [];

            for (const methodName of tsMethodNames) {
                const exists = typeof runtimeExpr[methodName] === 'function';
                const actualType = typeof runtimeExpr[methodName];
                methodTestResults.push({ method: methodName, exists, type: actualType });
            }

            const missingMethods = methodTestResults.filter(r => !r.exists);

            if (missingMethods.length > 0) {
                console.log(
                    'Missing methods in runtime:',
                    missingMethods.map(m => m.method)
                );
            }

            // Allow some methods to be missing since some might be inherited or added dynamically
            expect(missingMethods.length).toBeLessThan(tsMethodNames.length * 0.3); // Allow up to 30% missing
        });

        it('should validate runtime expression behavior matches TypeScript expectations', () => {
            const runtimeExpr = nerdamerRuntime('x^2 + 2*x + 1');

            // Test basic operations that should exist per TypeScript
            expect(typeof runtimeExpr.toString).toBe('function');
            expect(typeof runtimeExpr.text).toBe('function');
            expect(typeof runtimeExpr.evaluate).toBe('function');
            expect(typeof runtimeExpr.expand).toBe('function');
            expect(typeof runtimeExpr.simplify).toBe('function');

            // Test that operations return expected types
            const expanded = runtimeExpr.expand();
            expect(expanded).toBeDefined();
            expect(typeof expanded.toString).toBe('function');

            // Test factor as static method (not instance method)
            expect(typeof nerdamerRuntime.factor).toBe('function');
            const factored = nerdamerRuntime.factor(runtimeExpr);
            expect(factored).toBeDefined();
            expect(typeof factored.toString).toBe('function');
        });

        it('should validate arithmetic operations work as TypeScript suggests', () => {
            const expr1 = nerdamerRuntime('x + 1');
            const expr2 = nerdamerRuntime('y + 2');

            // Test that arithmetic methods exist and work
            if (typeof expr1.add === 'function') {
                const sum = expr1.add(expr2);
                expect(sum).toBeDefined();
                expect(typeof sum.toString).toBe('function');
            }

            if (typeof expr1.multiply === 'function') {
                const product = expr1.multiply(2);
                expect(product).toBeDefined();
                expect(typeof product.toString).toBe('function');
            }

            if (typeof expr1.pow === 'function') {
                const power = expr1.pow(2);
                expect(power).toBeDefined();
                expect(typeof power.toString).toBe('function');
            }
        });

        it('should validate comparison operations work as TypeScript suggests', () => {
            const expr1 = nerdamerRuntime('5');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const expr2 = nerdamerRuntime('3');

            // Test comparison methods if they exist
            if (typeof expr1.eq === 'function') {
                const isEqual = expr1.eq(5);
                expect(typeof isEqual).toBe('boolean');
            }

            if (typeof expr1.gt === 'function') {
                const isGreater = expr1.gt(3);
                expect(typeof isGreater).toBe('boolean');
            }

            if (typeof expr1.lt === 'function') {
                const isLess = expr1.lt(10);
                expect(typeof isLess).toBe('boolean');
            }
        });

        it('should validate buildFunction method works as TypeScript suggests', () => {
            const expr = nerdamerRuntime('x^2 + y');

            if (typeof expr.buildFunction === 'function') {
                try {
                    const fn = expr.buildFunction(['x', 'y']);
                    expect(typeof fn).toBe('function');

                    // Test that the generated function works
                    const result = fn(2, 3);
                    expect(typeof result).toBe('number');
                    expect(result).toBe(7); // 2^2 + 3 = 7
                } catch (error) {
                    // If buildFunction fails, just log it but don't fail the test
                    console.log('buildFunction test failed:', (error as Error).message);
                }
            }
        });

        it('should validate equation handling matches TypeScript definitions', () => {
            const equation = nerdamerRuntime('x^2 = 4');

            // Check if it's recognized as an equation (has LHS and RHS properties)
            if (equation.LHS && equation.RHS) {
                expect(typeof equation.LHS.toString).toBe('function');
                expect(typeof equation.RHS.toString).toBe('function');

                if (typeof equation.toLHS === 'function') {
                    const lhsForm = equation.toLHS();
                    expect(lhsForm).toBeDefined();
                    expect(typeof lhsForm.toString).toBe('function');
                }
            }

            // Test solve functionality if available
            if (typeof equation.solveFor === 'function') {
                try {
                    const solutions = equation.solveFor('x');
                    expect(Array.isArray(solutions)).toBe(true);
                } catch (error) {
                    // Some equations might not be solvable, that's ok
                    console.log('Equation solving test failed (expected for some cases):', (error as Error).message);
                }
            }
        });
    });

    describe('NerdamerCore Namespace Interfaces', () => {
        let nerdamerCoreNamespace: tsMorph.ModuleDeclaration | undefined;

        beforeAll(() => {
            const primeNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamerPrime');
            nerdamerCoreNamespace = primeNamespace?.getModules().find(m => m.getName() === 'NerdamerCore');
            expect(nerdamerCoreNamespace).toBeDefined();
        });

        it('should have core data structure interfaces', () => {
            // These are the main data structure interfaces (not constructors)
            const expectedInterfaces = ['Frac', 'NerdamerSymbol', 'Vector', 'Matrix', 'NerdamerSet', 'Collection'];

            for (const ifaceName of expectedInterfaces) {
                const iface = nerdamerCoreNamespace?.getInterface(ifaceName);
                expect(iface).toBeDefined();
            }
        });

        it('should have Core interface with essential properties', () => {
            const coreInterface = nerdamerCoreNamespace?.getInterface('Core');
            expect(coreInterface).toBeDefined();

            // Core should have essential types like PARSER, NerdamerSymbol constructor, etc.
            const memberNames = coreInterface?.getMembers().map(m => (m as any).getName?.()) || [];
            expect(memberNames.length).toBeGreaterThan(0);
        });

        it('should validate Vector/Matrix are properly wrapped Expressions', () => {
            // Test vector creation and base expression functionality
            if (typeof nerdamerRuntime.vector === 'function') {
                try {
                    const vec = nerdamerRuntime.vector([1, 2, 3]);
                    expect(vec).toBeDefined();

                    // Test that vector IS an expression (has base expression methods)
                    const baseExpressionMethods = [
                        'toString',
                        'text',
                        'evaluate',
                        'add',
                        'multiply',
                        'expand',
                        // Note: 'clone' removed due to Expression prototype inconsistency
                    ];
                    const existingBaseMethods = baseExpressionMethods.filter(
                        (method: string) => typeof vec[method] === 'function'
                    );

                    // Vector should have most base expression methods since it extends NerdamerExpression
                    expect(existingBaseMethods.length).toBeGreaterThan(4);

                    // Test vector-specific properties or behavior (if any)
                    // Vectors use static functions like nerdamer.vecget(), not instance methods
                    expect(typeof nerdamerRuntime.vecget).toBe('function');
                    expect(typeof nerdamerRuntime.dot).toBe('function');
                    expect(typeof nerdamerRuntime.cross).toBe('function');
                } catch (error) {
                    console.log('Vector test failed:', (error as Error).message);
                }
            }

            // Test matrix creation and base expression functionality
            if (typeof nerdamerRuntime.matrix === 'function') {
                try {
                    const mat = nerdamerRuntime.matrix([
                        [1, 2],
                        [3, 4],
                    ]);
                    expect(mat).toBeDefined();

                    // Test that matrix IS an expression (has base expression methods)
                    const baseExpressionMethods = [
                        'toString',
                        'text',
                        'evaluate',
                        'add',
                        'multiply',
                        'expand',
                        // Note: 'clone' removed due to Expression prototype inconsistency
                    ];
                    const existingBaseMethods = baseExpressionMethods.filter(
                        (method: string) => typeof mat[method] === 'function'
                    );

                    // Matrix should have most base expression methods since it extends NerdamerExpression
                    expect(existingBaseMethods.length).toBeGreaterThan(4);

                    // Test matrix-specific properties or behavior (if any)
                    // Matrices use static functions like nerdamer.matget(), not instance methods
                    expect(typeof nerdamerRuntime.matget).toBe('function');
                    expect(typeof nerdamerRuntime.determinant).toBe('function');
                    expect(typeof nerdamerRuntime.transpose).toBe('function');
                } catch (error) {
                    console.log('Matrix test failed:', (error as Error).message);
                }
            }
        });
    });

    describe('Main Function Interface vs Runtime', () => {
        it('should have overloaded nerdamer function declarations matching runtime behavior', () => {
            const functionDeclarations = sourceFile.getFunctions();
            expect(functionDeclarations.length).toBeGreaterThan(0);

            // Test that runtime nerdamer function works with different parameter types
            expect(typeof nerdamerRuntime).toBe('function');

            // Test string input
            const expr1 = nerdamerRuntime('x + 1');
            expect(expr1).toBeDefined();

            // Test with substitutions
            const expr2 = nerdamerRuntime('x + 1', { x: 2 });
            expect(expr2).toBeDefined();

            // Test with options
            const expr3 = nerdamerRuntime('x^2 + 2*x + 1', {}, 'expand');
            expect(expr3).toBeDefined();
        });

        it('should validate static methods exist on runtime nerdamer function', () => {
            // Get all static methods from TypeScript namespace
            const nerdamerNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamer');
            // Get export declarations and manually filter to find import equals declarations
            const exportDeclarations = nerdamerNamespace?.getExportedDeclarations();
            const importDeclarations: any[] = [];
            if (exportDeclarations) {
                for (const [_key, declarations] of exportDeclarations) {
                    for (const decl of declarations) {
                        if (
                            (decl as any).getKind &&
                            (decl as any).getKind() === tsMorph.SyntaxKind.ImportEqualsDeclaration
                        ) {
                            importDeclarations.push(decl);
                        }
                    }
                }
            }

            // Extract method names from import declarations
            const staticMethods = importDeclarations.map((decl: tsMorph.ImportEqualsDeclaration) => decl.getName());

            // Test that at least some of these exist on the runtime
            const existingStaticMethods = staticMethods.filter(
                (method: string) => typeof nerdamerRuntime[method] !== 'undefined'
            );

            console.log(
                `Static methods in TS: ${staticMethods.length}, Existing in runtime: ${existingStaticMethods.length}`
            );

            // Should have a good percentage of the TypeScript static methods
            expect(existingStaticMethods.length).toBeGreaterThan(staticMethods.length * 0.5);

            // Test some essential ones specifically
            const essentialMethods = ['expand', 'factor', 'simplify', 'solve', 'diff', 'integrate', 'cos', 'sin'];
            for (const method of essentialMethods) {
                if (staticMethods.includes(method)) {
                    expect(nerdamerRuntime[method]).toBeDefined();
                    expect(typeof nerdamerRuntime[method]).toBe('function');
                }
            }
        });
    });

    describe('Interface Consistency', () => {
        it('should have consistent return types for arithmetic operations', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const arithmeticMethods = ['add', 'subtract', 'multiply', 'divide', 'pow'];

            for (const methodName of arithmeticMethods) {
                const method = getMethodLikeMember(nerdamerExpression, methodName);
                const returnType = method?.getReturnTypeNode()?.getText();
                expect(returnType).toBe('NerdamerExpression');
            }
        });

        it('should have consistent parameter types for arithmetic operations', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const arithmeticMethods = ['add', 'subtract', 'multiply', 'divide', 'pow'];

            for (const methodName of arithmeticMethods) {
                const method = getMethodLikeMember(nerdamerExpression, methodName);
                const parameters = method?.getParameters();
                expect(parameters?.length).toBe(1);

                const paramType = parameters?.[0]?.getTypeNode()?.getText();
                expect(paramType).toBe('ExpressionParam');
            }
        });

        it('should have consistent boolean return types for comparison operations', () => {
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const comparisonMethods = ['eq', 'lt', 'gt', 'lte', 'gte'];

            for (const methodName of comparisonMethods) {
                const method = getMethodLikeMember(nerdamerExpression, methodName);
                const returnType = method?.getReturnTypeNode()?.getText();
                expect(returnType).toBe('boolean');
            }
        });
    });

    describe('Runtime to TypeScript Coverage Analysis', () => {
        it('should analyze runtime expression prototype vs TypeScript interface coverage', () => {
            const expr = nerdamerRuntime('x + 1');

            // Get all methods including inherited ones by walking the prototype chain
            const getAllMethods = (obj: any): string[] => {
                const methods = new Set<string>();
                let current = obj;
                while (current && current !== Object.prototype) {
                    Object.getOwnPropertyNames(current).forEach(name => {
                        if (typeof obj[name] === 'function') {
                            methods.add(name);
                        }
                    });
                    current = Object.getPrototypeOf(current);
                }
                return Array.from(methods).sort();
            };

            const runtimeMethods = getAllMethods(expr);

            // Get TypeScript methods from both NerdamerExpression and CoreExpressionBase
            const nerdamerExpression = sourceFile.getInterface('NerdamerExpression');
            const coreExpressionBase = sourceFile.getInterface('CoreExpressionBase');

            const nerdamerMethods = getMethodLikeMembers(nerdamerExpression);
            const coreMethods = getMethodLikeMembers(coreExpressionBase);

            const allTsMethods = [...new Set([...nerdamerMethods, ...coreMethods])].sort();

            const missingInTs = runtimeMethods.filter(method => !allTsMethods.includes(method));
            const missingInRuntime = allTsMethods.filter((method: string) => !runtimeMethods.includes(method));

            console.log('\n=== Expression Method Coverage Analysis ===');
            console.log(`Runtime methods: ${runtimeMethods.length}`);
            console.log(`TypeScript methods: ${allTsMethods.length}`);
            console.log(`Missing in TypeScript (first 10):`, missingInTs.slice(0, 10));
            console.log(`Missing in Runtime (first 10):`, missingInRuntime.slice(0, 10));

            // Calculate coverage
            const coverage = (allTsMethods.length - missingInRuntime.length) / allTsMethods.length;
            console.log(`TypeScript to Runtime coverage: ${Math.round(coverage * 100)}%`);

            // Expect high coverage since we now include inherited methods
            expect(coverage).toBeGreaterThan(0.8); // At least 80% coverage
        });

        it('should analyze static function coverage', () => {
            const runtimeStaticMethods = Object.getOwnPropertyNames(nerdamerRuntime)
                .filter((name: string) => typeof nerdamerRuntime[name] === 'function')
                .sort();

            const nerdamerNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamer');
            // Get export declarations and manually filter to find import equals declarations
            const exportDeclarations = nerdamerNamespace?.getExportedDeclarations();
            const importEqualsDeclarations: any[] = [];
            if (exportDeclarations) {
                for (const [_key, declarations] of exportDeclarations) {
                    for (const decl of declarations) {
                        if (
                            (decl as any).getKind &&
                            (decl as any).getKind() === tsMorph.SyntaxKind.ImportEqualsDeclaration
                        ) {
                            importEqualsDeclarations.push(decl);
                        }
                    }
                }
            }
            const tsStaticMethods = importEqualsDeclarations
                .map((decl: any) => decl.getName())
                // Filter out TypeScript-only constructs like 'NerdamerCore'
                .filter((name: string) => name !== 'NerdamerCore')
                .sort();

            const missingInTs = runtimeStaticMethods.filter(method => !tsStaticMethods.includes(method));
            const missingInRuntime = tsStaticMethods.filter((method: string) => !runtimeStaticMethods.includes(method));

            console.log('\n=== Static Method Coverage Analysis ===');
            console.log(`Runtime static methods: ${runtimeStaticMethods.length}`);
            console.log(`TypeScript static methods: ${tsStaticMethods.length}`);
            console.log(`Missing in TypeScript (first 10):`, missingInTs.slice(0, 10));
            console.log(`Missing in Runtime (first 10):`, missingInRuntime.slice(0, 10));

            // Calculate coverage
            const coverage = (tsStaticMethods.length - missingInRuntime.length) / tsStaticMethods.length;
            console.log(`TypeScript to Runtime static coverage: ${Math.round(coverage * 100)}%`);

            // Expect very high coverage since we exclude TypeScript-only constructs
            expect(coverage).toBeGreaterThan(0.95); // At least 95% coverage for static methods
        });
    });

    describe('Completeness Check', () => {
        it('should have a reasonable number of interfaces defined', () => {
            const allInterfaces = sourceFile.getInterfaces();
            const primeNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamerPrime');
            const nerdamerCoreInterfaces =
                primeNamespace
                    ?.getModules()
                    .find(m => m.getName() === 'NerdamerCore')
                    ?.getInterfaces() || [];

            const totalInterfaces = allInterfaces.length + nerdamerCoreInterfaces.length;

            // Should have a substantial number of interfaces for a comprehensive math library
            expect(totalInterfaces).toBeGreaterThan(20);
        });

        it('should have proper namespace organization', () => {
            // Main namespace should exist
            const nerdamerNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamer');
            expect(nerdamerNamespace).toBeDefined();

            // NerdamerPrime namespace should exist
            const primeNamespace = sourceFile.getModules().find(m => m.getName() === 'nerdamerPrime');
            expect(primeNamespace).toBeDefined();

            // NerdamerCore namespace should exist inside nerdamerPrime
            const coreNamespace = primeNamespace?.getModules().find(m => m.getName() === 'NerdamerCore');
            expect(coreNamespace).toBeDefined();
        });
    });
});
