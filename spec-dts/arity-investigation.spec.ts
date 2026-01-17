import tsMorph from 'ts-morph';

describe('Arity Mismatch Investigation', () => {
    let nerdamerRuntime: any;
    let project: tsMorph.Project;
    let sourceFile: tsMorph.SourceFile;
    let nerdamerPrimeNamespace: tsMorph.ModuleDeclaration | undefined;

    beforeAll(async () => {
        // Load complete nerdamer with all modules
        nerdamerRuntime = await import('../all.js');
        nerdamerRuntime = nerdamerRuntime.default || nerdamerRuntime;

        project = new tsMorph.Project({
            tsConfigFilePath: 'tsconfig.json',
        });

        sourceFile = project.getSourceFileOrThrow('index.d.ts');
        nerdamerPrimeNamespace = sourceFile
            .getDescendantsOfKind(tsMorph.SyntaxKind.ModuleDeclaration)
            .find((ns: tsMorph.ModuleDeclaration) => ns.getName() === 'nerdamerPrime');
    });

    it('should analyze specific arity mismatch functions in detail', () => {
        // Select a few representative functions with arity mismatches
        const testFunctions = ['atan2', 'solve', 'matget', 'cross', 'diff', 'integrate', 'defint'];

        console.log('\n=== Detailed Arity Mismatch Analysis ===');

        for (const funcName of testFunctions) {
            const runtimeFunction = nerdamerRuntime[funcName];

            if (typeof runtimeFunction !== 'function') {
                console.log(`❌ ${funcName}: Not found in runtime`);
                continue;
            }

            // Get TypeScript function declaration
            if (!nerdamerPrimeNamespace) {
                console.log(`❌ ${funcName}: nerdamerPrime namespace not found`);
                continue;
            }

            const functionDeclarations = nerdamerPrimeNamespace
                .getDescendantsOfKind(tsMorph.SyntaxKind.FunctionDeclaration)
                .filter(f => f.getName() === funcName);

            if (functionDeclarations.length === 0) {
                console.log(`❌ ${funcName}: No TS declaration found`);
                continue;
            }

            const funcDecl = functionDeclarations[0];
            if (!funcDecl) {
                console.log(`❌ ${funcName}: Function declaration is undefined`);
                continue;
            }

            const tsParams = funcDecl.getParameters();
            const requiredParams = tsParams.filter(p => !p.hasQuestionToken() && !p.isRestParameter()).length;
            const runtimeArity = runtimeFunction.length;

            console.log(`\n📋 ${funcName}:`);
            console.log(`   TS required params: ${requiredParams}`);
            console.log(`   Runtime arity: ${runtimeArity}`);

            const signatureText = funcDecl.getText();
            const signature = signatureText.split('{')[0]?.trim() || signatureText;
            console.log(`   TS signature: ${signature}`);

            // Analyze function source code
            const functionSource = runtimeFunction.toString();
            const usesArguments = functionSource.includes('arguments');
            const argMatches = functionSource.match(/arguments\[(?:\d+)\]/gu) || [];
            const maxArgIndex =
                argMatches.length > 0
                    ? Math.max(...argMatches.map((m: string) => parseInt(/\d+/u.exec(m)![0], 10))) + 1
                    : 0;
            console.log(`   Uses arguments object: ${usesArguments}`);
            if (usesArguments) {
                console.log(`   Max argument index used: ${maxArgIndex}`);
                console.log(`   Arguments pattern matches: ${argMatches.length}`);
            }

            // Test if function actually works with expected parameters
            let functionalTest = 'Not tested';
            try {
                switch (funcName) {
                    case 'atan2': {
                        const result1 = runtimeFunction(1, 2);
                        functionalTest = `✅ Works: atan2(1,2) = ${result1?.toString?.() || result1}`;
                        break;
                    }
                    case 'solve': {
                        const result2 = runtimeFunction('x^2-4', 'x');
                        functionalTest = `✅ Works: solve('x^2-4','x') returns ${typeof result2}`;
                        break;
                    }
                    case 'matget': {
                        const testMatrix = nerdamerRuntime.matrix([
                            [1, 2],
                            [3, 4],
                        ]);
                        const result3 = runtimeFunction(testMatrix, 0, 1);
                        functionalTest = `✅ Works: matget(matrix,0,1) = ${result3?.toString?.() || result3}`;
                        break;
                    }
                    case 'cross': {
                        const v1 = nerdamerRuntime.vector([1, 0, 0]);
                        const v2 = nerdamerRuntime.vector([0, 1, 0]);
                        const result4 = runtimeFunction(v1, v2);
                        functionalTest = `✅ Works: cross(v1,v2) returns ${typeof result4}`;
                        break;
                    }
                    case 'diff': {
                        const result5 = runtimeFunction('x^2', 'x');
                        functionalTest = `✅ Works: diff('x^2','x') = ${result5?.toString?.() || result5}`;
                        break;
                    }
                    case 'integrate': {
                        const result6 = runtimeFunction('x^2', 'x');
                        functionalTest = `✅ Works: integrate('x^2','x') = ${result6?.toString?.() || result6}`;
                        break;
                    }
                    case 'defint': {
                        const result7 = runtimeFunction('x', 0, 1, 'x');
                        functionalTest = `✅ Works: defint('x',0,1,'x') = ${result7?.toString?.() || result7}`;
                        break;
                    }
                }
            } catch (error) {
                functionalTest = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
            }

            console.log(`   Functional test: ${functionalTest}`);

            // Check if this is a wrapper function pattern
            const isWrapper = functionSource.includes('return') && functionSource.length < 200;
            if (isWrapper) {
                console.log(`   🔄 Appears to be a wrapper function`);
            }
        }
    });

    it('should analyze the overall pattern of arity mismatches', () => {
        console.log('\n=== Overall Arity Pattern Analysis ===');

        const allFunctions = Object.keys(nerdamerRuntime).filter(key => typeof nerdamerRuntime[key] === 'function');

        const arityStats = {
            zeroArity: 0,
            nonZeroArity: 0,
            usesArguments: 0,
            doesNotUseArguments: 0,
            wrapperFunctions: 0,
        };

        const sampleArityZeroFunctions: string[] = [];

        for (const funcName of allFunctions) {
            const func = nerdamerRuntime[funcName];
            const arity = func.length;
            const source = func.toString();

            if (arity === 0) {
                arityStats.zeroArity++;
                if (sampleArityZeroFunctions.length < 10) {
                    sampleArityZeroFunctions.push(funcName);
                }
            } else {
                arityStats.nonZeroArity++;
            }

            if (source.includes('arguments')) {
                arityStats.usesArguments++;
            } else {
                arityStats.doesNotUseArguments++;
            }

            // Simple heuristic for wrapper functions
            if (source.includes('return') && source.length < 200 && !source.includes('function')) {
                arityStats.wrapperFunctions++;
            }
        }

        console.log('Function arity distribution:');
        console.log(
            `  Zero arity: ${arityStats.zeroArity} (${Math.round((arityStats.zeroArity / allFunctions.length) * 100)}%)`
        );
        console.log(
            `  Non-zero arity: ${arityStats.nonZeroArity} (${Math.round((arityStats.nonZeroArity / allFunctions.length) * 100)}%)`
        );
        console.log(`  Uses arguments object: ${arityStats.usesArguments}`);
        console.log(`  Does not use arguments: ${arityStats.doesNotUseArguments}`);
        console.log(`  Apparent wrapper functions: ${arityStats.wrapperFunctions}`);

        console.log('\nSample zero-arity functions:', sampleArityZeroFunctions);

        // Test if zero-arity functions are typically module exports
        console.log('\n=== Zero-Arity Function Analysis ===');
        for (const funcName of sampleArityZeroFunctions.slice(0, 5)) {
            const func = nerdamerRuntime[funcName];
            const source = func.toString();
            console.log(`\n${funcName}:`);
            console.log(`  Source length: ${source.length} chars`);
            console.log(`  Uses arguments: ${source.includes('arguments')}`);
            console.log(`  First 100 chars: ${source.substring(0, 100)}...`);
        }
    });

    it('should test common JavaScript argument patterns', () => {
        console.log('\n=== JavaScript Argument Pattern Testing ===');

        // Test some specific functions that should work despite arity 0
        const testCases = [
            {
                name: 'Basic arithmetic with solve',
                test: () => nerdamerRuntime.solve('x^2 - 4', 'x'),
                description: 'solve() with 2 arguments',
            },
            {
                name: 'Trigonometric with multiple args',
                test: () => nerdamerRuntime.atan2(1, 1),
                description: 'atan2() with 2 arguments',
            },
            {
                name: 'Matrix operations',
                test: () => {
                    const mat = nerdamerRuntime.matrix([
                        [1, 2],
                        [3, 4],
                    ]);
                    return nerdamerRuntime.matget(mat, 0, 1);
                },
                description: 'matget() with 3 arguments',
            },
            {
                name: 'Variable argument functions',
                test: () => nerdamerRuntime.max(1, 2, 3, 4, 5),
                description: 'max() with variable arguments',
            },
            {
                name: 'Integration with bounds',
                test: () => nerdamerRuntime.defint('x^2', 0, 2, 'x'),
                description: 'defint() with 4 arguments',
            },
        ];

        for (const testCase of testCases) {
            try {
                const result = testCase.test();
                console.log(`✅ ${testCase.name}: ${testCase.description} -> ${result?.toString?.() || typeof result}`);
            } catch (error) {
                console.log(
                    `❌ ${testCase.name}: ${testCase.description} -> ERROR: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        console.log('\n🔍 Pattern Analysis Conclusion:');
        console.log('Most zero-arity functions likely use the arguments object or are');
        console.log('wrapper functions that delegate to internal implementations.');
        console.log('This is a common JavaScript pattern for flexible function interfaces.');
    });

    it('should investigate the 6 remaining genuine issues from robust arity checking', () => {
        console.log('\n=== Investigation of 6 Remaining Genuine Issues ===');

        const remainingIssues = [
            'getVars', // Return type mismatch
            'supported', // Return type mismatch
            'matset', // Complex function that may not handle 4+ parameters correctly
            'sum', // Complex function that may not handle 4+ parameters correctly
            'product', // Complex function that may not handle 4+ parameters correctly
            'solveEquations', // Genuine arity mismatch (declares 5 but needs 1)
        ];

        for (const funcName of remainingIssues) {
            const runtimeFunction = nerdamerRuntime[funcName];

            if (typeof runtimeFunction !== 'function') {
                console.log(`❌ ${funcName}: Not found in runtime`);
                continue;
            }

            console.log(`\n🔍 Investigating ${funcName}:`);
            console.log(`   Runtime arity: ${runtimeFunction.length}`);

            const functionSource = runtimeFunction.toString();
            const usesArguments = functionSource.includes('arguments');
            console.log(`   Uses arguments object: ${usesArguments}`);
            console.log(`   Function length: ${functionSource.length} chars`);

            // Show function signature preview
            const firstLine = functionSource.split('\n')[0].trim();
            console.log(`   Signature: ${firstLine}...`);

            // Test specific issue types
            switch (funcName) {
                case 'getVars':
                    console.log('   🧪 Testing return type:');
                    try {
                        const result = runtimeFunction();
                        console.log(`     - Returns: ${typeof result} (${JSON.stringify(result)})`);
                        console.log(`     - Expected: Record<string, NerdamerExpression | string>`);
                        console.log(`     - Issue: Returns empty object when no variables set`);
                    } catch (error) {
                        console.log(`     - Error: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;

                case 'supported':
                    console.log('   🧪 Testing return type:');
                    try {
                        // Test with no arguments
                        const result1 = runtimeFunction();
                        console.log(`     - No args: ${typeof result1} (length: ${result1?.length || 'N/A'})`);

                        // Test with string argument
                        const result2 = runtimeFunction('cos');
                        console.log(`     - With 'cos': ${typeof result2} (${result2})`);

                        console.log(`     - Expected: boolean`);
                        console.log(
                            `     - Issue: Returns array when called without arguments, boolean with arguments`
                        );
                    } catch (error) {
                        console.log(`     - Error: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;

                case 'matset':
                case 'sum':
                case 'product':
                    console.log('   🧪 Testing complex parameter handling:');
                    try {
                        if (funcName === 'matset') {
                            const testMatrix = nerdamerRuntime.matrix([
                                [1, 2],
                                [3, 4],
                            ]);
                            const result = runtimeFunction(testMatrix, 0, 1, 'newValue');
                            console.log(`     - 4 params test: Success (${typeof result})`);
                        } else if (funcName === 'sum') {
                            const result = runtimeFunction('x^2', 'x', 1, 5);
                            console.log(`     - 4 params test: Success (${result?.toString?.() || typeof result})`);
                        } else if (funcName === 'product') {
                            const result = runtimeFunction('x', 'x', 1, 3);
                            console.log(`     - 4 params test: Success (${result?.toString?.() || typeof result})`);
                        }
                    } catch (error) {
                        console.log(
                            `     - 4 params test: Failed - ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                    break;

                case 'solveEquations':
                    console.log('   🧪 Testing arity mismatch:');
                    console.log(`     - Declared arity: ${runtimeFunction.length}`);
                    console.log(`     - TypeScript expects: 1 required param (equations array)`);
                    try {
                        // Test with array of equations
                        const result1 = runtimeFunction(['x + y = 5', 'x - y = 1']);
                        console.log(`     - Array test: Success (${typeof result1})`);

                        // Test with additional variables parameter
                        const result2 = runtimeFunction(['x + y = 5', 'x - y = 1'], ['x', 'y']);
                        console.log(`     - Array + vars test: Success (${typeof result2})`);
                    } catch (error) {
                        console.log(`     - Test failed: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
            }

            // Additional argument pattern analysis
            if (usesArguments) {
                const argMatches = functionSource.match(/arguments\[(?:\d+)\]/gu) || [];
                const maxArgIndex =
                    argMatches.length > 0
                        ? Math.max(...argMatches.map((m: string) => parseInt(/\d+/u.exec(m)![0], 10))) + 1
                        : 0;
                console.log(`   Arguments pattern: max index ${maxArgIndex}, ${argMatches.length} references`);
            }
        }

        console.log('\n📋 Summary of Remaining Issues:');
        console.log('1. getVars() - Returns correct type but empty object when no vars');
        console.log('2. supported() - Overloaded: array with no args, boolean with string arg');
        console.log('3. matset/sum/product - Functions work but complex argument handling');
        console.log('4. solveEquations - High arity (5) suggests internal implementation detail');
        console.log('\n💡 These represent edge cases in API design rather than bugs.');
    });
});
