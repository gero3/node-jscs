var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {
    configure: function(requireSpacesInComputedMemberExpression) {
        assert(
            requireSpacesInComputedMemberExpression === true,
            'requireSpacesInComputedMemberExpression option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireSpacesInComputedMemberExpression';
    },

    check: function(file, errors) {
        file.iterateNodesByType('MemberExpression', function(node) {
            if (node.computed) {
                var testToken = file.getTokenByRangeStart(node.property.range[0]);
                var prevToken = file.getPrevToken(testToken);
                if (prevToken.value === '[' && prevToken.range[1] === testToken.range[0]) {
                    errors.add(
                        'Missing space after opening square bracket',
                        testToken.loc.start
                    );
                }
                testToken = file.getTokenByRangeEnd(node.property.range[1]);
                var nextToken = file.getNextToken(testToken);
                if (nextToken.value === ']' && nextToken.range[0] === testToken.range[1]) {
                    errors.add(
                        'Missing space before opening square bracket',
                        testToken.loc.end
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
