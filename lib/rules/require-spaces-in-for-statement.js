var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(requireSpacesInForStatement) {
        assert(
            requireSpacesInForStatement === true,
            'requireSpacesInForStatement option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireSpacesInForStatement';
    },

    check: function(file, errors) {
        file.iterateNodesByType('ForStatement', function(node) {
            if (node.test) {
                var testToken = file.getTokenByRangeStart(node.test.range[0]);
                var prevToken1 = file.getPrevToken(testToken);
                if (prevToken1.value === ';' && prevToken1.range[1] === testToken.range[0]) {
                    errors.add(
                        'Missing space after semicolon',
                        testToken.loc.start
                    );
                }
            }
            if (node.update) {
                var updateToken = file.getTokenByRangeStart(node.update.range[0]);
                var prevToken2 = file.getPrevToken(updateToken);
                if (prevToken2.value === ';' && prevToken2.range[1] === updateToken.range[0]) {
                    errors.add(
                        'Missing space after semicolon',
                        updateToken.loc.start
                    );
                }
            }
        });
    },
    format: function(file, error) {
        var pos = file.getPosByLineAndColumn(error.line, error.column);
        file.splice(pos, 0, ' ');
    }
};
