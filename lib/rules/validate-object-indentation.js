var assert = require('assert');

module.exports = function() {};

module.exports.prototype = {

    configure: function(validateObjectIndentation) {
        assert(
            validateObjectIndentation === '\t' ||
                (typeof validateObjectIndentation === 'number' && validateObjectIndentation > 0),
            'validateObjectIndentation option requires a positive number of spaces or "\\t"'
        );

        if (typeof validateObjectIndentation === 'number') {
            this._indentChar = ' ';
            this._indentSize = validateObjectIndentation;
        } else {
            this._indentChar = '\t';
            this._indentSize = 1;
        }

    },

    getOptionName: function() {
        return 'validateObjectIndentation';
    },

    check: function(file, errors) {

        var lines = file.getLines(file, errors);
        var indentChar = this._indentChar;
        var indentSize = this._indentSize;
        function isMultiline(node) {
            return node.loc.start.line !== node.loc.end.line;
        }

        function getIndentationFromLine(i) {
            var rNotIndentChar = new RegExp('[^' + indentChar + ']');
            var firstContent = 0;
            if (lines[i - 1]) {
                firstContent = Math.max(lines[i - 1].search(rNotIndentChar), 0);
            }
            return firstContent;
        }

        file.iterateNodesByType('ObjectExpression', function(node) {
            var linesInspected = [node.loc.start.line];
            var expectedIndentation = getIndentationFromLine(node.loc.start.line) + indentSize;
            if (isMultiline(node) && node.properties.length > 0) {
                node.properties.forEach(function(property) {
                    var startLine = property.loc.start.line;
                    if (linesInspected.indexOf(startLine) === -1 &&
                    getIndentationFromLine(startLine) !== expectedIndentation) {
                        errors.add(
                            'Expected indentation of ' + expectedIndentation + ' characters',
                            startLine,
                            expectedIndentation
                        );
                    }
                    linesInspected.push(startLine);
                });
            }
        });
    },

    format: function(file, error) {
        var pos = file.getPosByLineAndColumn(error.line, 0);
        var amount = error.column;
        var str = '';
        for (var i = 0;i < amount;i++) {
            for (var j = 0;j < this._indentSize;j++) {
                str += this._indentChar;
            }
        }
        var toRemove = 0;
        var source = file.getSource();
        while (source[pos + toRemove] === '\t' || source[pos + toRemove] === ' ') { toRemove++; }
        var propertyPos = pos;
        var property = file.getNodeByRange(propertyPos);
        while ((!property || property.type !== 'Property') && propertyPos < source.length) {
            propertyPos++;
            property = file.getNodeByRange(propertyPos);
        }
        property = property;

        var startLine = property.loc.start.line;
        var endLine = property.loc.end.line;
        for (var line = startLine; line <= endLine; line++) {
            pos = file.getPosByLineAndColumn(line, 0);
            file.splice(pos, toRemove, str);
        }

    }

};
