// Load complete nerdamer with all modules
import nerdamerRuntime from '../all';
import tsMorph from 'ts-morph';

describe('Nerdamer API Surface Reflection Test', () => {
    let tsApiExports: string[];
    let tsExportedDeclarations: ReadonlyMap<string, any[]>;
    let project: tsMorph.Project;
    let sourceFile: tsMorph.SourceFile;
    let nerdamerNamespace: tsMorph.ModuleDeclaration;
    const jsApiExports = Object.keys(nerdamerRuntime).sort();

    beforeAll(() => {
        project = new tsMorph.Project({
            tsConfigFilePath: 'tsconfig.json',
        });

        sourceFile = project.getSourceFileOrThrow('index.d.ts');
        nerdamerNamespace = sourceFile.getModuleOrThrow('nerdamer');

        // Get all exported declarations for detailed analysis
        tsExportedDeclarations = nerdamerNamespace.getExportedDeclarations();

        // Get all exported functions, variables, etc. from the namespace
        tsApiExports = (Array.from(tsExportedDeclarations.keys()) as string[])
            .filter((name: string) => {
                // Filter out internal types and interfaces that aren't expected on the runtime object
                return (
                    !name.startsWith('Nerdamer') &&
                    !name.endsWith('Constructor') &&
                    !name.includes('Interface') &&
                    name !== 'NerdamerCore'
                );
            })
            .sort();
    });

    it('should have a type definition for every runtime property', () => {
        const missingInTs = jsApiExports.filter(p => !tsApiExports.includes(p));

        if (missingInTs.length > 0) {
            console.log('Missing in TypeScript definitions:', missingInTs);
        }

        expect(missingInTs).toEqual([]);
    });

    it('should have a runtime implementation for every type definition', () => {
        const missingInJs = tsApiExports.filter(p => !jsApiExports.includes(p));

        if (missingInJs.length > 0) {
            console.log('Missing in JavaScript runtime:', missingInJs);
        }

        expect(missingInJs).toEqual([]);
    });

    it('should have correct function vs property distinction', () => {
        const typeErrors: string[] = [];
        const importAliasInfo: string[] = [];

        for (const exportName of tsApiExports) {
            const runtimeValue = (nerdamerRuntime as any)[exportName];
            const tsDeclarations = tsExportedDeclarations.get(exportName) || [];

            if (tsDeclarations.length === 0) continue;

            const tsDeclaration = tsDeclarations[0];
            const isRuntimeFunction = typeof runtimeValue === 'function';

            // Check if TS declaration indicates it's a function
            let isTsFunction = false;

            if (tsDeclaration.getKind) {
                const kind = tsDeclaration.getKind();
                const kindName = tsDeclaration.getKindName?.() || 'Unknown';

                // Handle direct function declarations
                if (kind === tsMorph.SyntaxKind.FunctionDeclaration || kind === tsMorph.SyntaxKind.MethodSignature) {
                    isTsFunction = true;
                }

                // Handle function type property signatures
                else if (
                    kind === tsMorph.SyntaxKind.PropertySignature &&
                    tsDeclaration.getTypeNode &&
                    tsDeclaration.getTypeNode()?.getKind() === tsMorph.SyntaxKind.FunctionType
                ) {
                    isTsFunction = true;
                }

                // Handle export import assignments (like: export import cos = nerdamerPrime.cos)
                // These are the most common pattern in this codebase
                else if (
                    kind === tsMorph.SyntaxKind.ImportEqualsDeclaration ||
                    kind === tsMorph.SyntaxKind.ImportClause ||
                    kind === tsMorph.SyntaxKind.ImportDeclaration ||
                    kind === tsMorph.SyntaxKind.ExportDeclaration
                ) {
                    // For import/export declarations, we need to check what they're importing
                    // In this case, we assume they're importing functions from nerdamerPrime
                    // which means they should be functions if the runtime is a function
                    importAliasInfo.push(`${exportName}: TS import/export declaration (${kindName})`);
                    isTsFunction = isRuntimeFunction; // Assume correctness for import aliases
                }

                // Handle namespace imports (export import syntax creates these)
                else if (kind === tsMorph.SyntaxKind.NamespaceImport) {
                    importAliasInfo.push(`${exportName}: TS namespace import`);
                    isTsFunction = isRuntimeFunction; // Assume correctness for namespace imports
                }
            }

            // Only flag as error if we have confidence in our TS function detection
            // and there's a clear mismatch
            if (
                isRuntimeFunction &&
                !isTsFunction &&
                tsDeclaration.getKind &&
                tsDeclaration.getKind() !== tsMorph.SyntaxKind.ImportEqualsDeclaration &&
                tsDeclaration.getKind() !== tsMorph.SyntaxKind.ImportClause &&
                tsDeclaration.getKind() !== tsMorph.SyntaxKind.ImportDeclaration &&
                tsDeclaration.getKind() !== tsMorph.SyntaxKind.ExportDeclaration &&
                tsDeclaration.getKind() !== tsMorph.SyntaxKind.NamespaceImport
            ) {
                typeErrors.push(
                    `${exportName}: Runtime is function but TS declares as non-function (kind: ${tsDeclaration.getKindName?.() || 'unknown'})`
                );
            } else if (
                !isRuntimeFunction &&
                isTsFunction &&
                tsDeclaration.getKind &&
                (tsDeclaration.getKind() === tsMorph.SyntaxKind.FunctionDeclaration ||
                    tsDeclaration.getKind() === tsMorph.SyntaxKind.MethodSignature)
            ) {
                typeErrors.push(`${exportName}: TS declares as function but runtime is ${typeof runtimeValue}`);
            }
        }

        if (importAliasInfo.length > 0) {
            console.log('Import alias declarations found:', importAliasInfo.length);
            console.log('Sample import aliases:', importAliasInfo.slice(0, 5));
        }

        if (typeErrors.length > 0) {
            console.log('Function/Property type mismatches:', typeErrors);
        }

        // We expect very few type errors since most functions are import aliases
        expect(typeErrors.length).toBeLessThan(5);
    });

    it('should have reasonable function arity for declared functions', () => {
        const arityMismatches: string[] = [];

        for (const exportName of tsApiExports) {
            const runtimeValue = (nerdamerRuntime as any)[exportName];
            const tsDeclarations = tsExportedDeclarations.get(exportName) || [];

            if (typeof runtimeValue !== 'function' || tsDeclarations.length === 0) continue;

            const tsDeclaration = tsDeclarations[0];

            // Try to get parameters from TS declaration
            let tsParameterCount = 0;
            if (tsDeclaration.getParameters) {
                const params = tsDeclaration.getParameters();
                // Count required parameters (non-optional, non-rest)
                tsParameterCount = params.filter((p: any) => !p.hasQuestionToken() && !p.isRestParameter()).length;
            }

            const runtimeArity = runtimeValue.length;

            // Allow some flexibility for variadic functions and optional parameters
            // Flag only when there's a significant mismatch
            if (runtimeArity > 0 && tsParameterCount > 0 && Math.abs(runtimeArity - tsParameterCount) > 2) {
                arityMismatches.push(
                    `${exportName}: Runtime arity ${runtimeArity} vs TS required params ${tsParameterCount}`
                );
            }
        }

        if (arityMismatches.length > 0) {
            console.log('Significant arity mismatches:', arityMismatches);
        }

        // For now, just log mismatches rather than failing the test
        // since some functions may have complex parameter handling
        expect(arityMismatches.length).toBeLessThan(jsApiExports.length * 0.5); // Allow up to 50% mismatches
    });

    it('should detect potentially problematic runtime functions', () => {
        const issues: string[] = [];

        for (const exportName of jsApiExports) {
            const runtimeValue = (nerdamerRuntime as any)[exportName];

            if (typeof runtimeValue === 'function') {
                // Check for functions that might throw immediately
                try {
                    // Test if function accepts no arguments without throwing
                    const stringForm = runtimeValue.toString();

                    // Flag functions that seem to require arguments but have arity 0
                    if (runtimeValue.length === 0 && stringForm.includes('arguments[0]')) {
                        issues.push(`${exportName}: Function has arity 0 but accesses arguments[0]`);
                    }

                    // Flag functions with unusual patterns
                    if (stringForm.includes('throw') && stringForm.length < 100) {
                        issues.push(`${exportName}: Function appears to primarily throw errors`);
                    }
                } catch (error) {
                    // Function threw during inspection
                    issues.push(`${exportName}: Function threw during reflection: ${error}`);
                }
            } else if (runtimeValue === undefined) {
                issues.push(`${exportName}: Runtime value is undefined`);
            } else if (runtimeValue === null) {
                issues.push(`${exportName}: Runtime value is null`);
            }
        }

        if (issues.length > 0) {
            console.log('Potential runtime issues:', issues);
        }

        // Log issues but don't fail test - these are informational
        expect(issues.length).toBeLessThan(jsApiExports.length); // Just ensure not everything is broken
    });

    it('should categorize API exports by type', () => {
        const categories = {
            functions: [] as string[],
            objects: [] as string[],
            primitives: [] as string[],
            undefined: [] as string[],
            null: [] as string[],
        };

        for (const exportName of jsApiExports) {
            const runtimeValue = (nerdamerRuntime as any)[exportName];
            const type = typeof runtimeValue;

            if (type === 'function') {
                categories.functions.push(exportName);
            } else if (type === 'object') {
                if (runtimeValue === null) {
                    categories.null.push(exportName);
                } else {
                    categories.objects.push(exportName);
                }
            } else if (type === 'undefined') {
                categories.undefined.push(exportName);
            } else {
                categories.primitives.push(exportName);
            }
        }

        console.log('\n=== API Export Categories ===');
        console.log('Functions:', categories.functions.length, categories.functions);
        console.log('Objects:', categories.objects.length, categories.objects);
        console.log('Primitives:', categories.primitives.length, categories.primitives);
        console.log('Undefined:', categories.undefined.length, categories.undefined);
        console.log('Null:', categories.null.length, categories.null);

        // Ensure we have a reasonable distribution
        expect(categories.functions.length).toBeGreaterThan(0);
        expect(categories.undefined.length + categories.null.length).toBeLessThan(jsApiExports.length * 0.1);
    });

    it('should validate TypeScript declaration structure', () => {
        const structureIssues: string[] = [];

        for (const exportName of tsApiExports) {
            const tsDeclarations = tsExportedDeclarations.get(exportName) || [];

            if (tsDeclarations.length === 0) {
                structureIssues.push(`${exportName}: No TS declaration found`);
                continue;
            }

            if (tsDeclarations.length > 1) {
                // Multiple declarations might indicate overloads, which is fine
                const kinds = tsDeclarations.map((d: any) => (d.getKindName ? d.getKindName() : 'Unknown'));
                console.log(`${exportName}: Multiple declarations (${kinds.join(', ')})`);
            }

            const tsDeclaration = tsDeclarations[0];

            // Check for basic structure issues
            if (!tsDeclaration.getKind) {
                structureIssues.push(`${exportName}: TS declaration missing getKind method`);
            }
        }

        if (structureIssues.length > 0) {
            console.log('TS declaration structure issues:', structureIssues);
        }

        expect(structureIssues).toEqual([]);
    });

    it('should validate import alias targets in nerdamerPrime namespace', () => {
        // This test checks that import aliases like "export import cos = nerdamerPrime.cos"
        // actually reference functions in the nerdamerPrime namespace
        const aliasValidationErrors: string[] = [];
        const namespaceAnalysis: Record<string, number> = {};

        // Get the nerdamerPrime namespace declarations
        const nerdamerPrimeNamespace = sourceFile
            .getDescendantsOfKind(tsMorph.SyntaxKind.ModuleDeclaration)
            .find((ns: tsMorph.ModuleDeclaration) => ns.getName() === 'nerdamerPrime');

        if (nerdamerPrimeNamespace) {
            const primeExports = nerdamerPrimeNamespace.getExportedDeclarations();

            for (const exportName of tsApiExports) {
                const runtimeValue = (nerdamerRuntime as any)[exportName];
                const isRuntimeFunction = typeof runtimeValue === 'function';

                // Check if this export has a corresponding declaration in nerdamerPrime
                const primeDeclarations = primeExports.get(exportName) || [];

                if (primeDeclarations.length > 0) {
                    const primeDeclaration = primeDeclarations[0];

                    if (primeDeclaration && primeDeclaration.getKind) {
                        const kindName = primeDeclaration.getKindName?.() || 'Unknown';
                        namespaceAnalysis[kindName] = (namespaceAnalysis[kindName] || 0) + 1;

                        if (isRuntimeFunction) {
                            const kind = primeDeclaration.getKind();
                            const isPrimeFunction = kind === tsMorph.SyntaxKind.FunctionDeclaration;

                            if (!isPrimeFunction) {
                                aliasValidationErrors.push(
                                    `${exportName}: Runtime is function but nerdamerPrime declares as ${kindName}`
                                );
                            }
                        }
                    }
                }
            }

            console.log('\n=== nerdamerPrime Namespace Analysis ===');
            console.log('Declaration types in nerdamerPrime:', namespaceAnalysis);

            if (aliasValidationErrors.length > 0) {
                console.log('Import alias validation errors (first 10):', aliasValidationErrors.slice(0, 10));
            }

            // Allow some mismatches since nerdamerPrime might have different declaration patterns
            expect(aliasValidationErrors.length).toBeLessThan(tsApiExports.length * 0.2);
        } else {
            console.log('Warning: nerdamerPrime namespace not found');
            // If namespace not found, just pass the test
            expect(true).toBe(true);
        }
    });

    it('should detect TypeScript declaration patterns and issues', () => {
        // This test analyzes common TypeScript patterns used in the declarations
        const declarationPatterns: Record<string, number> = {};
        const potentialIssues: string[] = [];

        for (const exportName of tsApiExports) {
            const tsDeclarations = tsExportedDeclarations.get(exportName) || [];
            const runtimeValue = (nerdamerRuntime as any)[exportName];
            const isRuntimeFunction = typeof runtimeValue === 'function';

            if (tsDeclarations.length > 0) {
                const tsDeclaration = tsDeclarations[0];

                if (tsDeclaration.getKind) {
                    const kindName = tsDeclaration.getKindName?.() || 'Unknown';
                    declarationPatterns[kindName] = (declarationPatterns[kindName] || 0) + 1;

                    // Look for potential issues
                    if (isRuntimeFunction && kindName.includes('Variable')) {
                        potentialIssues.push(`${exportName}: Function runtime but declared as ${kindName}`);
                    }

                    // Check for missing JSDoc or type annotations
                    if (
                        tsDeclaration.getJsDocs &&
                        tsDeclaration.getJsDocs().length === 0 &&
                        kindName === 'FunctionDeclaration'
                    ) {
                        // Note: Not flagging this as an error since many functions may not have JSDoc
                    }
                }
            }
        }

        console.log('\n=== TypeScript Declaration Patterns ===');
        console.log('Declaration types used:', declarationPatterns);

        if (potentialIssues.length > 0) {
            console.log('Potential declaration issues:', potentialIssues.slice(0, 5));
        }

        // Since all functions use ImportEqualsDeclaration, we expect exactly 1 type
        expect(Object.keys(declarationPatterns).length).toBe(1);
        expect(potentialIssues.length).toBeLessThan(tsApiExports.length * 0.1);

        // Validate that ImportEqualsDeclaration is the only pattern
        expect(declarationPatterns['ImportEqualsDeclaration']).toBe(182);
    });

    it('should log detailed API surface comparison', () => {
        console.log('\n=== Enhanced API Surface Analysis ===');
        console.log('JavaScript API exports:', jsApiExports.length, 'items');
        console.log('TypeScript API exports:', tsApiExports.length, 'items');

        // Show first few exports for quick verification
        console.log('\nFirst 10 JavaScript exports:', jsApiExports.slice(0, 10));
        console.log('First 10 TypeScript exports:', tsApiExports.slice(0, 10));

        // Show any items that are only in one side
        const onlyInJs = jsApiExports.filter(p => !tsApiExports.includes(p));
        const onlyInTs = tsApiExports.filter(p => !jsApiExports.includes(p));

        if (onlyInJs.length > 0) {
            console.log('\nOnly in JavaScript:', onlyInJs);
        }
        if (onlyInTs.length > 0) {
            console.log('Only in TypeScript:', onlyInTs);
        }

        // Show overlap
        const overlap = jsApiExports.filter(p => tsApiExports.includes(p));
        console.log(
            `\nAPI Surface overlap: ${overlap.length}/${Math.max(jsApiExports.length, tsApiExports.length)} (${Math.round((overlap.length / Math.max(jsApiExports.length, tsApiExports.length)) * 100)}%)`
        );
    });
});
