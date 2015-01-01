var Checker = require('../lib/checker');
var assert = require('assert');

describe('modules/string-checker', function() {
    var checker;
    beforeEach(function() {
        checker = new Checker();
        checker.registerDefaultRules();
    });

    describe('line starting with hash, temporary, until we will have inline rules', function() {
        it('should ignore lines starting with #!', function() {
            assert(checker.checkString(
                '#! random stuff\n' +
                '#! 1234\n' +
                'var a = 5;\n'
            ).isEmpty());
        });

        it('should ignore ios instruments style import', function() {
            assert(checker.checkString(
                '#import "abc.js"\n' +
                '#import abc.js\n' +
                'var a = 5;\n'
            ).isEmpty());
        });

        it('should not replace when not beginning of line', function() {
            checker.configure({ disallowMultipleLineStrings: true });
            assert(checker.checkString(
                '#import "abc.js"\n' +
                'var b="#import \\\n abc.js";\n' +
                'var a = 5;\n'
            ).getErrorCount() === 1);
        });
    });

    it('should report parse issues as errors', function() {
        var errors = checker.checkString('this is not javascript');
        assert(errors.getErrorCount() === 1);

        var error = errors.getErrorList()[0];
        assert(error.rule === 'parseError');
        assert(error.message === 'Unexpected identifier');
        assert(error.line === 1);
        assert(error.column === 6);
    });

    it('should not process the rule if it is equals to null (#203)', function() {
        try {
            checker.configure({
                preset: 'jquery',
                requireCurlyBraces: null
            });
            assert(true);
        } catch (_) {
            assert(false);
        }
    });

    it('should throw if preset does not exist', function() {
        try {
            checker.configure({
                preset: 'not-exist'
            });

            assert(false);
        } catch (e) {
            assert.equal(e.toString(), 'AssertionError: Preset "not-exist" does not exist');
        }
    });

    describe('rules registration', function() {
        it('should report rules in config which don\'t match any registered rules', function() {
            checker.configure({ doesNotExist: true, noSuchRule: true });
            var errors = checker.checkString('var foo = 1;').getErrorList();

            assert(errors.length === 2);
            assert.equal(errors[0].message, 'Unsupported rule: doesNotExist');
            assert.equal(errors[1].message, 'Unsupported rule: noSuchRule');
        });

        it('should not report rules in config which match registered rules', function() {
            var error;
            try {
                checker.configure({ disallowMultipleLineBreaks: true, disallowMultipleVarDecl: true });
            } catch (e) {
                error = e;
            }
            assert(error === undefined);
        });

        it('should not report "excludeFiles" rule as unregistered', function() {
            var error;
            try {
                checker.configure({ excludeFiles: [] });
            } catch (e) {
                error = e;
            }
            assert(error === undefined);
        });
    });

    describe('formatString', function() {
        it('requireCurlyBraces', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireCurlyBraces: ['while', 'do']
            });
            var str = 'while(i<l) \ni++;\n' +
                'do\ni++;\nwhile (i<l);' +
                'try {\n i++;}\ncatch(e)\n{ e=e;}';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty());
        });
        it('requireSpaceAfterKeywords', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceAfterKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'return', 'try', 'catch']
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){\n i++;\n}else{\n i--;\n}')
            ).isEmpty());
        });
        it('requireSpacesInFunctionExpression', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInFunctionExpression: {beforeOpeningCurlyBrace: true}
            });
            assert(checker.checkString(
                checker.formatString('function test(){}')
            ).isEmpty());
        });
        it('requirePaddingNewlinesInBlocks', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requirePaddingNewlinesInBlocks: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){i++;};if(i<l){//Test\ni++;}')
            ).isEmpty());
        });
        it('requireSpacesInsideObjectBrackets', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInsideObjectBrackets: 'all'
            });
            assert(checker.checkString(
                checker.formatString('var a={a:1,b:2};')
            ).isEmpty());
        });
        it('requireSpacesInsideArrayBrackets', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInsideArrayBrackets: 'allButNested'
            });
            assert(checker.checkString(
                checker.formatString('var a=[1,2,3];')
            ).isEmpty());
        });
        it('requireSpaceBeforeBlockStatements', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceBeforeBlockStatements: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){i++;}')
            ).isEmpty());
        });
        it('requireLineFeedAtFileEnd', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireLineFeedAtFileEnd: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){i++;}')
            ).isEmpty());
        });
        it('validateLineBreaks', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                validateLineBreaks: 'LF'
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){\ri++;\r}\r')
            ).isEmpty());
        });
        it('validateIndentation', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                validateIndentation: '\t'
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){\ni++;\nif(i<l){\ni++;\n}\n }\n')
            ).isEmpty());
        });
        it('requireSpaceAfterPrefixUnaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceAfterPrefixUnaryOperators: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){++i;if(i<l){+i;}}')
            ).isEmpty());
        });

        it('requireSpaceBeforePostfixUnaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceBeforePostfixUnaryOperators: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){i++;if(i<l){i--;}}')
            ).isEmpty());
        });

        it('requireSpaceBeforeBinaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceBeforeBinaryOperators: true
            });
            assert(checker.checkString(
                checker.formatString('if(i<l){l=l+i;if(i<l){l+=i;}}')
            ).isEmpty());
        });

        it('requireSpaceAfterBinaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpaceAfterBinaryOperators: true
            });
            var str = 'if(i<l){l=l+i;if(i<l){l+=i;}}';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty(), checker.formatString(str));
        });

        it('disallowSpaceBeforeBinaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                disallowSpaceBeforeBinaryOperators: [',']
            });
            assert(checker.checkString(
                checker.formatString('var a=[1 ,2  ,3]; ')
            ).isEmpty());
        });

        it('requireSpacesInsideParentheses', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInsideParentheses: 'all'
            });
            var str = 'for(var j=0;j<100;j++){fail();}\nif(i<l){l=l+i;}\n';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty());
        });

        it('requireSpacesInForStatement', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInForStatement: true
            });
            var str = 'for(var j=0;j<100;j++){fail();}';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty(), checker.formatString(str));
        });

        it('requireSpacesInComputedMemberExpression', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInComputedMemberExpression: true
            });
            var str = 'hearts[i] = hearts[test];';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty(), checker.formatString(str));
        });

        it('disallowSpaceBeforeBinaryOperators', function() {
            var checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({
                requireSpacesInConditionalExpression: {
                    afterTest: true,
                    beforeConsequent: true,
                    afterConsequent: true,
                    beforeAlternate: true
                }
            });
            var str = 'var a=a?b:c';
            assert(!checker.checkString(str).isEmpty());
            assert(checker.checkString(checker.formatString(str)).isEmpty(), checker.formatString(str));
        });

    });

    describe('maxErrors', function() {
        beforeEach(function() {
            checker.configure({
                requireSpaceBeforeBinaryOperators: ['='],
                maxErrors: 1
            });
        });

        it('should allow a maximum number of reported errors to be set', function() {
            var errors = checker.checkString('var foo=1;\n var bar=2;').getErrorList();
            assert(errors.length === 1);
        });

        it('should not report more than the maximum errors across multiple checks', function() {
            var errors = checker.checkString('var foo=1;\n var bar=2;').getErrorList();
            var errors2 = checker.checkString('var baz=1;\n var qux=2;').getErrorList();
            assert(errors.length === 1);
            assert(errors2.length === 0);
        });

        it('should not be used when not a number', function() {
            var errors;
            checker.configure({
                requireSpaceBeforeBinaryOperators: ['='],
                maxErrors: NaN
            });

            errors = checker.checkString('var foo=1;\n var bar=2;').getErrorList();
            assert(errors.length > 0);
        });
    });

    describe('esprima version', function() {
        var customDescription = 'in no way a real error message';
        var customEsprima = {
            parse: function() {
                var error = new Error();
                error.description = customDescription;
                error.lineNumber = 1;
                error.column = 0;

                throw error;
            }
        };

        it('uses a custom esprima when provided to the constructor', function() {
            checker = new Checker({ esprima: customEsprima });
            checker.registerDefaultRules();

            var errors = checker.checkString('import { foo } from "bar";');
            var error = errors.getErrorList()[0];

            assert(error.rule === 'parseError');
            assert(error.message === customDescription);
        });

        it('uses a custom esprima when both esprima and esnext are provided to the constructor', function() {
            checker = new Checker({ esprima: customEsprima, esnext: true });
            checker.registerDefaultRules();

            var errors = checker.checkString('import { foo } from "bar";');
            var error = errors.getErrorList()[0];

            assert(error.rule === 'parseError');
            assert(error.message === customDescription);
        });

        it('uses the harmony esprima when true is provided to the constructor', function() {
            checker = new Checker({ esnext: true });
            checker.registerDefaultRules();

            var errors = checker.checkString('import { foo } from "bar";');
            assert(errors.isEmpty());
        });

        it('uses the harmony esprima when esnext is set to true in the config', function() {
            checker = new Checker();
            checker.registerDefaultRules();
            checker.configure({ esnext: true });

            var errors = checker.checkString('import { foo } from "bar";');
            // Make sure that multiple checks don't fail
            var errors2 = checker.checkString('import { bar } from "foo";');
            assert(errors.isEmpty());
            assert(errors2.isEmpty());
        });

        it('uses the default esprima when falsely or no argument is provided to the constructor', function() {
            checker = new Checker();
            checker.registerDefaultRules();

            var errors = checker.checkString('import { foo } from "bar";');
            var error = errors.getErrorList()[0];

            assert(error.rule === 'parseError');
            assert(error.message !== customDescription);
        });
    });

    describe('error filter', function() {
        beforeEach(function() {
            checker = new Checker();
            checker.registerDefaultRules();
        });

        it('should accept a path to a filter function to filter out errors', function() {
            checker.configure({
                disallowQuotedKeysInObjects: true,
                errorFilter: __dirname + '/data/error-filter.js'
            });

            var errors = checker.checkString('var x = { "a": 1 }');

            assert.ok(errors.isEmpty());
        });

        it('should not accept a filter function directly in the configuration', function() {
            assert.throws(function() {
                checker.configure({
                    disallowQuotedKeysInObjects: true,
                    errorFilter: function() { return false; }
                });
            });
        });
    });

    describe('presets', function() {
        testPreset('airbnb');
        testPreset('crockford');
        testPreset('google');
        testPreset('grunt');
        testPreset('jquery');
        testPreset('mdcs');
        testPreset('wikimedia');
        testPreset('yandex');

        /**
         * Helper to test a given preset's configuration against its test file
         *
         * Expects the given preset to have a configuration in /presets
         * and real code taken from that project in /test/data/options/preset
         *
         * @example testPreset('google')
         * @param  {String} presetName
         */
        function testPreset(presetName) {
            it('preset ' + presetName + ' should not report any errors from the sample file', function() {
                var checker = new Checker();

                checker.registerDefaultRules();
                checker.configure({
                    preset: presetName
                });

                return checker.checkFile('./test/data/options/preset/' + presetName + '.js').then(function(errors) {
                    assert(errors.isEmpty());
                });
            });
        }
    });
});
