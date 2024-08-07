require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
/* eslint indent: 4 */


// Private helper class
class SubRange {
    constructor(low, high) {
        this.low = low;
        this.high = high;
        this.length = 1 + high - low;
    }

    overlaps(range) {
        return !(this.high < range.low || this.low > range.high);
    }

    touches(range) {
        return !(this.high + 1 < range.low || this.low - 1 > range.high);
    }

    // Returns inclusive combination of SubRanges as a SubRange.
    add(range) {
        return new SubRange(
            Math.min(this.low, range.low),
            Math.max(this.high, range.high)
        );
    }

    // Returns subtraction of SubRanges as an array of SubRanges.
    // (There's a case where subtraction divides it in 2)
    subtract(range) {
        if (range.low <= this.low && range.high >= this.high) {
            return [];
        } else if (range.low > this.low && range.high < this.high) {
            return [
                new SubRange(this.low, range.low - 1),
                new SubRange(range.high + 1, this.high)
            ];
        } else if (range.low <= this.low) {
            return [new SubRange(range.high + 1, this.high)];
        } else {
            return [new SubRange(this.low, range.low - 1)];
        }
    }

    toString() {
        return this.low == this.high ?
            this.low.toString() : this.low + '-' + this.high;
    }
}


class DRange {
    constructor(a, b) {
        this.ranges = [];
        this.length = 0;
        if (a != null) this.add(a, b);
    }

    _update_length() {
        this.length = this.ranges.reduce((previous, range) => {
            return previous + range.length;
        }, 0);
    }

    add(a, b) {
        var _add = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.touches(this.ranges[i])) {
                i++;
            }
            var newRanges = this.ranges.slice(0, i);
            while (i < this.ranges.length && subrange.touches(this.ranges[i])) {
                subrange = subrange.add(this.ranges[i]);
                i++;
            }
            newRanges.push(subrange);
            this.ranges = newRanges.concat(this.ranges.slice(i));
            this._update_length();
        }

        if (a instanceof DRange) {
            a.ranges.forEach(_add);
        } else {
            if (b == null) b = a;
            _add(new SubRange(a, b));
        }
        return this;
    }

    subtract(a, b) {
        var _subtract = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
                i++;
            }
            var newRanges = this.ranges.slice(0, i);
            while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
                newRanges = newRanges.concat(this.ranges[i].subtract(subrange));
                i++;
            }
            this.ranges = newRanges.concat(this.ranges.slice(i));
            this._update_length();
        };

        if (a instanceof DRange) {
            a.ranges.forEach(_subtract);
        } else {
            if (b == null) b = a;
            _subtract(new SubRange(a, b));
        }
        return this;
    }

    intersect(a, b) {
        var newRanges = [];
        var _intersect = (subrange) => {
            var i = 0;
            while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
                i++;
            }
            while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
                var low = Math.max(this.ranges[i].low, subrange.low);
                var high = Math.min(this.ranges[i].high, subrange.high);
                newRanges.push(new SubRange(low, high));
                i++;
            }
        };

        if (a instanceof DRange) {
            a.ranges.forEach(_intersect);
        } else {
            if (b == null) b = a;
            _intersect(new SubRange(a, b));
        }
        this.ranges = newRanges;
        this._update_length();
        return this;
    }

    index(index) {
        var i = 0;
        while (i < this.ranges.length && this.ranges[i].length <= index) {
            index -= this.ranges[i].length;
            i++;
        }
        return this.ranges[i].low + index;
    }

    toString() {
        return '[ ' + this.ranges.join(', ') + ' ]';
    }

    clone() {
        return new DRange(this);
    }

    numbers() {
        return this.ranges.reduce((result, subrange) => {
            var i = subrange.low;
            while (i <= subrange.high) {
                result.push(i);
                i++;
            }
            return result;
        }, []);
    }

    subranges() {
        return this.ranges.map((subrange) => ({
            low: subrange.low,
            high: subrange.high,
            length: 1 + subrange.high - subrange.low
        }));
    }
}

module.exports = DRange;

},{}],2:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./lib/BlankNode"), exports);
__exportStar(require("./lib/DataFactory"), exports);
__exportStar(require("./lib/DefaultGraph"), exports);
__exportStar(require("./lib/Literal"), exports);
__exportStar(require("./lib/NamedNode"), exports);
__exportStar(require("./lib/Quad"), exports);
__exportStar(require("./lib/Variable"), exports);

},{"./lib/BlankNode":3,"./lib/DataFactory":4,"./lib/DefaultGraph":5,"./lib/Literal":6,"./lib/NamedNode":7,"./lib/Quad":8,"./lib/Variable":9}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlankNode = void 0;
/**
 * A term that represents an RDF blank node with a label.
 */
class BlankNode {
    constructor(value) {
        this.termType = 'BlankNode';
        this.value = value;
    }
    equals(other) {
        return !!other && other.termType === 'BlankNode' && other.value === this.value;
    }
}
exports.BlankNode = BlankNode;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFactory = void 0;
const BlankNode_1 = require("./BlankNode");
const DefaultGraph_1 = require("./DefaultGraph");
const Literal_1 = require("./Literal");
const NamedNode_1 = require("./NamedNode");
const Quad_1 = require("./Quad");
const Variable_1 = require("./Variable");
let dataFactoryCounter = 0;
/**
 * A factory for instantiating RDF terms and quads.
 */
class DataFactory {
    constructor(options) {
        this.blankNodeCounter = 0;
        options = options || {};
        this.blankNodePrefix = options.blankNodePrefix || `df_${dataFactoryCounter++}_`;
    }
    /**
     * @param value The IRI for the named node.
     * @return A new instance of NamedNode.
     * @see NamedNode
     */
    namedNode(value) {
        return new NamedNode_1.NamedNode(value);
    }
    /**
     * @param value The optional blank node identifier.
     * @return A new instance of BlankNode.
     *         If the `value` parameter is undefined a new identifier
     *         for the blank node is generated for each call.
     * @see BlankNode
     */
    blankNode(value) {
        return new BlankNode_1.BlankNode(value || `${this.blankNodePrefix}${this.blankNodeCounter++}`);
    }
    /**
     * @param value              The literal value.
     * @param languageOrDatatype The optional language or datatype.
     *                           If `languageOrDatatype` is a NamedNode,
     *                           then it is used for the value of `NamedNode.datatype`.
     *                           Otherwise `languageOrDatatype` is used for the value
     *                           of `NamedNode.language`.
     * @return A new instance of Literal.
     * @see Literal
     */
    literal(value, languageOrDatatype) {
        return new Literal_1.Literal(value, languageOrDatatype);
    }
    /**
     * This method is optional.
     * @param value The variable name
     * @return A new instance of Variable.
     * @see Variable
     */
    variable(value) {
        return new Variable_1.Variable(value);
    }
    /**
     * @return An instance of DefaultGraph.
     */
    defaultGraph() {
        return DefaultGraph_1.DefaultGraph.INSTANCE;
    }
    /**
     * @param subject   The quad subject term.
     * @param predicate The quad predicate term.
     * @param object    The quad object term.
     * @param graph     The quad graph term.
     * @return A new instance of Quad.
     * @see Quad
     */
    quad(subject, predicate, object, graph) {
        return new Quad_1.Quad(subject, predicate, object, graph || this.defaultGraph());
    }
    /**
     * Create a deep copy of the given term using this data factory.
     * @param original An RDF term.
     * @return A deep copy of the given term.
     */
    fromTerm(original) {
        // TODO: remove nasty any casts when this TS bug has been fixed:
        //  https://github.com/microsoft/TypeScript/issues/26933
        switch (original.termType) {
            case 'NamedNode':
                return this.namedNode(original.value);
            case 'BlankNode':
                return this.blankNode(original.value);
            case 'Literal':
                if (original.language) {
                    return this.literal(original.value, original.language);
                }
                if (!original.datatype.equals(Literal_1.Literal.XSD_STRING)) {
                    return this.literal(original.value, this.fromTerm(original.datatype));
                }
                return this.literal(original.value);
            case 'Variable':
                return this.variable(original.value);
            case 'DefaultGraph':
                return this.defaultGraph();
            case 'Quad':
                return this.quad(this.fromTerm(original.subject), this.fromTerm(original.predicate), this.fromTerm(original.object), this.fromTerm(original.graph));
        }
    }
    /**
     * Create a deep copy of the given quad using this data factory.
     * @param original An RDF quad.
     * @return A deep copy of the given quad.
     */
    fromQuad(original) {
        return this.fromTerm(original);
    }
    /**
     * Reset the internal blank node counter.
     */
    resetBlankNodeCounter() {
        this.blankNodeCounter = 0;
    }
}
exports.DataFactory = DataFactory;

},{"./BlankNode":3,"./DefaultGraph":5,"./Literal":6,"./NamedNode":7,"./Quad":8,"./Variable":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGraph = void 0;
/**
 * A singleton term instance that represents the default graph.
 * It's only allowed to assign a DefaultGraph to the .graph property of a Quad.
 */
class DefaultGraph {
    constructor() {
        this.termType = 'DefaultGraph';
        this.value = '';
        // Private constructor
    }
    equals(other) {
        return !!other && other.termType === 'DefaultGraph';
    }
}
exports.DefaultGraph = DefaultGraph;
DefaultGraph.INSTANCE = new DefaultGraph();

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Literal = void 0;
const NamedNode_1 = require("./NamedNode");
/**
 * A term that represents an RDF literal, containing a string with an optional language tag or datatype.
 */
class Literal {
    constructor(value, languageOrDatatype) {
        this.termType = 'Literal';
        this.value = value;
        if (typeof languageOrDatatype === 'string') {
            this.language = languageOrDatatype;
            this.datatype = Literal.RDF_LANGUAGE_STRING;
        }
        else if (languageOrDatatype) {
            this.language = '';
            this.datatype = languageOrDatatype;
        }
        else {
            this.language = '';
            this.datatype = Literal.XSD_STRING;
        }
    }
    equals(other) {
        return !!other && other.termType === 'Literal' && other.value === this.value &&
            other.language === this.language && this.datatype.equals(other.datatype);
    }
}
exports.Literal = Literal;
Literal.RDF_LANGUAGE_STRING = new NamedNode_1.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
Literal.XSD_STRING = new NamedNode_1.NamedNode('http://www.w3.org/2001/XMLSchema#string');

},{"./NamedNode":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamedNode = void 0;
/**
 * A term that contains an IRI.
 */
class NamedNode {
    constructor(value) {
        this.termType = 'NamedNode';
        this.value = value;
    }
    equals(other) {
        return !!other && other.termType === 'NamedNode' && other.value === this.value;
    }
}
exports.NamedNode = NamedNode;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quad = void 0;
/**
 * An instance of DefaultGraph represents the default graph.
 * It's only allowed to assign a DefaultGraph to the .graph property of a Quad.
 */
class Quad {
    constructor(subject, predicate, object, graph) {
        this.termType = 'Quad';
        this.value = '';
        this.subject = subject;
        this.predicate = predicate;
        this.object = object;
        this.graph = graph;
    }
    equals(other) {
        // `|| !other.termType` is for backwards-compatibility with old factories without RDF* support.
        return !!other && (other.termType === 'Quad' || !other.termType) &&
            this.subject.equals(other.subject) &&
            this.predicate.equals(other.predicate) &&
            this.object.equals(other.object) &&
            this.graph.equals(other.graph);
    }
}
exports.Quad = Quad;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Variable = void 0;
/**
 * A term that represents a variable.
 */
class Variable {
    constructor(value) {
        this.termType = 'Variable';
        this.value = value;
    }
    equals(other) {
        return !!other && other.termType === 'Variable' && other.value === this.value;
    }
}
exports.Variable = Variable;

},{}],10:[function(require,module,exports){
const util      = require('./util');
const types     = require('./types');
const sets      = require('./sets');
const positions = require('./positions');


module.exports = (regexpStr) => {
  var i = 0, l, c,
    start = { type: types.ROOT, stack: []},

    // Keep track of last clause/group and stack.
    lastGroup = start,
    last = start.stack,
    groupStack = [];


  var repeatErr = (i) => {
    util.error(regexpStr, `Nothing to repeat at column ${i - 1}`);
  };

  // Decode a few escaped characters.
  var str = util.strToChars(regexpStr);
  l = str.length;

  // Iterate through each character in string.
  while (i < l) {
    c = str[i++];

    switch (c) {
      // Handle escaped characters, inclues a few sets.
      case '\\':
        c = str[i++];

        switch (c) {
          case 'b':
            last.push(positions.wordBoundary());
            break;

          case 'B':
            last.push(positions.nonWordBoundary());
            break;

          case 'w':
            last.push(sets.words());
            break;

          case 'W':
            last.push(sets.notWords());
            break;

          case 'd':
            last.push(sets.ints());
            break;

          case 'D':
            last.push(sets.notInts());
            break;

          case 's':
            last.push(sets.whitespace());
            break;

          case 'S':
            last.push(sets.notWhitespace());
            break;

          default:
            // Check if c is integer.
            // In which case it's a reference.
            if (/\d/.test(c)) {
              last.push({ type: types.REFERENCE, value: parseInt(c, 10) });

            // Escaped character.
            } else {
              last.push({ type: types.CHAR, value: c.charCodeAt(0) });
            }
        }

        break;


      // Positionals.
      case '^':
        last.push(positions.begin());
        break;

      case '$':
        last.push(positions.end());
        break;


      // Handle custom sets.
      case '[':
        // Check if this class is 'anti' i.e. [^abc].
        var not;
        if (str[i] === '^') {
          not = true;
          i++;
        } else {
          not = false;
        }

        // Get all the characters in class.
        var classTokens = util.tokenizeClass(str.slice(i), regexpStr);

        // Increase index by length of class.
        i += classTokens[1];
        last.push({
          type: types.SET,
          set: classTokens[0],
          not,
        });

        break;


      // Class of any character except \n.
      case '.':
        last.push(sets.anyChar());
        break;


      // Push group onto stack.
      case '(':
        // Create group.
        var group = {
          type: types.GROUP,
          stack: [],
          remember: true,
        };

        c = str[i];

        // If if this is a special kind of group.
        if (c === '?') {
          c = str[i + 1];
          i += 2;

          // Match if followed by.
          if (c === '=') {
            group.followedBy = true;

          // Match if not followed by.
          } else if (c === '!') {
            group.notFollowedBy = true;

          } else if (c !== ':') {
            util.error(regexpStr,
              `Invalid group, character '${c}'` +
              ` after '?' at column ${i - 1}`);
          }

          group.remember = false;
        }

        // Insert subgroup into current group stack.
        last.push(group);

        // Remember the current group for when the group closes.
        groupStack.push(lastGroup);

        // Make this new group the current group.
        lastGroup = group;
        last = group.stack;
        break;


      // Pop group out of stack.
      case ')':
        if (groupStack.length === 0) {
          util.error(regexpStr, `Unmatched ) at column ${i - 1}`);
        }
        lastGroup = groupStack.pop();

        // Check if this group has a PIPE.
        // To get back the correct last stack.
        last = lastGroup.options ?
          lastGroup.options[lastGroup.options.length - 1] : lastGroup.stack;
        break;


      // Use pipe character to give more choices.
      case '|':
        // Create array where options are if this is the first PIPE
        // in this clause.
        if (!lastGroup.options) {
          lastGroup.options = [lastGroup.stack];
          delete lastGroup.stack;
        }

        // Create a new stack and add to options for rest of clause.
        var stack = [];
        lastGroup.options.push(stack);
        last = stack;
        break;


      // Repetition.
      // For every repetition, remove last element from last stack
      // then insert back a RANGE object.
      // This design is chosen because there could be more than
      // one repetition symbols in a regex i.e. `a?+{2,3}`.
      case '{':
        var rs = /^(\d+)(,(\d+)?)?\}/.exec(str.slice(i)), min, max;
        if (rs !== null) {
          if (last.length === 0) {
            repeatErr(i);
          }
          min = parseInt(rs[1], 10);
          max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
          i += rs[0].length;

          last.push({
            type: types.REPETITION,
            min,
            max,
            value: last.pop(),
          });
        } else {
          last.push({
            type: types.CHAR,
            value: 123,
          });
        }
        break;

      case '?':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 0,
          max: 1,
          value: last.pop(),
        });
        break;

      case '+':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 1,
          max: Infinity,
          value: last.pop(),
        });
        break;

      case '*':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 0,
          max: Infinity,
          value: last.pop(),
        });
        break;


      // Default is a character that is not `\[](){}?+*^$`.
      default:
        last.push({
          type: types.CHAR,
          value: c.charCodeAt(0),
        });
    }

  }

  // Check if any groups have not been closed.
  if (groupStack.length !== 0) {
    util.error(regexpStr, 'Unterminated group');
  }

  return start;
};

module.exports.types = types;

},{"./positions":11,"./sets":12,"./types":13,"./util":14}],11:[function(require,module,exports){
const types = require('./types');
exports.wordBoundary = () => ({ type: types.POSITION, value: 'b' });
exports.nonWordBoundary = () => ({ type: types.POSITION, value: 'B' });
exports.begin = () => ({ type: types.POSITION, value: '^' });
exports.end = () => ({ type: types.POSITION, value: '$' });

},{"./types":13}],12:[function(require,module,exports){
const types = require('./types');

const INTS = () => [{ type: types.RANGE , from: 48, to: 57 }];

const WORDS = () => {
  return [
    { type: types.CHAR, value: 95 },
    { type: types.RANGE, from: 97, to: 122 },
    { type: types.RANGE, from: 65, to: 90 }
  ].concat(INTS());
};

const WHITESPACE = () => {
  return [
    { type: types.CHAR, value: 9 },
    { type: types.CHAR, value: 10 },
    { type: types.CHAR, value: 11 },
    { type: types.CHAR, value: 12 },
    { type: types.CHAR, value: 13 },
    { type: types.CHAR, value: 32 },
    { type: types.CHAR, value: 160 },
    { type: types.CHAR, value: 5760 },
    { type: types.RANGE, from: 8192, to: 8202 },
    { type: types.CHAR, value: 8232 },
    { type: types.CHAR, value: 8233 },
    { type: types.CHAR, value: 8239 },
    { type: types.CHAR, value: 8287 },
    { type: types.CHAR, value: 12288 },
    { type: types.CHAR, value: 65279 }
  ];
};

const NOTANYCHAR = () => {
  return [
    { type: types.CHAR, value: 10 },
    { type: types.CHAR, value: 13 },
    { type: types.CHAR, value: 8232 },
    { type: types.CHAR, value: 8233 },
  ];
};

// Predefined class objects.
exports.words = () => ({ type: types.SET, set: WORDS(), not: false });
exports.notWords = () => ({ type: types.SET, set: WORDS(), not: true });
exports.ints = () => ({ type: types.SET, set: INTS(), not: false });
exports.notInts = () => ({ type: types.SET, set: INTS(), not: true });
exports.whitespace = () => ({ type: types.SET, set: WHITESPACE(), not: false });
exports.notWhitespace = () => ({ type: types.SET, set: WHITESPACE(), not: true });
exports.anyChar = () => ({ type: types.SET, set: NOTANYCHAR(), not: true });

},{"./types":13}],13:[function(require,module,exports){
module.exports = {
  ROOT       : 0,
  GROUP      : 1,
  POSITION   : 2,
  SET        : 3,
  RANGE      : 4,
  REPETITION : 5,
  REFERENCE  : 6,
  CHAR       : 7,
};

},{}],14:[function(require,module,exports){
const types = require('./types');
const sets  = require('./sets');


const CTRL = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?';
const SLSH = { '0': 0, 't': 9, 'n': 10, 'v': 11, 'f': 12, 'r': 13 };

/**
 * Finds character representations in str and convert all to
 * their respective characters
 *
 * @param {String} str
 * @return {String}
 */
exports.strToChars = function(str) {
  /* jshint maxlen: false */
  var chars_regex = /(\[\\b\])|(\\)?\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z[\\\]^?])|([0tnvfr]))/g;
  str = str.replace(chars_regex, function(s, b, lbs, a16, b16, c8, dctrl, eslsh) {
    if (lbs) {
      return s;
    }

    var code = b ? 8 :
      a16   ? parseInt(a16, 16) :
      b16   ? parseInt(b16, 16) :
      c8    ? parseInt(c8,   8) :
      dctrl ? CTRL.indexOf(dctrl) :
      SLSH[eslsh];

    var c = String.fromCharCode(code);

    // Escape special regex characters.
    if (/[[\]{}^$.|?*+()]/.test(c)) {
      c = '\\' + c;
    }

    return c;
  });

  return str;
};


/**
 * turns class into tokens
 * reads str until it encounters a ] not preceeded by a \
 *
 * @param {String} str
 * @param {String} regexpStr
 * @return {Array.<Array.<Object>, Number>}
 */
exports.tokenizeClass = (str, regexpStr) => {
  /* jshint maxlen: false */
  var tokens = [];
  var regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?([^])/g;
  var rs, c;


  while ((rs = regexp.exec(str)) != null) {
    if (rs[1]) {
      tokens.push(sets.words());

    } else if (rs[2]) {
      tokens.push(sets.ints());

    } else if (rs[3]) {
      tokens.push(sets.whitespace());

    } else if (rs[4]) {
      tokens.push(sets.notWords());

    } else if (rs[5]) {
      tokens.push(sets.notInts());

    } else if (rs[6]) {
      tokens.push(sets.notWhitespace());

    } else if (rs[7]) {
      tokens.push({
        type: types.RANGE,
        from: (rs[8] || rs[9]).charCodeAt(0),
        to: rs[10].charCodeAt(0),
      });

    } else if ((c = rs[12])) {
      tokens.push({
        type: types.CHAR,
        value: c.charCodeAt(0),
      });

    } else {
      return [tokens, regexp.lastIndex];
    }
  }

  exports.error(regexpStr, 'Unterminated character class');
};


/**
 * Shortcut to throw errors.
 *
 * @param {String} regexp
 * @param {String} msg
 */
exports.error = (regexp, msg) => {
  throw new SyntaxError('Invalid regular expression: /' + regexp + '/: ' + msg);
};

},{"./sets":12,"./types":13}],15:[function(require,module,exports){
var XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
var XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

function Generator(options) {
  this._options = options = options || {};

  var prefixes = options.prefixes || {};
  this._prefixByIri = {};
  var prefixIris = [];
  for (var prefix in prefixes) {
    var iri = prefixes[prefix];
    if (isString(iri)) {
      this._prefixByIri[iri] = prefix;
      prefixIris.push(iri);
    }
  }
  var iriList = prefixIris.join('|').replace(/[\]\/\(\)\*\+\?\.\\\$]/g, '\\$&');
  this._prefixRegex = new RegExp('^(' + iriList + ')([a-zA-Z][\\-_a-zA-Z0-9]*)$');
  this._usedPrefixes = {};
  this._sparqlStar = options.sparqlStar;
  this._indent =  isString(options.indent)  ? options.indent  : '  ';
  this._newline = isString(options.newline) ? options.newline : '\n';
  this._explicitDatatype = Boolean(options.explicitDatatype);
}

// Converts the parsed query object into a SPARQL query
Generator.prototype.toQuery = function (q) {
  var query = '';

  if (q.queryType)
    query += q.queryType.toUpperCase() + ' ';
  if (q.reduced)
    query += 'REDUCED ';
  if (q.distinct)
    query += 'DISTINCT ';

  if (q.variables){
    query += mapJoin(q.variables, undefined, function (variable) {
      return isTerm(variable) ? this.toEntity(variable) :
             '(' + this.toExpression(variable.expression) + ' AS ' + variableToString(variable.variable) + ')';
    }, this) + ' ';
  }
  else if (q.template)
    query += this.group(q.template, true) + this._newline;

  if (q.from)
    query += this.graphs('FROM ', q.from.default) + this.graphs('FROM NAMED ', q.from.named);
  if (q.where)
    query += 'WHERE ' + this.group(q.where, true) + this._newline;

  if (q.updates)
    query += mapJoin(q.updates, ';' + this._newline, this.toUpdate, this);

  if (q.group)
    query += 'GROUP BY ' + mapJoin(q.group, undefined, function (it) {
      var result = isTerm(it.expression)
        ? this.toEntity(it.expression)
        : '(' + this.toExpression(it.expression) + ')';
      return it.variable ? '(' + result + ' AS ' + variableToString(it.variable) + ')' : result;
    }, this) + this._newline;
  if (q.having)
    query += 'HAVING (' + mapJoin(q.having, undefined, this.toExpression, this) + ')' + this._newline;
  if (q.order)
    query += 'ORDER BY ' + mapJoin(q.order, undefined, function (it) {
      var expr = '(' + this.toExpression(it.expression) + ')';
      return !it.descending ? expr : 'DESC ' + expr;
    }, this) + this._newline;

  if (q.offset)
    query += 'OFFSET ' + q.offset + this._newline;
  if (q.limit)
    query += 'LIMIT ' + q.limit + this._newline;

  if (q.values)
    query += this.values(q);

  // stringify prefixes at the end to mark used ones
  query = this.baseAndPrefixes(q) + query;
  return query.trim();
};

Generator.prototype.baseAndPrefixes = function (q) {
  var base = q.base ? ('BASE <' + q.base + '>' + this._newline) : '';
  var prefixes = '';
  for (var key in q.prefixes) {
    if (this._options.allPrefixes || this._usedPrefixes[key])
      prefixes += 'PREFIX ' + key + ': <' + q.prefixes[key] + '>' + this._newline;
  }
  return base + prefixes;
};

// Converts the parsed SPARQL pattern into a SPARQL pattern
Generator.prototype.toPattern = function (pattern) {
  var type = pattern.type || (pattern instanceof Array) && 'array' ||
             (pattern.subject && pattern.predicate && pattern.object ? 'triple' : '');
  if (!(type in this))
    throw new Error('Unknown entry type: ' + type);
  return this[type](pattern);
};

Generator.prototype.triple = function (t) {
  return this.toEntity(t.subject) + ' ' + this.toEntity(t.predicate) + ' ' + this.toEntity(t.object) + '.';
};

Generator.prototype.array = function (items) {
  return mapJoin(items, this._newline, this.toPattern, this);
};

Generator.prototype.bgp = function (bgp) {
  return this.encodeTriples(bgp.triples);
};

Generator.prototype.encodeTriples = function (triples) {
  if (!triples.length)
    return '';

  var parts = [], subject = undefined, predicate = undefined;
  for (var i = 0; i < triples.length; i++) {
    var triple = triples[i];
    // Triple with different subject
    if (!equalTerms(triple.subject, subject)) {
      // Terminate previous triple
      if (subject)
        parts.push('.' + this._newline);
      subject = triple.subject;
      predicate = triple.predicate;
      parts.push(this.toEntity(subject), ' ', this.toEntity(predicate));
    }
    // Triple with same subject but different predicate
    else if (!equalTerms(triple.predicate, predicate)) {
      predicate = triple.predicate;
      parts.push(';' + this._newline, this._indent, this.toEntity(predicate));
    }
    // Triple with same subject and predicate
    else {
      parts.push(',');
    }
    parts.push(' ', this.toEntity(triple.object));
  }
  parts.push('.');

  return parts.join('');
}

Generator.prototype.graph = function (graph) {
  return 'GRAPH ' + this.toEntity(graph.name) + ' ' + this.group(graph);
};

Generator.prototype.graphs = function (keyword, graphs) {
  return !graphs || graphs.length === 0 ? '' :
    mapJoin(graphs, '', function (g) { return keyword + this.toEntity(g) + this._newline; }, this)
}

Generator.prototype.group = function (group, inline) {
  group = inline !== true ? this.array(group.patterns || group.triples)
                          : this.toPattern(group.type !== 'group' ? group : group.patterns);
  return group.indexOf(this._newline) === -1 ? '{ ' + group + ' }' : '{' + this._newline + this.indent(group) + this._newline + '}';
};

Generator.prototype.query = function (query) {
  return this.toQuery(query);
};

Generator.prototype.filter = function (filter) {
  return 'FILTER(' + this.toExpression(filter.expression) + ')';
};

Generator.prototype.bind = function (bind) {
  return 'BIND(' + this.toExpression(bind.expression) + ' AS ' + variableToString(bind.variable) + ')';
};

Generator.prototype.optional = function (optional) {
  return 'OPTIONAL ' + this.group(optional);
};

Generator.prototype.union = function (union) {
  return mapJoin(union.patterns, this._newline + 'UNION' + this._newline, function (p) { return this.group(p, true); }, this);
};

Generator.prototype.minus = function (minus) {
  return 'MINUS ' + this.group(minus);
};

Generator.prototype.values = function (valuesList) {
  // Gather unique keys
  var keys = Object.keys(valuesList.values.reduce(function (keyHash, values) {
    for (var key in values) keyHash[key] = true;
    return keyHash;
  }, {}));
  // Check whether simple syntax can be used
  var lparen, rparen;
  if (keys.length === 1) {
    lparen = rparen = '';
  } else {
    lparen = '(';
    rparen = ')';
  }
  // Create value rows
  return 'VALUES ' + lparen + keys.join(' ') + rparen + ' {' + this._newline +
    mapJoin(valuesList.values, this._newline, function (values) {
      return '  ' + lparen + mapJoin(keys, undefined, function (key) {
        return values[key] ? this.toEntity(values[key]) : 'UNDEF';
      }, this) + rparen;
    }, this) + this._newline + '}';
};

Generator.prototype.service = function (service) {
  return 'SERVICE ' + (service.silent ? 'SILENT ' : '') + this.toEntity(service.name) + ' ' +
         this.group(service);
};

// Converts the parsed expression object into a SPARQL expression
Generator.prototype.toExpression = function (expr) {
  if (isTerm(expr)) {
    return this.toEntity(expr);
  }
  switch (expr.type.toLowerCase()) {
    case 'aggregate':
      return expr.aggregation.toUpperCase() +
             '(' + (expr.distinct ? 'DISTINCT ' : '') + this.toExpression(expr.expression) +
             (typeof expr.separator === 'string' ? '; SEPARATOR = ' + '"' + expr.separator.replace(escape, escapeReplacer) + '"' : '') + ')';
    case 'functioncall':
      return this.toEntity(expr.function) + '(' + mapJoin(expr.args, ', ', this.toExpression, this) + ')';
    case 'operation':
      var operator = expr.operator.toUpperCase(), args = expr.args || [];
      switch (expr.operator.toLowerCase()) {
      // Infix operators
      case '<':
      case '>':
      case '>=':
      case '<=':
      case '&&':
      case '||':
      case '=':
      case '!=':
      case '+':
      case '-':
      case '*':
      case '/':
          return (isTerm(args[0]) ? this.toEntity(args[0]) : '(' + this.toExpression(args[0]) + ')') +
                 ' ' + operator + ' ' +
                 (isTerm(args[1]) ? this.toEntity(args[1]) : '(' + this.toExpression(args[1]) + ')');
      // Unary operators
      case '!':
        return '!(' + this.toExpression(args[0]) + ')';
      case 'uplus':
        return '+(' + this.toExpression(args[0]) + ')';
      case 'uminus':
        return '-(' + this.toExpression(args[0]) + ')';
      // IN and NOT IN
      case 'notin':
        operator = 'NOT IN';
      case 'in':
        return this.toExpression(args[0]) + ' ' + operator +
               '(' + (isString(args[1]) ? args[1] : mapJoin(args[1], ', ', this.toExpression, this)) + ')';
      // EXISTS and NOT EXISTS
      case 'notexists':
        operator = 'NOT EXISTS';
      case 'exists':
        return operator + ' ' + this.group(args[0], true);
      // Other expressions
      default:
        return operator + '(' + mapJoin(args, ', ', this.toExpression, this) + ')';
      }
    default:
      throw new Error('Unknown expression type: ' + expr.type);
  }
};

// Converts the parsed entity (or property path) into a SPARQL entity
Generator.prototype.toEntity = function (value) {
  if (isTerm(value)) {
    switch (value.termType) {
    // variable, * selector, or blank node
    case 'Wildcard':
      return '*';
    case 'Variable':
      return variableToString(value);
    case 'BlankNode':
      return '_:' + value.value;
    // literal
    case 'Literal':
      var lexical = value.value || '', language = value.language || '', datatype = value.datatype;
      value = '"' + lexical.replace(escape, escapeReplacer) + '"';
      if (language){
        value += '@' + language;
      } else if (datatype) {
        // Abbreviate literals when possible
        if (!this._explicitDatatype) {
          switch (datatype.value) {
          case XSD_STRING:
            return value;
          case XSD_INTEGER:
            if (/^\d+$/.test(lexical))
              // Add space to avoid confusion with decimals in broken parsers
              return lexical + ' ';
          }
        }
        value += '^^' + this.encodeIRI(datatype.value);
      }
      return value;
    case 'Quad':
      if (!this._sparqlStar)
          throw new Error('SPARQL* support is not enabled');

      if (value.graph && value.graph.termType !== "DefaultGraph") {
        return '<< GRAPH ' +
          this.toEntity(value.graph) +
          ' { ' +
          this.toEntity(value.subject) + ' ' +
          this.toEntity(value.predicate) + ' ' +
          this.toEntity(value.object) +
          ' } ' +
          ' >>'
      }
      else {
        return (
          '<< ' +
          this.toEntity(value.subject) + ' ' +
          this.toEntity(value.predicate) + ' ' +
          this.toEntity(value.object) +
          ' >>'
        );
      }
    // IRI
    default:
      return this.encodeIRI(value.value);
    }
  }
  // property path
  else {
    var items = value.items.map(this.toEntity, this), path = value.pathType;
    switch (path) {
    // prefix operator
    case '^':
    case '!':
      return path + items[0];
    // postfix operator
    case '*':
    case '+':
    case '?':
      return '(' + items[0] + path + ')';
    // infix operator
    default:
      return '(' + items.join(path) + ')';
    }
  }
};
var escape = /["\\\t\n\r\b\f]/g,
    escapeReplacer = function (c) { return escapeReplacements[c]; },
    escapeReplacements = { '\\': '\\\\', '"': '\\"', '\t': '\\t',
                           '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f' };

// Represent the IRI, as a prefixed name when possible
Generator.prototype.encodeIRI = function (iri) {
  var prefixMatch = this._prefixRegex.exec(iri);
  if (prefixMatch) {
    var prefix = this._prefixByIri[prefixMatch[1]];
    this._usedPrefixes[prefix] = true;
    return prefix + ':' + prefixMatch[2];
  }
  return '<' + iri + '>';
};

// Converts the parsed update object into a SPARQL update clause
Generator.prototype.toUpdate = function (update) {
  switch (update.type || update.updateType) {
  case 'load':
    return 'LOAD' + (update.source ? ' ' + this.toEntity(update.source) : '') +
           (update.destination ? ' INTO GRAPH ' + this.toEntity(update.destination) : '');
  case 'insert':
    return 'INSERT DATA '  + this.group(update.insert, true);
  case 'delete':
    return 'DELETE DATA '  + this.group(update.delete, true);
  case 'deletewhere':
    return 'DELETE WHERE ' + this.group(update.delete, true);
  case 'insertdelete':
    return (update.graph ? 'WITH ' + this.toEntity(update.graph) + this._newline : '') +
           (update.delete.length ? 'DELETE ' + this.group(update.delete, true) + this._newline : '') +
           (update.insert.length ? 'INSERT ' + this.group(update.insert, true) + this._newline : '') +
           (update.using ? this.graphs('USING ', update.using.default) : '') +
           (update.using ? this.graphs('USING NAMED ', update.using.named) : '') +
           'WHERE ' + this.group(update.where, true);
  case 'add':
  case 'copy':
  case 'move':
    return update.type.toUpperCase()+ ' ' +  (update.silent ? 'SILENT ' : '') + (update.source.default ? 'DEFAULT' : this.toEntity(update.source.name)) +
           ' TO ' + this.toEntity(update.destination.name);
  case 'create':
  case 'clear':
  case 'drop':
    return update.type.toUpperCase() + (update.silent ? ' SILENT ' : ' ') + (
      update.graph.default ? 'DEFAULT' :
      update.graph.named ? 'NAMED' :
      update.graph.all ? 'ALL' :
      ('GRAPH ' + this.toEntity(update.graph.name))
    );
  default:
    throw new Error('Unknown update query type: ' + update.type);
  }
};

// Indents each line of the string
Generator.prototype.indent = function(text) { return text.replace(/^/gm, this._indent); }

function variableToString(variable){
  return '?' + variable.value;
}

// Checks whether the object is a string
function isString(object) { return typeof object === 'string'; }

// Checks whether the object is a Term
function isTerm(object) {
  return typeof object.termType === 'string';
}

// Checks whether term1 and term2 are equivalent without `.equals()` prototype method
function equalTerms(term1, term2) {
  if (!term1 || !isTerm(term1)) { return false; }
  if (!term2 || !isTerm(term2)) { return false; }
  if (term1.termType !== term2.termType) { return false; }
  switch (term1.termType) {
    case 'Literal':
      return term1.value === term2.value
          && term1.language === term2.language
          && equalTerms(term1.datatype, term2.datatype);
    case 'Quad':
      return equalTerms(term1.subject, term2.subject)
          && equalTerms(term1.predicate, term2.predicate)
          && equalTerms(term1.object, term2.object)
          && equalTerms(term1.graph, term2.graph);
    default:
      return term1.value === term2.value;
  }
}

// Maps the array with the given function, and joins the results using the separator
function mapJoin(array, sep, func, self) {
  return array.map(func, self).join(isString(sep) ? sep : ' ');
}

/**
 * @param options {
 *   allPrefixes: boolean,
 *   indentation: string,
 *   newline: string
 * }
 */
module.exports = function SparqlGenerator(options = {}) {
  return {
    stringify: function (query) {
      var currentOptions = Object.create(options);
      currentOptions.prefixes = query.prefixes;
      return new Generator(currentOptions).toQuery(query);
    },
    createGenerator: function() { return new Generator(options); }
  };
};

},{}],16:[function(require,module,exports){
/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var SparqlParser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,12,13,15,16,24,32,36,41,45,100,110,113,115,116,123,126,131,197,224,229,308,329,330,331,332,333],$V1=[2,247],$V2=[100,110,113,115,116,123,126,131,329,330,331,332,333],$V3=[2,409],$V4=[1,18],$V5=[1,27],$V6=[13,16,45,197,224,229,308],$V7=[28,29,53],$V8=[28,53],$V9=[1,42],$Va=[1,45],$Vb=[1,41],$Vc=[1,44],$Vd=[123,126],$Ve=[1,67],$Vf=[39,45,87],$Vg=[13,16,45,197,224,308],$Vh=[1,87],$Vi=[2,281],$Vj=[1,86],$Vk=[13,16,45,82,87,89,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312],$Vl=[6,28,29,53,63,70,73,81,83,85],$Vm=[6,13,16,28,29,53,63,70,73,81,83,85,87,308],$Vn=[6,13,16,28,29,45,53,63,70,73,81,82,83,85,87,89,197,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314],$Vo=[6,13,16,28,29,31,39,45,47,48,53,63,70,73,81,82,83,85,87,89,109,112,121,123,126,128,159,160,161,163,164,174,193,197,224,229,231,232,242,246,250,263,265,272,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314,317,318,335,337,338,340,341,342,343,344,345,346],$Vp=[13,16,308],$Vq=[112,132,327,334],$Vr=[13,16,112,132,308],$Vs=[1,111],$Vt=[1,117],$Vu=[112,132,327,328,334],$Vv=[13,16,112,132,308,328],$Vw=[28,29,45,53,87],$Vx=[1,138],$Vy=[1,151],$Vz=[1,128],$VA=[1,127],$VB=[1,129],$VC=[1,140],$VD=[1,141],$VE=[1,142],$VF=[1,143],$VG=[1,144],$VH=[1,145],$VI=[1,147],$VJ=[1,148],$VK=[2,457],$VL=[1,158],$VM=[1,159],$VN=[1,160],$VO=[1,152],$VP=[1,153],$VQ=[1,156],$VR=[1,171],$VS=[1,172],$VT=[1,173],$VU=[1,174],$VV=[1,175],$VW=[1,176],$VX=[1,167],$VY=[1,168],$VZ=[1,169],$V_=[1,170],$V$=[1,157],$V01=[1,166],$V11=[1,161],$V21=[1,162],$V31=[1,163],$V41=[1,164],$V51=[1,165],$V61=[6,13,16,29,31,45,82,85,87,89,112,159,160,161,163,164,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335],$V71=[1,195],$V81=[6,31,73,81,83,85],$V91=[2,285],$Va1=[1,199],$Vb1=[1,201],$Vc1=[6,31,70,73,81,83,85],$Vd1=[2,283],$Ve1=[1,207],$Vf1=[1,218],$Vg1=[1,223],$Vh1=[1,219],$Vi1=[1,225],$Vj1=[1,226],$Vk1=[1,224],$Vl1=[6,63,70,73,81,83,85],$Vm1=[1,236],$Vn1=[2,334],$Vo1=[1,243],$Vp1=[1,241],$Vq1=[6,193],$Vr1=[2,349],$Vs1=[2,339],$Vt1=[28,128],$Vu1=[47,48,193,272],$Vv1=[47,48,193,242,272],$Vw1=[47,48,193,242,246,272],$Vx1=[47,48,193,242,246,250,263,265,272,290,297,298,299,300,301,302,341,342,343,344,345,346],$Vy1=[39,47,48,193,242,246,250,263,265,272,290,297,298,299,300,301,302,338,341,342,343,344,345,346],$Vz1=[1,271],$VA1=[1,270],$VB1=[6,13,16,29,31,39,45,47,48,70,73,76,78,81,82,83,85,87,89,112,159,160,161,163,164,193,231,242,246,250,263,265,268,269,270,271,272,273,274,276,277,279,280,283,285,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335,338,341,342,343,344,345,346,347,348,349,350,351],$VC1=[1,281],$VD1=[1,280],$VE1=[13,16,29,31,39,45,47,48,82,85,87,89,112,159,160,161,163,164,174,193,197,224,229,231,232,242,246,250,263,265,272,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314,317,318,335,338,341,342,343,344,345,346],$VF1=[45,89],$VG1=[13,16,29,31,39,45,47,48,82,85,87,89,112,159,160,161,163,164,174,193,197,224,229,231,232,242,246,250,263,265,272,290,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314,317,318,335,338,341,342,343,344,345,346],$VH1=[13,16,31,82,174,294,295,296,297,298,299,300,301,302,303,304,305,306,308,312],$VI1=[31,89],$VJ1=[48,87],$VK1=[6,13,16,45,48,82,87,89,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,337,338],$VL1=[6,13,16,39,45,48,82,87,89,231,263,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,337,338,340],$VM1=[1,313],$VN1=[6,85],$VO1=[6,31,81,83,85],$VP1=[2,361],$VQ1=[2,353],$VR1=[1,343],$VS1=[31,112,335],$VT1=[13,16,29,31,45,48,82,85,87,89,112,159,160,161,163,164,193,197,224,229,231,232,272,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,317,318,335],$VU1=[13,16,29,31,45,48,82,85,87,89,112,159,160,161,163,164,193,197,224,229,231,232,272,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314,317,318,335],$VV1=[6,109,193],$VW1=[31,112],$VX1=[13,16,45,82,87,224,263,265,268,269,270,271,273,274,276,277,279,280,283,285,294,295,296,297,298,299,300,301,302,303,304,305,306,308,312,346,347,348,349,350,351],$VY1=[1,390],$VZ1=[1,391],$V_1=[13,16,87,197,308,314],$V$1=[13,16,39,45,82,87,224,263,265,268,269,270,271,273,274,276,277,279,280,283,285,294,295,296,297,298,299,300,301,302,303,304,305,306,308,312,346,347,348,349,350,351],$V02=[1,417],$V12=[1,418],$V22=[13,16,48,197,229,308],$V32=[6,31,85],$V42=[6,13,16,31,45,73,81,83,85,268,269,270,271,273,274,276,277,279,280,283,285,308,346,347,348,349,350,351],$V52=[6,13,16,29,31,45,73,76,78,81,82,83,85,87,89,112,159,160,161,163,164,231,268,269,270,271,273,274,276,277,279,280,283,285,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335,346,347,348,349,350,351],$V62=[29,31,85,112,159,160,161,163,164],$V72=[1,443],$V82=[1,444],$V92=[1,449],$Va2=[31,112,193,232,318,335],$Vb2=[13,16,45,48,82,87,89,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312],$Vc2=[13,16,31,45,48,82,87,89,112,193,231,232,272,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,317,318,335],$Vd2=[13,16,29,31,45,48,82,85,87,89,112,159,160,161,163,164,193,231,232,272,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,317,318,335],$Ve2=[13,16,31,48,82,174,294,295,296,297,298,299,300,301,302,303,304,305,306,308,312],$Vf2=[31,45],$Vg2=[1,507],$Vh2=[1,508],$Vi2=[6,13,16,29,31,39,45,47,48,63,70,73,76,78,81,82,83,85,87,89,112,159,160,161,163,164,193,231,242,246,250,263,265,268,269,270,271,272,273,274,276,277,279,280,283,285,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335,336,338,341,342,343,344,345,346,347,348,349,350,351],$Vj2=[29,31,85,112,159,160,161,163,164,335],$Vk2=[6,13,16,31,45,70,73,81,83,85,87,268,269,270,271,273,274,276,277,279,280,283,285,308,346,347,348,349,350,351],$Vl2=[13,16,31,45,48,82,87,89,112,193,197,231,232,272,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,317,318,335],$Vm2=[2,352],$Vn2=[13,16,197,308,314],$Vo2=[1,565],$Vp2=[6,13,16,31,45,76,78,81,83,85,87,268,269,270,271,273,274,276,277,279,280,283,285,308,346,347,348,349,350,351],$Vq2=[13,16,29,31,45,82,85,87,89,112,159,160,161,163,164,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312],$Vr2=[13,16,29,31,45,82,85,87,89,112,159,160,161,163,164,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335],$Vs2=[13,16,87,308],$Vt2=[2,364],$Vu2=[29,31,85,112,159,160,161,163,164,193,232,318,335],$Vv2=[31,112,193,232,272,318,335],$Vw2=[2,359],$Vx2=[13,16,48,82,174,294,295,296,297,298,299,300,301,302,303,304,305,306,308,312],$Vy2=[29,31,85,112,159,160,161,163,164,193,232,272,318,335],$Vz2=[13,16,31,45,82,87,89,112,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312],$VA2=[2,347];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"QueryOrUpdate":3,"Prologue":4,"QueryOrUpdate_group0":5,"EOF":6,"Query":7,"Qry":8,"Query_option0":9,"Prologue_repetition0":10,"BaseDecl":11,"BASE":12,"IRIREF":13,"PrefixDecl":14,"PREFIX":15,"PNAME_NS":16,"SelectClauseWildcard":17,"Qry_repetition0":18,"WhereClause":19,"SolutionModifierNoGroup":20,"SelectClauseVars":21,"Qry_repetition1":22,"SolutionModifier":23,"CONSTRUCT":24,"ConstructTemplate":25,"Qry_repetition2":26,"Qry_repetition3":27,"WHERE":28,"{":29,"Qry_option0":30,"}":31,"DESCRIBE":32,"Qry_group0":33,"Qry_repetition4":34,"Qry_option1":35,"ASK":36,"Qry_repetition5":37,"SelectClauseBase":38,"*":39,"SelectClauseVars_repetition_plus0":40,"SELECT":41,"SelectClauseBase_option0":42,"SelectClauseItem":43,"Var":44,"(":45,"Expression":46,"AS":47,")":48,"SubSelect":49,"SubSelect_option0":50,"SubSelect_option1":51,"DatasetClause":52,"FROM":53,"DatasetClause_option0":54,"iri":55,"WhereClause_option0":56,"GroupGraphPattern":57,"SolutionModifier_option0":58,"SolutionModifierNoGroup_option0":59,"SolutionModifierNoGroup_option1":60,"SolutionModifierNoGroup_option2":61,"GroupClause":62,"GROUP":63,"BY":64,"GroupClause_repetition_plus0":65,"GroupCondition":66,"BuiltInCall":67,"FunctionCall":68,"HavingClause":69,"HAVING":70,"HavingClause_repetition_plus0":71,"OrderClause":72,"ORDER":73,"OrderClause_repetition_plus0":74,"OrderCondition":75,"ASC":76,"BrackettedExpression":77,"DESC":78,"Constraint":79,"LimitOffsetClauses":80,"LIMIT":81,"INTEGER":82,"OFFSET":83,"ValuesClause":84,"VALUES":85,"InlineData":86,"VAR":87,"InlineData_repetition0":88,"NIL":89,"InlineData_repetition1":90,"InlineData_repetition_plus2":91,"InlineData_repetition3":92,"DataBlock":93,"DataBlockValueList":94,"DataBlockValueList_repetition_plus0":95,"Update":96,"Update_repetition0":97,"Update1":98,"Update_option0":99,"LOAD":100,"Update1_option0":101,"Update1_option1":102,"Update1_group0":103,"Update1_option2":104,"GraphRefAll":105,"Update1_group1":106,"Update1_option3":107,"GraphOrDefault":108,"TO":109,"CREATE":110,"Update1_option4":111,"GRAPH":112,"INSERTDATA":113,"QuadPattern":114,"DELETEDATA":115,"DELETEWHERE":116,"Update1_option5":117,"InsertDeleteClause":118,"Update1_repetition0":119,"IntoGraphClause":120,"INTO":121,"GraphRef":122,"DELETE":123,"InsertDeleteClause_option0":124,"InsertClause":125,"INSERT":126,"UsingClause":127,"USING":128,"UsingClause_option0":129,"WithClause":130,"WITH":131,"DEFAULT":132,"GraphOrDefault_option0":133,"GraphRefAll_group0":134,"Quads":135,"Quads_option0":136,"Quads_repetition0":137,"QuadsNotTriples":138,"VarOrIri":139,"QuadsNotTriples_option0":140,"QuadsNotTriples_option1":141,"QuadsNotTriples_option2":142,"TriplesTemplate":143,"TriplesTemplate_repetition0":144,"TriplesSameSubject":145,"TriplesTemplate_option0":146,"GroupGraphPatternSub":147,"GroupGraphPatternSub_option0":148,"GroupGraphPatternSub_repetition0":149,"GroupGraphPatternSubTail":150,"GraphPatternNotTriples":151,"GroupGraphPatternSubTail_option0":152,"GroupGraphPatternSubTail_option1":153,"TriplesBlock":154,"TriplesBlock_repetition0":155,"TriplesSameSubjectPath":156,"TriplesBlock_option0":157,"GroupOrUnionGraphPattern":158,"OPTIONAL":159,"MINUS":160,"SERVICE":161,"GraphPatternNotTriples_option0":162,"FILTER":163,"BIND":164,"InlineDataOneVar":165,"InlineDataFull":166,"InlineDataOneVar_repetition0":167,"InlineDataFull_repetition0":168,"InlineDataFull_repetition_plus1":169,"InlineDataFull_repetition2":170,"DataBlockValue":171,"Literal":172,"QuotedTriple":173,"UNDEF":174,"GroupOrUnionGraphPattern_repetition0":175,"ArgList":176,"ArgList_option0":177,"ArgList_repetition0":178,"ExpressionList":179,"ExpressionList_repetition0":180,"ConstructTemplate_option0":181,"ConstructTriples":182,"ConstructTriples_repetition0":183,"ConstructTriples_option0":184,"VarOrTermOrQuotedTP":185,"PropertyListNotEmpty":186,"TriplesNode":187,"PropertyList":188,"PropertyList_option0":189,"VerbObjectList":190,"PropertyListNotEmpty_repetition0":191,"SemiOptionalVerbObjectList":192,";":193,"SemiOptionalVerbObjectList_option0":194,"Verb":195,"ObjectList":196,"a":197,"ObjectList_repetition0":198,"Object":199,"GraphNode":200,"Object_option0":201,"PropertyListPathNotEmpty":202,"TriplesNodePath":203,"TriplesSameSubjectPath_option0":204,"O":205,"PropertyListPathNotEmpty_repetition0":206,"PropertyListPathNotEmptyTail":207,"O_group0":208,"ObjectListPath":209,"ObjectListPath_repetition0":210,"ObjectPath":211,"GraphNodePath":212,"ObjectPath_option0":213,"Path":214,"Path_repetition0":215,"PathSequence":216,"PathSequence_repetition0":217,"PathEltOrInverse":218,"PathElt":219,"PathPrimary":220,"PathElt_option0":221,"PathEltOrInverse_option0":222,"IriOrA":223,"!":224,"PathNegatedPropertySet":225,"PathOneInPropertySet":226,"PathNegatedPropertySet_repetition0":227,"PathNegatedPropertySet_option0":228,"^":229,"TriplesNode_repetition_plus0":230,"[":231,"]":232,"TriplesNodePath_repetition_plus0":233,"VarOrTermOrQuotedTPExpr":234,"VarOrTerm":235,"GraphTerm":236,"BlankNode":237,"ConditionalOrExpression":238,"ConditionalAndExpression":239,"ConditionalOrExpression_repetition0":240,"ConditionalOrExpressionTail":241,"||":242,"RelationalExpression":243,"ConditionalAndExpression_repetition0":244,"ConditionalAndExpressionTail":245,"&&":246,"NumericExpression":247,"RelationalExpression_group0":248,"RelationalExpression_option0":249,"IN":250,"MultiplicativeExpression":251,"NumericExpression_repetition0":252,"AdditiveExpressionTail":253,"AdditiveExpressionTail_group0":254,"NumericLiteralPositive":255,"AdditiveExpressionTail_repetition0":256,"NumericLiteralNegative":257,"AdditiveExpressionTail_repetition1":258,"UnaryExpression":259,"MultiplicativeExpression_repetition0":260,"MultiplicativeExpressionTail":261,"MultiplicativeExpressionTail_group0":262,"+":263,"PrimaryExpression":264,"-":265,"ExprQuotedTP":266,"Aggregate":267,"FUNC_ARITY0":268,"FUNC_ARITY1":269,"FUNC_ARITY1_SPARQL_STAR":270,"FUNC_ARITY2":271,",":272,"FUNC_ARITY3":273,"FUNC_ARITY3_SPARQL_STAR":274,"BuiltInCall_group0":275,"BOUND":276,"BNODE":277,"BuiltInCall_option0":278,"EXISTS":279,"COUNT":280,"Aggregate_option0":281,"Aggregate_group0":282,"FUNC_AGGREGATE":283,"Aggregate_option1":284,"GROUP_CONCAT":285,"Aggregate_option2":286,"Aggregate_option3":287,"GroupConcatSeparator":288,"SEPARATOR":289,"=":290,"String":291,"LANGTAG":292,"^^":293,"DECIMAL":294,"DOUBLE":295,"BOOLEAN":296,"INTEGER_POSITIVE":297,"DECIMAL_POSITIVE":298,"DOUBLE_POSITIVE":299,"INTEGER_NEGATIVE":300,"DECIMAL_NEGATIVE":301,"DOUBLE_NEGATIVE":302,"STRING_LITERAL1":303,"STRING_LITERAL2":304,"STRING_LITERAL_LONG1":305,"STRING_LITERAL_LONG2":306,"PrefixedName":307,"PNAME_LN":308,"BLANK_NODE_LABEL":309,"ANON":310,"QuotedTP":311,"<<":312,"qtSubjectOrObject":313,">>":314,"DataValueTerm":315,"AnnotationPattern":316,"{|":317,"|}":318,"AnnotationPatternPath":319,"ExprVarOrTerm":320,"QueryOrUpdate_group0_option0":321,"Prologue_repetition0_group0":322,"Qry_group0_repetition_plus0":323,"SelectClauseBase_option0_group0":324,"DISTINCT":325,"REDUCED":326,"NAMED":327,"SILENT":328,"CLEAR":329,"DROP":330,"ADD":331,"MOVE":332,"COPY":333,"ALL":334,".":335,"UNION":336,"|":337,"/":338,"PathElt_option0_group0":339,"?":340,"!=":341,"<":342,">":343,"<=":344,">=":345,"NOT":346,"CONCAT":347,"COALESCE":348,"SUBSTR":349,"REGEX":350,"REPLACE":351,"$accept":0,"$end":1},
invertedSymbols: {"0":"$accept","1":"$end","2":"error","3":"QueryOrUpdate","4":"Prologue","5":"QueryOrUpdate_group0","6":"EOF","7":"Query","8":"Qry","9":"Query_option0","10":"Prologue_repetition0","11":"BaseDecl","12":"BASE","13":"IRIREF","14":"PrefixDecl","15":"PREFIX","16":"PNAME_NS","17":"SelectClauseWildcard","18":"Qry_repetition0","19":"WhereClause","20":"SolutionModifierNoGroup","21":"SelectClauseVars","22":"Qry_repetition1","23":"SolutionModifier","24":"CONSTRUCT","25":"ConstructTemplate","26":"Qry_repetition2","27":"Qry_repetition3","28":"WHERE","29":"{","30":"Qry_option0","31":"}","32":"DESCRIBE","33":"Qry_group0","34":"Qry_repetition4","35":"Qry_option1","36":"ASK","37":"Qry_repetition5","38":"SelectClauseBase","39":"*","40":"SelectClauseVars_repetition_plus0","41":"SELECT","42":"SelectClauseBase_option0","43":"SelectClauseItem","44":"Var","45":"(","46":"Expression","47":"AS","48":")","49":"SubSelect","50":"SubSelect_option0","51":"SubSelect_option1","52":"DatasetClause","53":"FROM","54":"DatasetClause_option0","55":"iri","56":"WhereClause_option0","57":"GroupGraphPattern","58":"SolutionModifier_option0","59":"SolutionModifierNoGroup_option0","60":"SolutionModifierNoGroup_option1","61":"SolutionModifierNoGroup_option2","62":"GroupClause","63":"GROUP","64":"BY","65":"GroupClause_repetition_plus0","66":"GroupCondition","67":"BuiltInCall","68":"FunctionCall","69":"HavingClause","70":"HAVING","71":"HavingClause_repetition_plus0","72":"OrderClause","73":"ORDER","74":"OrderClause_repetition_plus0","75":"OrderCondition","76":"ASC","77":"BrackettedExpression","78":"DESC","79":"Constraint","80":"LimitOffsetClauses","81":"LIMIT","82":"INTEGER","83":"OFFSET","84":"ValuesClause","85":"VALUES","86":"InlineData","87":"VAR","88":"InlineData_repetition0","89":"NIL","90":"InlineData_repetition1","91":"InlineData_repetition_plus2","92":"InlineData_repetition3","93":"DataBlock","94":"DataBlockValueList","95":"DataBlockValueList_repetition_plus0","96":"Update","97":"Update_repetition0","98":"Update1","99":"Update_option0","100":"LOAD","101":"Update1_option0","102":"Update1_option1","103":"Update1_group0","104":"Update1_option2","105":"GraphRefAll","106":"Update1_group1","107":"Update1_option3","108":"GraphOrDefault","109":"TO","110":"CREATE","111":"Update1_option4","112":"GRAPH","113":"INSERTDATA","114":"QuadPattern","115":"DELETEDATA","116":"DELETEWHERE","117":"Update1_option5","118":"InsertDeleteClause","119":"Update1_repetition0","120":"IntoGraphClause","121":"INTO","122":"GraphRef","123":"DELETE","124":"InsertDeleteClause_option0","125":"InsertClause","126":"INSERT","127":"UsingClause","128":"USING","129":"UsingClause_option0","130":"WithClause","131":"WITH","132":"DEFAULT","133":"GraphOrDefault_option0","134":"GraphRefAll_group0","135":"Quads","136":"Quads_option0","137":"Quads_repetition0","138":"QuadsNotTriples","139":"VarOrIri","140":"QuadsNotTriples_option0","141":"QuadsNotTriples_option1","142":"QuadsNotTriples_option2","143":"TriplesTemplate","144":"TriplesTemplate_repetition0","145":"TriplesSameSubject","146":"TriplesTemplate_option0","147":"GroupGraphPatternSub","148":"GroupGraphPatternSub_option0","149":"GroupGraphPatternSub_repetition0","150":"GroupGraphPatternSubTail","151":"GraphPatternNotTriples","152":"GroupGraphPatternSubTail_option0","153":"GroupGraphPatternSubTail_option1","154":"TriplesBlock","155":"TriplesBlock_repetition0","156":"TriplesSameSubjectPath","157":"TriplesBlock_option0","158":"GroupOrUnionGraphPattern","159":"OPTIONAL","160":"MINUS","161":"SERVICE","162":"GraphPatternNotTriples_option0","163":"FILTER","164":"BIND","165":"InlineDataOneVar","166":"InlineDataFull","167":"InlineDataOneVar_repetition0","168":"InlineDataFull_repetition0","169":"InlineDataFull_repetition_plus1","170":"InlineDataFull_repetition2","171":"DataBlockValue","172":"Literal","173":"QuotedTriple","174":"UNDEF","175":"GroupOrUnionGraphPattern_repetition0","176":"ArgList","177":"ArgList_option0","178":"ArgList_repetition0","179":"ExpressionList","180":"ExpressionList_repetition0","181":"ConstructTemplate_option0","182":"ConstructTriples","183":"ConstructTriples_repetition0","184":"ConstructTriples_option0","185":"VarOrTermOrQuotedTP","186":"PropertyListNotEmpty","187":"TriplesNode","188":"PropertyList","189":"PropertyList_option0","190":"VerbObjectList","191":"PropertyListNotEmpty_repetition0","192":"SemiOptionalVerbObjectList","193":";","194":"SemiOptionalVerbObjectList_option0","195":"Verb","196":"ObjectList","197":"a","198":"ObjectList_repetition0","199":"Object","200":"GraphNode","201":"Object_option0","202":"PropertyListPathNotEmpty","203":"TriplesNodePath","204":"TriplesSameSubjectPath_option0","205":"O","206":"PropertyListPathNotEmpty_repetition0","207":"PropertyListPathNotEmptyTail","208":"O_group0","209":"ObjectListPath","210":"ObjectListPath_repetition0","211":"ObjectPath","212":"GraphNodePath","213":"ObjectPath_option0","214":"Path","215":"Path_repetition0","216":"PathSequence","217":"PathSequence_repetition0","218":"PathEltOrInverse","219":"PathElt","220":"PathPrimary","221":"PathElt_option0","222":"PathEltOrInverse_option0","223":"IriOrA","224":"!","225":"PathNegatedPropertySet","226":"PathOneInPropertySet","227":"PathNegatedPropertySet_repetition0","228":"PathNegatedPropertySet_option0","229":"^","230":"TriplesNode_repetition_plus0","231":"[","232":"]","233":"TriplesNodePath_repetition_plus0","234":"VarOrTermOrQuotedTPExpr","235":"VarOrTerm","236":"GraphTerm","237":"BlankNode","238":"ConditionalOrExpression","239":"ConditionalAndExpression","240":"ConditionalOrExpression_repetition0","241":"ConditionalOrExpressionTail","242":"||","243":"RelationalExpression","244":"ConditionalAndExpression_repetition0","245":"ConditionalAndExpressionTail","246":"&&","247":"NumericExpression","248":"RelationalExpression_group0","249":"RelationalExpression_option0","250":"IN","251":"MultiplicativeExpression","252":"NumericExpression_repetition0","253":"AdditiveExpressionTail","254":"AdditiveExpressionTail_group0","255":"NumericLiteralPositive","256":"AdditiveExpressionTail_repetition0","257":"NumericLiteralNegative","258":"AdditiveExpressionTail_repetition1","259":"UnaryExpression","260":"MultiplicativeExpression_repetition0","261":"MultiplicativeExpressionTail","262":"MultiplicativeExpressionTail_group0","263":"+","264":"PrimaryExpression","265":"-","266":"ExprQuotedTP","267":"Aggregate","268":"FUNC_ARITY0","269":"FUNC_ARITY1","270":"FUNC_ARITY1_SPARQL_STAR","271":"FUNC_ARITY2","272":",","273":"FUNC_ARITY3","274":"FUNC_ARITY3_SPARQL_STAR","275":"BuiltInCall_group0","276":"BOUND","277":"BNODE","278":"BuiltInCall_option0","279":"EXISTS","280":"COUNT","281":"Aggregate_option0","282":"Aggregate_group0","283":"FUNC_AGGREGATE","284":"Aggregate_option1","285":"GROUP_CONCAT","286":"Aggregate_option2","287":"Aggregate_option3","288":"GroupConcatSeparator","289":"SEPARATOR","290":"=","291":"String","292":"LANGTAG","293":"^^","294":"DECIMAL","295":"DOUBLE","296":"BOOLEAN","297":"INTEGER_POSITIVE","298":"DECIMAL_POSITIVE","299":"DOUBLE_POSITIVE","300":"INTEGER_NEGATIVE","301":"DECIMAL_NEGATIVE","302":"DOUBLE_NEGATIVE","303":"STRING_LITERAL1","304":"STRING_LITERAL2","305":"STRING_LITERAL_LONG1","306":"STRING_LITERAL_LONG2","307":"PrefixedName","308":"PNAME_LN","309":"BLANK_NODE_LABEL","310":"ANON","311":"QuotedTP","312":"<<","313":"qtSubjectOrObject","314":">>","315":"DataValueTerm","316":"AnnotationPattern","317":"{|","318":"|}","319":"AnnotationPatternPath","320":"ExprVarOrTerm","321":"QueryOrUpdate_group0_option0","322":"Prologue_repetition0_group0","323":"Qry_group0_repetition_plus0","324":"SelectClauseBase_option0_group0","325":"DISTINCT","326":"REDUCED","327":"NAMED","328":"SILENT","329":"CLEAR","330":"DROP","331":"ADD","332":"MOVE","333":"COPY","334":"ALL","335":".","336":"UNION","337":"|","338":"/","339":"PathElt_option0_group0","340":"?","341":"!=","342":"<","343":">","344":"<=","345":">=","346":"NOT","347":"CONCAT","348":"COALESCE","349":"SUBSTR","350":"REGEX","351":"REPLACE"},
terminals_: {2:"error",6:"EOF",12:"BASE",13:"IRIREF",15:"PREFIX",16:"PNAME_NS",24:"CONSTRUCT",28:"WHERE",29:"{",31:"}",32:"DESCRIBE",36:"ASK",39:"*",41:"SELECT",45:"(",47:"AS",48:")",53:"FROM",63:"GROUP",64:"BY",70:"HAVING",73:"ORDER",76:"ASC",78:"DESC",81:"LIMIT",82:"INTEGER",83:"OFFSET",85:"VALUES",87:"VAR",89:"NIL",100:"LOAD",109:"TO",110:"CREATE",112:"GRAPH",113:"INSERTDATA",115:"DELETEDATA",116:"DELETEWHERE",121:"INTO",123:"DELETE",126:"INSERT",128:"USING",131:"WITH",132:"DEFAULT",159:"OPTIONAL",160:"MINUS",161:"SERVICE",163:"FILTER",164:"BIND",174:"UNDEF",193:";",197:"a",224:"!",229:"^",231:"[",232:"]",242:"||",246:"&&",250:"IN",263:"+",265:"-",268:"FUNC_ARITY0",269:"FUNC_ARITY1",270:"FUNC_ARITY1_SPARQL_STAR",271:"FUNC_ARITY2",272:",",273:"FUNC_ARITY3",274:"FUNC_ARITY3_SPARQL_STAR",276:"BOUND",277:"BNODE",279:"EXISTS",280:"COUNT",283:"FUNC_AGGREGATE",285:"GROUP_CONCAT",289:"SEPARATOR",290:"=",292:"LANGTAG",293:"^^",294:"DECIMAL",295:"DOUBLE",296:"BOOLEAN",297:"INTEGER_POSITIVE",298:"DECIMAL_POSITIVE",299:"DOUBLE_POSITIVE",300:"INTEGER_NEGATIVE",301:"DECIMAL_NEGATIVE",302:"DOUBLE_NEGATIVE",303:"STRING_LITERAL1",304:"STRING_LITERAL2",305:"STRING_LITERAL_LONG1",306:"STRING_LITERAL_LONG2",308:"PNAME_LN",309:"BLANK_NODE_LABEL",310:"ANON",312:"<<",314:">>",317:"{|",318:"|}",325:"DISTINCT",326:"REDUCED",327:"NAMED",328:"SILENT",329:"CLEAR",330:"DROP",331:"ADD",332:"MOVE",333:"COPY",334:"ALL",335:".",336:"UNION",337:"|",338:"/",340:"?",341:"!=",342:"<",343:">",344:"<=",345:">=",346:"NOT",347:"CONCAT",348:"COALESCE",349:"SUBSTR",350:"REGEX",351:"REPLACE"},
productions_: [0,[3,3],[7,2],[4,1],[11,2],[14,3],[8,4],[8,4],[8,5],[8,7],[8,5],[8,4],[17,2],[21,2],[38,2],[43,1],[43,5],[49,4],[49,4],[52,3],[19,2],[23,2],[20,3],[62,3],[66,1],[66,1],[66,3],[66,5],[66,1],[69,2],[72,3],[75,2],[75,2],[75,1],[75,1],[80,2],[80,2],[80,4],[80,4],[84,2],[86,4],[86,4],[86,6],[86,2],[94,3],[96,3],[98,4],[98,3],[98,5],[98,4],[98,2],[98,2],[98,2],[98,5],[120,2],[118,3],[118,1],[125,2],[127,3],[130,2],[108,1],[108,2],[122,2],[105,1],[105,1],[114,3],[135,2],[138,7],[143,3],[57,3],[57,3],[147,2],[150,3],[154,3],[151,1],[151,2],[151,2],[151,3],[151,4],[151,2],[151,6],[151,1],[93,1],[93,1],[165,4],[166,4],[166,6],[171,1],[171,1],[171,1],[171,1],[158,2],[79,1],[79,1],[79,1],[68,2],[176,1],[176,5],[179,1],[179,4],[25,3],[182,3],[145,2],[145,2],[188,1],[186,2],[192,2],[190,2],[195,1],[195,1],[196,2],[199,2],[156,2],[156,2],[202,2],[207,1],[207,2],[205,2],[209,2],[211,2],[214,2],[216,2],[219,2],[218,2],[220,1],[220,2],[220,3],[225,1],[225,1],[225,4],[226,1],[226,2],[187,3],[187,3],[203,3],[203,3],[200,1],[200,1],[212,1],[212,1],[234,1],[235,1],[235,1],[139,1],[139,1],[44,1],[236,1],[236,1],[236,1],[236,1],[46,1],[238,2],[241,2],[239,2],[245,2],[243,1],[243,3],[243,4],[247,2],[253,2],[253,2],[253,2],[251,2],[261,2],[259,2],[259,2],[259,2],[259,1],[264,1],[264,1],[264,1],[264,1],[264,1],[264,1],[264,1],[77,3],[67,1],[67,2],[67,4],[67,4],[67,6],[67,8],[67,8],[67,2],[67,4],[67,2],[67,4],[67,3],[267,5],[267,5],[267,6],[288,4],[172,1],[172,2],[172,3],[172,1],[172,1],[172,1],[172,1],[172,1],[172,1],[255,1],[255,1],[255,1],[257,1],[257,1],[257,1],[291,1],[291,1],[291,1],[291,1],[55,1],[55,1],[307,1],[307,1],[237,1],[237,1],[311,5],[173,5],[313,1],[313,1],[313,1],[313,1],[313,1],[315,1],[315,1],[315,1],[185,1],[185,1],[185,1],[316,3],[319,3],[266,5],[320,1],[320,1],[320,1],[223,1],[223,1],[321,0],[321,1],[5,1],[5,1],[5,1],[9,0],[9,1],[322,1],[322,1],[10,0],[10,2],[18,0],[18,2],[22,0],[22,2],[26,0],[26,2],[27,0],[27,2],[30,0],[30,1],[323,1],[323,2],[33,1],[33,1],[34,0],[34,2],[35,0],[35,1],[37,0],[37,2],[40,1],[40,2],[324,1],[324,1],[42,0],[42,1],[50,0],[50,1],[51,0],[51,1],[54,0],[54,1],[56,0],[56,1],[58,0],[58,1],[59,0],[59,1],[60,0],[60,1],[61,0],[61,1],[65,1],[65,2],[71,1],[71,2],[74,1],[74,2],[88,0],[88,2],[90,0],[90,2],[91,1],[91,2],[92,0],[92,2],[95,1],[95,2],[97,0],[97,4],[99,0],[99,2],[101,0],[101,1],[102,0],[102,1],[103,1],[103,1],[104,0],[104,1],[106,1],[106,1],[106,1],[107,0],[107,1],[111,0],[111,1],[117,0],[117,1],[119,0],[119,2],[124,0],[124,1],[129,0],[129,1],[133,0],[133,1],[134,1],[134,1],[134,1],[136,0],[136,1],[137,0],[137,2],[140,0],[140,1],[141,0],[141,1],[142,0],[142,1],[144,0],[144,3],[146,0],[146,1],[148,0],[148,1],[149,0],[149,2],[152,0],[152,1],[153,0],[153,1],[155,0],[155,3],[157,0],[157,1],[162,0],[162,1],[167,0],[167,2],[168,0],[168,2],[169,1],[169,2],[170,0],[170,2],[175,0],[175,3],[177,0],[177,1],[178,0],[178,3],[180,0],[180,3],[181,0],[181,1],[183,0],[183,3],[184,0],[184,1],[189,0],[189,1],[191,0],[191,2],[194,0],[194,1],[198,0],[198,3],[201,0],[201,1],[204,0],[204,1],[206,0],[206,2],[208,1],[208,1],[210,0],[210,3],[213,0],[213,1],[215,0],[215,3],[217,0],[217,3],[339,1],[339,1],[339,1],[221,0],[221,1],[222,0],[222,1],[227,0],[227,3],[228,0],[228,1],[230,1],[230,2],[233,1],[233,2],[240,0],[240,2],[244,0],[244,2],[248,1],[248,1],[248,1],[248,1],[248,1],[248,1],[249,0],[249,1],[252,0],[252,2],[254,1],[254,1],[256,0],[256,2],[258,0],[258,2],[260,0],[260,2],[262,1],[262,1],[275,1],[275,1],[275,1],[275,1],[275,1],[278,0],[278,1],[281,0],[281,1],[282,1],[282,1],[284,0],[284,1],[286,0],[286,1],[287,0],[287,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

      // Set parser options
      $$[$0-1] = $$[$0-1] || {};
      if (Parser.base)
        $$[$0-1].base = Parser.base;
      Parser.base = '';
      $$[$0-1].prefixes = Parser.prefixes;
      Parser.prefixes = null;
      Parser.contextTriples = null;

      if (Parser.pathOnly) {
        if ($$[$0-1].type === 'path' || 'termType' in $$[$0-1]) {
          return $$[$0-1]
        }
        throw new Error('Received full SPARQL query in path only mode');
      } else if ($$[$0-1].type === 'path' || 'termType' in $$[$0-1]) {
        throw new Error('Received only path in full SPARQL mode');
      }

      // Ensure that blank nodes are not used across INSERT DATA clauses
      if ($$[$0-1].type === 'update') {
        const insertBnodesAll = {};
        for (const update of $$[$0-1].updates) {
          if (update.updateType === 'insert') {
            // Collect bnodes for current insert clause
            const insertBnodes = {};
            for (const operation of update.insert) {
              if (operation.type === 'bgp' || operation.type === 'graph') {
                for (const triple of operation.triples) {
                  if (triple.subject.termType === 'BlankNode')
                    insertBnodes[triple.subject.value] = true;
                  if (triple.predicate.termType === 'BlankNode')
                    insertBnodes[triple.predicate.value] = true;
                  if (triple.object.termType === 'BlankNode')
                    insertBnodes[triple.object.value] = true;
                }
              }
            }

            // Check if the inserting bnodes don't clash with bnodes from a previous insert clause
            for (const bnode of Object.keys(insertBnodes)) {
              if (insertBnodesAll[bnode]) {
                throw new Error('Detected reuse blank node across different INSERT DATA clauses');
              }
              insertBnodesAll[bnode] = true;
            }
          }
        }
      }
      return $$[$0-1];
    
break;
case 2:
this.$ = { ...$$[$0-1], ...$$[$0], type: 'query' };
break;
case 4:

      Parser.base = resolveIRI($$[$0])
    
break;
case 5:

      if (!Parser.prefixes) Parser.prefixes = {};
      $$[$0-1] = $$[$0-1].substr(0, $$[$0-1].length - 1);
      $$[$0] = resolveIRI($$[$0]);
      Parser.prefixes[$$[$0-1]] = $$[$0];
    
break;
case 6:
this.$ = { ...$$[$0-3], ...groupDatasets($$[$0-2]), ...$$[$0-1], ...$$[$0] };
break;
case 7:

      // Check for projection of ungrouped variable
      if (!Parser.skipValidation) {
        const counts = flatten($$[$0-3].variables.map(vars => getAggregatesOfExpression(vars.expression)))
          .some(agg => agg.aggregation === "count" && !(agg.expression instanceof Wildcard));
        if (counts || $$[$0].group) {
          for (const selectVar of $$[$0-3].variables) {
            if (selectVar.termType === "Variable") {
              if (!$$[$0].group || !$$[$0].group.map(groupVar => getExpressionId(groupVar)).includes(getExpressionId(selectVar))) {
                throw Error("Projection of ungrouped variable (?" + getExpressionId(selectVar) + ")");
              }
            } else if (getAggregatesOfExpression(selectVar.expression).length === 0) {
              const usedVars = getVariablesFromExpression(selectVar.expression);
              for (const usedVar of usedVars) {
                if (!$$[$0].group || !$$[$0].group.map || !$$[$0].group.map(groupVar => getExpressionId(groupVar)).includes(getExpressionId(usedVar))) {
                  throw Error("Use of ungrouped variable in projection of operation (?" + getExpressionId(usedVar) + ")");
                }
              }
            }
          }
        }
      }
      // Check if id of each AS-selected column is not yet bound by subquery
      const subqueries = $$[$0-1].where.filter(w => w.type === "query");
      if (subqueries.length > 0) {
        const selectedVarIds = $$[$0-3].variables.filter(v => v.variable && v.variable.value).map(v => v.variable.value);
        const subqueryIds = flatten(subqueries.map(sub => sub.variables)).map(v => v.value || v.variable.value);
        for (const selectedVarId of selectedVarIds) {
          if (subqueryIds.indexOf(selectedVarId) >= 0) {
            throw Error("Target id of 'AS' (?" + selectedVarId + ") already used in subquery");
          }
        }
      }
      this.$ = extend($$[$0-3], groupDatasets($$[$0-2]), $$[$0-1], $$[$0])
    
break;
case 8:
this.$ = extend({ queryType: 'CONSTRUCT', template: $$[$0-3] }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 9:
this.$ = extend({ queryType: 'CONSTRUCT', template: $$[$0-2] = ($$[$0-2] ? $$[$0-2].triples : []) }, groupDatasets($$[$0-5]), { where: [ { type: 'bgp', triples: appendAllTo([], $$[$0-2]) } ] }, $$[$0]);
break;
case 10:
this.$ = extend({ queryType: 'DESCRIBE', variables: $$[$0-3] === '*' ? [new Wildcard()] : $$[$0-3] }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 11:
this.$ = extend({ queryType: 'ASK' }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 12:
this.$ = extend($$[$0-1], {variables: [new Wildcard()]});
break;
case 13:

      // Check if id of each selected column is different
      const selectedVarIds = $$[$0].map(v => v.value || v.variable.value);
      const duplicates = getDuplicatesInArray(selectedVarIds);
      if (duplicates.length > 0) {
        throw Error("Two or more of the resulting columns have the same name (?" + duplicates[0] + ")");
      }

      this.$ = extend($$[$0-1], { variables: $$[$0] })
    
break;
case 14:
this.$ = extend({ queryType: 'SELECT'}, $$[$0] && ($$[$0-1] = lowercase($$[$0]), $$[$0] = {}, $$[$0][$$[$0-1]] = true, $$[$0]));
break;
case 16: case 27:
this.$ = expression($$[$0-3], { variable: $$[$0-1] });
break;
case 17: case 18:
this.$ = extend($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], { type: 'query' });
break;
case 19: case 58:
this.$ = { iri: $$[$0], named: !!$$[$0-1] };
break;
case 20:
this.$ = { where: $$[$0].patterns };
break;
case 21:
this.$ = extend($$[$0-1], $$[$0]);
break;
case 22:
this.$ = extend($$[$0-2], $$[$0-1], $$[$0]);
break;
case 23:
this.$ = { group: $$[$0] };
break;
case 24: case 25: case 28: case 31: case 33: case 34:
this.$ = expression($$[$0]);
break;
case 26:
this.$ = expression($$[$0-1]);
break;
case 29:
this.$ = { having: $$[$0] };
break;
case 30:
this.$ = { order: $$[$0] };
break;
case 32:
this.$ = expression($$[$0], { descending: true });
break;
case 35:
this.$ = { limit: toInt($$[$0]) };
break;
case 36:
this.$ = { offset: toInt($$[$0]) };
break;
case 37:
this.$ = { limit: toInt($$[$0-2]), offset: toInt($$[$0]) };
break;
case 38:
this.$ = { limit: toInt($$[$0]), offset: toInt($$[$0-2]) };
break;
case 39: case 43:
this.$ = { type: 'values', values: $$[$0] };
break;
case 40: case 84:
this.$ = $$[$0-1].map(v => ({ [$$[$0-3]]: v }));
break;
case 41: case 85:
this.$ = $$[$0-1].map(() => ({}));
break;
case 42: case 86:

      var length = $$[$0-4].length;
      $$[$0-4] = $$[$0-4].map(toVar);
      this.$ = $$[$0-1].map(function (values) {
        if (values.length !== length)
          throw Error('Inconsistent VALUES length');
        var valuesObject = {};
        for(var i = 0; i<length; i++)
          valuesObject['?' + $$[$0-4][i].value] = values[i];
        return valuesObject;
      });
    
break;
case 44: case 65: case 100: case 126: case 175:
this.$ = $$[$0-1];
break;
case 45:
this.$ = { type: 'update', updates: appendTo($$[$0-2], $$[$0-1]) };
break;
case 46:
this.$ = extend({ type: 'load', silent: !!$$[$0-2], source: $$[$0-1] }, $$[$0] && { destination: $$[$0] });
break;
case 47:
this.$ = { type: lowercase($$[$0-2]), silent: !!$$[$0-1], graph: $$[$0] };
break;
case 48:
this.$ = { type: lowercase($$[$0-4]), silent: !!$$[$0-3], source: $$[$0-2], destination: $$[$0] };
break;
case 49:
this.$ = { type: 'create', silent: !!$$[$0-2], graph: { type: 'graph', name: $$[$0] } };
break;
case 50:
this.$ = { updateType: 'insert',      insert: ensureNoVariables($$[$0])                 };
break;
case 51:
this.$ = { updateType: 'delete',      delete: ensureNoBnodes(ensureNoVariables($$[$0])) };
break;
case 52:
this.$ = { updateType: 'deletewhere', delete: ensureNoBnodes($$[$0])                    };
break;
case 53:
this.$ = { updateType: 'insertdelete', ...$$[$0-4], ...$$[$0-3], ...groupDatasets($$[$0-2], 'using'), where: $$[$0].patterns };
break;
case 54: case 57: case 62: case 167: case 191: case 236:
this.$ = $$[$0];
break;
case 55:
this.$ = { delete: ensureNoBnodes($$[$0-1]), insert: $$[$0] || [] };
break;
case 56:
this.$ = { delete: [], insert: $$[$0] };
break;
case 59:
this.$ = { graph: $$[$0] };
break;
case 60:
this.$ = { type: 'graph', default: true };
break;
case 61: case 63:
this.$ = { type: 'graph', name: $$[$0] };
break;
case 64:
this.$ = { [lowercase($$[$0])]: true };
break;
case 66:
this.$ = $$[$0-1] ? unionAll($$[$0], [$$[$0-1]]) : unionAll($$[$0]);
break;
case 67:

      var graph = extend($$[$0-3] || { triples: [] }, { type: 'graph', name: $$[$0-5] });
      this.$ = $$[$0] ? [graph, $$[$0]] : [graph];
    
break;
case 68: case 73:
this.$ = { type: 'bgp', triples: unionAll($$[$0-2], [$$[$0-1]]) };
break;
case 69:
this.$ = { type: 'group', patterns: [ $$[$0-1] ] };
break;
case 70:

      // For every binding
      for (const binding of $$[$0-1].filter(el => el.type === "bind")) {
        const index = $$[$0-1].indexOf(binding);
        const boundVars = new Set();
        //Collect all bounded variables before the binding
        for (const el of $$[$0-1].slice(0, index)) {
          if (el.type === "group" || el.type === "bgp") {
            getBoundVarsFromGroupGraphPattern(el).forEach(boundVar => boundVars.add(boundVar));
          }
        }
        // If binding with a non-free variable, throw error
        if (boundVars.has(binding.variable.value)) {
          throw Error("Variable used to bind is already bound (?" + binding.variable.value + ")");
        }
      }
      this.$ = { type: 'group', patterns: $$[$0-1] }
    
break;
case 71:
this.$ = $$[$0-1] ? unionAll([$$[$0-1]], $$[$0]) : unionAll($$[$0]);
break;
case 72:
this.$ = $$[$0] ? [$$[$0-2], $$[$0]] : $$[$0-2];
break;
case 75:
this.$ = extend($$[$0], { type: 'optional' });
break;
case 76:
this.$ = extend($$[$0], { type: 'minus' });
break;
case 77:
this.$ = extend($$[$0], { type: 'graph', name: $$[$0-1] });
break;
case 78:
this.$ = extend($$[$0], { type: 'service', name: $$[$0-1], silent: !!$$[$0-2] });
break;
case 79:
this.$ = { type: 'filter', expression: $$[$0] };
break;
case 80:
this.$ = { type: 'bind', variable: $$[$0-1], expression: $$[$0-3] };
break;
case 89:
this.$ = ensureSparqlStar($$[$0]);
break;
case 90:
this.$ = undefined;
break;
case 91:
this.$ = $$[$0-1].length ? { type: 'union', patterns: unionAll($$[$0-1].map(degroupSingle), [degroupSingle($$[$0])]) } : $$[$0];
break;
case 95:
this.$ = { ...$$[$0], function: $$[$0-1] };
break;
case 96:
this.$ = { type: 'functionCall', args: [] };
break;
case 97:
this.$ = { type: 'functionCall', args: appendTo($$[$0-2], $$[$0-1]), distinct: !!$$[$0-3] };
break;
case 98: case 115: case 128: case 247: case 249: case 251: case 253: case 255: case 263: case 267: case 297: case 299: case 303: case 307: case 328: case 341: case 349: case 355: case 361: case 367: case 369: case 373: case 375: case 379: case 381: case 385: case 391: case 395: case 401: case 405: case 409: case 411: case 420: case 428: case 430: case 440: case 444: case 446: case 448:
this.$ = [];
// console.debug(yystate, $$.slice());
break;
case 99:
this.$ = appendTo($$[$0-2], $$[$0-1]);
break;
case 101:
this.$ = unionAll($$[$0-2], [$$[$0-1]]);
break;
case 102: case 112:
this.$ = applyAnnotations($$[$0].map(t => extend(triple($$[$0-1]), t)));
if (!Parser.contextTriples) Parser.contextTriples = [];
Parser.contextTriples = Parser.contextTriples.concat(this.$);
break;
case 103:
this.$ = applyAnnotations(appendAllTo($$[$0].map(t => extend(triple($$[$0-1].entity), t)), $$[$0-1].triples)) /* the subject is a blank node, possibly with more triples */;
break;
case 105:
this.$ = unionAll([$$[$0-1]], $$[$0]);
break;
case 106:
this.$ = unionAll($$[$0]);
break;
case 107:
this.$ = objectListToTriples($$[$0-1], $$[$0]);
break;
case 109: case 237:
this.$ = Parser.factory.namedNode(RDF_TYPE);
break;
case 110: case 118:
this.$ = appendTo($$[$0-1], $$[$0]);
break;
case 111:
this.$ = $$[$0] ? { annotation: $$[$0], object: $$[$0-1] } : $$[$0-1];
break;
case 113:
this.$ = !$$[$0] ? $$[$0-1].triples : applyAnnotations(appendAllTo($$[$0].map(t => extend(triple($$[$0-1].entity), t)), $$[$0-1].triples)) /* the subject is a blank node, possibly with more triples */;
break;
case 114:
this.$ = objectListToTriples(...$$[$0-1], $$[$0]);
break;
case 116:
this.$ = objectListToTriples(...$$[$0]);
break;
case 117: case 159: case 163:
this.$ = [$$[$0-1], $$[$0]];
break;
case 119:
this.$ = $$[$0] ? { object: $$[$0-1], annotation: $$[$0] } : $$[$0-1];;
break;
case 120:
this.$ = $$[$0-1].length ? path('|',appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 121:
this.$ = $$[$0-1].length ? path('/', appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 122:
this.$ = $$[$0] ? path($$[$0], [$$[$0-1]]) : $$[$0-1];
break;
case 123:
this.$ = $$[$0-1] ? path($$[$0-1], [$$[$0]]) : $$[$0];;
break;
case 125: case 131:
this.$ = path($$[$0-1], [$$[$0]]);
break;
case 129:
this.$ = path('|', appendTo($$[$0-2], $$[$0-1]));
break;
case 132: case 134:
this.$ = createList($$[$0-1]);
break;
case 133: case 135:
this.$ = createAnonymousObject($$[$0-1]);
break;
case 140:
this.$ = { entity: $$[$0], triples: [] };
break;
case 145:
this.$ = toVar($$[$0]);
break;
case 149:
this.$ = Parser.factory.namedNode(RDF_NIL);
break;
case 151: case 153: case 158: case 162:
this.$ = createOperationTree($$[$0-1], $$[$0]);
break;
case 152:
this.$ = ['||', $$[$0]];
break;
case 154:
this.$ = ['&&', $$[$0]];
break;
case 156:
this.$ = operation($$[$0-1], [$$[$0-2], $$[$0]]);
break;
case 157:
this.$ = operation($$[$0-2] ? 'notin' : 'in', [$$[$0-3], $$[$0]]);
break;
case 160:
this.$ = ['+', createOperationTree($$[$0-1], $$[$0])];
break;
case 161:

      var negatedLiteral = createTypedLiteral($$[$0-1].value.replace('-', ''), $$[$0-1].datatype);
      this.$ = ['-', createOperationTree(negatedLiteral, $$[$0])];
    
break;
case 164:
this.$ = operation('UPLUS', [$$[$0]]);
break;
case 165:
this.$ = operation($$[$0-1], [$$[$0]]);
break;
case 166:
this.$ = operation('UMINUS', [$$[$0]]);
break;
case 177:
this.$ = operation(lowercase($$[$0-1]));
break;
case 178:
this.$ = operation(lowercase($$[$0-3]), [$$[$0-1]]);
break;
case 179:
this.$ = ensureSparqlStar(operation(lowercase($$[$0-3]), [$$[$0-1]]));
break;
case 180:
this.$ = operation(lowercase($$[$0-5]), [$$[$0-3], $$[$0-1]]);
break;
case 181:
this.$ = operation(lowercase($$[$0-7]), [$$[$0-5], $$[$0-3], $$[$0-1]]);
break;
case 182:
this.$ = ensureSparqlStar(operation(lowercase($$[$0-7]), [$$[$0-5], $$[$0-3], $$[$0-1]]));
break;
case 183:
this.$ = operation(lowercase($$[$0-1]), $$[$0]);
break;
case 184:
this.$ = operation('bound', [toVar($$[$0-1])]);
break;
case 185:
this.$ = operation($$[$0-1], []);
break;
case 186:
this.$ = operation($$[$0-3], [$$[$0-1]]);
break;
case 187:
this.$ = operation($$[$0-2] ? 'notexists' :'exists', [degroupSingle($$[$0])]);
break;
case 188: case 189:
this.$ = expression($$[$0-1], { type: 'aggregate', aggregation: lowercase($$[$0-4]), distinct: !!$$[$0-2] });
break;
case 190:
this.$ = expression($$[$0-2], { type: 'aggregate', aggregation: lowercase($$[$0-5]), distinct: !!$$[$0-3], separator: typeof $$[$0-1] === 'string' ? $$[$0-1] : ' ' });
break;
case 192:
this.$ = createTypedLiteral($$[$0]);
break;
case 193:
this.$ = createLangLiteral($$[$0-1], lowercase($$[$0].substr(1)));
break;
case 194:
this.$ = createTypedLiteral($$[$0-2], $$[$0]);
break;
case 195: case 204:
this.$ = createTypedLiteral($$[$0], XSD_INTEGER);
break;
case 196: case 205:
this.$ = createTypedLiteral($$[$0], XSD_DECIMAL);
break;
case 197: case 206:
this.$ = createTypedLiteral(lowercase($$[$0]), XSD_DOUBLE);
break;
case 200:
this.$ = createTypedLiteral($$[$0].toLowerCase(), XSD_BOOLEAN);
break;
case 201:
this.$ = createTypedLiteral($$[$0].substr(1), XSD_INTEGER);
break;
case 202:
this.$ = createTypedLiteral($$[$0].substr(1), XSD_DECIMAL);
break;
case 203:
this.$ = createTypedLiteral($$[$0].substr(1).toLowerCase(), XSD_DOUBLE);
break;
case 207: case 208:
this.$ = unescapeString($$[$0], 1);
break;
case 209: case 210:
this.$ = unescapeString($$[$0], 3);
break;
case 211:
this.$ = Parser.factory.namedNode(resolveIRI($$[$0]));
break;
case 213:

      var namePos = $$[$0].indexOf(':'),
          prefix = $$[$0].substr(0, namePos),
          expansion = Parser.prefixes[prefix];
      if (!expansion) throw new Error('Unknown prefix: ' + prefix);
      var uriString = resolveIRI(expansion + $$[$0].substr(namePos + 1));
      this.$ = Parser.factory.namedNode(uriString);
    
break;
case 214:

      $$[$0] = $$[$0].substr(0, $$[$0].length - 1);
      if (!($$[$0] in Parser.prefixes)) throw new Error('Unknown prefix: ' + $$[$0]);
      var uriString = resolveIRI(Parser.prefixes[$$[$0]]);
      this.$ = Parser.factory.namedNode(uriString);
    
break;
case 215:
this.$ = blank($$[$0].replace(/^(_:)/,''));;
break;
case 216:
this.$ = blank();
break;
case 217: case 218: case 232:
this.$ = ensureSparqlStar(nestedTriple($$[$0-3], $$[$0-2], $$[$0-1]));
break;
case 230: case 231:
this.$ = ensureSparqlStar($$[$0-1]);
break;
case 248: case 250: case 252: case 254: case 256: case 260: case 264: case 268: case 270: case 292: case 294: case 296: case 298: case 300: case 302: case 304: case 306: case 329: case 342: case 356: case 368: case 370: case 372: case 374: case 392: case 402: case 425: case 427: case 429: case 431: case 441: case 445: case 447: case 449:
$$[$0-1].push($$[$0]);
break;
case 259: case 269: case 291: case 293: case 295: case 301: case 305: case 371: case 424: case 426:
this.$ = [$$[$0]];
break;
case 308:
$$[$0-3].push($$[$0-2]);
break;
case 350: case 362: case 376: case 380: case 382: case 386: case 396: case 406: case 410: case 412: case 421:
$$[$0-2].push($$[$0-1]);
// console.debug(yystate, $$.slice());
break;
}
},
table: [o($V0,$V1,{3:1,4:2,10:3}),{1:[3]},o($V2,[2,307],{5:4,7:5,321:6,214:7,8:8,96:9,215:10,17:11,21:12,97:16,38:17,6:[2,238],13:$V3,16:$V3,45:$V3,197:$V3,224:$V3,229:$V3,308:$V3,24:[1,13],32:[1,14],36:[1,15],41:$V4}),o([6,13,16,24,32,36,41,45,100,110,113,115,116,123,126,131,197,224,229,308,329,330,331,332,333],[2,3],{322:19,11:20,14:21,12:[1,22],15:[1,23]}),{6:[1,24]},{6:[2,240]},{6:[2,241]},{6:[2,242]},{6:[2,243],9:25,84:26,85:$V5},{6:[2,239]},o($V6,[2,411],{216:28,217:29}),o($V7,[2,249],{18:30}),o($V7,[2,251],{22:31}),o($V8,[2,255],{25:32,27:33,29:[1,34]}),{13:$V9,16:$Va,33:35,39:[1,37],44:39,55:40,87:$Vb,139:38,307:43,308:$Vc,323:36},o($V7,[2,267],{37:46}),o($Vd,[2,326],{98:47,103:49,106:50,117:55,130:61,100:[1,48],110:[1,51],113:[1,52],115:[1,53],116:[1,54],131:[1,62],329:[1,56],330:[1,57],331:[1,58],332:[1,59],333:[1,60]}),{39:[1,63],40:64,43:65,44:66,45:$Ve,87:$Vb},o($Vf,[2,273],{42:68,324:69,325:[1,70],326:[1,71]}),o($V0,[2,248]),o($V0,[2,245]),o($V0,[2,246]),{13:[1,72]},{16:[1,73]},{1:[2,1]},{6:[2,2]},{6:[2,244]},{45:[1,77],85:[1,78],86:74,87:[1,75],89:[1,76]},o([6,13,16,45,48,82,87,89,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312],[2,120],{337:[1,79]}),o($Vg,[2,418],{218:80,222:81,229:[1,82]}),{19:83,28:$Vh,29:$Vi,52:84,53:$Vj,56:85},{19:88,28:$Vh,29:$Vi,52:89,53:$Vj,56:85},o($V7,[2,253],{26:90}),{28:[1,91],52:92,53:$Vj},o($Vk,[2,385],{181:93,182:94,183:95,31:[2,383]}),o($Vl,[2,263],{34:96}),o($Vl,[2,261],{44:39,55:40,307:43,139:97,13:$V9,16:$Va,87:$Vb,308:$Vc}),o($Vl,[2,262]),o($Vm,[2,259]),o($Vn,[2,143]),o($Vn,[2,144]),o([6,13,16,28,29,31,39,45,47,48,53,63,70,73,76,78,81,82,83,85,87,89,112,159,160,161,163,164,193,197,224,229,231,232,242,246,250,263,265,268,269,270,271,272,273,274,276,277,279,280,283,285,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,314,317,318,335,338,341,342,343,344,345,346,347,348,349,350,351],[2,145]),o($Vo,[2,211]),o($Vo,[2,212]),o($Vo,[2,213]),o($Vo,[2,214]),{19:98,28:$Vh,29:$Vi,52:99,53:$Vj,56:85},{6:[2,309],99:100,193:[1,101]},o($Vp,[2,311],{101:102,328:[1,103]}),o($Vq,[2,317],{104:104,328:[1,105]}),o($Vr,[2,322],{107:106,328:[1,107]}),{111:108,112:[2,324],328:[1,109]},{29:$Vs,114:110},{29:$Vs,114:112},{29:$Vs,114:113},{118:114,123:[1,115],125:116,126:$Vt},o($Vu,[2,315]),o($Vu,[2,316]),o($Vv,[2,319]),o($Vv,[2,320]),o($Vv,[2,321]),o($Vd,[2,327]),{13:$V9,16:$Va,55:118,307:43,308:$Vc},o($V7,[2,12]),o($V7,[2,13],{44:66,43:119,45:$Ve,87:$Vb}),o($Vw,[2,269]),o($Vw,[2,15]),{13:$V9,16:$Va,44:136,45:$Vx,46:120,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vf,[2,14]),o($Vf,[2,274]),o($Vf,[2,271]),o($Vf,[2,272]),o($V0,[2,4]),{13:[1,177]},o($V61,[2,39]),{29:[1,178]},{29:[1,179]},{87:[1,181],91:180},{45:[1,187],87:[1,185],89:[1,186],93:182,165:183,166:184},o($V6,[2,410]),o([6,13,16,45,48,82,87,89,231,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,337],[2,121],{338:[1,188]}),{13:$V9,16:$Va,45:[1,193],55:194,197:$V71,219:189,220:190,223:191,224:[1,192],307:43,308:$Vc},o($Vg,[2,419]),o($V81,$V91,{20:196,59:197,69:198,70:$Va1}),o($V7,[2,250]),{29:$Vb1,57:200},o($Vp,[2,279],{54:202,327:[1,203]}),{29:[2,282]},o($Vc1,$Vd1,{23:204,58:205,62:206,63:$Ve1}),o($V7,[2,252]),{19:208,28:$Vh,29:$Vi,52:209,53:$Vj,56:85},{29:[1,210]},o($V8,[2,256]),{31:[1,211]},{31:[2,384]},{13:$V9,16:$Va,44:215,45:$Vf1,55:220,82:$Vy,87:$Vb,89:$Vg1,145:212,172:221,185:213,187:214,231:$Vh1,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($Vl1,[2,265],{56:85,35:227,52:228,19:229,28:$Vh,29:$Vi,53:$Vj}),o($Vm,[2,260]),o($Vc1,$Vd1,{58:205,62:206,23:230,63:$Ve1}),o($V7,[2,268]),{6:[2,45]},o($V0,$V1,{10:3,4:231}),{13:$V9,16:$Va,55:232,307:43,308:$Vc},o($Vp,[2,312]),{105:233,112:$Vm1,122:234,132:[1,237],134:235,327:[1,238],334:[1,239]},o($Vq,[2,318]),o($Vp,$Vn1,{108:240,133:242,112:$Vo1,132:$Vp1}),o($Vr,[2,323]),{112:[1,244]},{112:[2,325]},o($Vq1,[2,50]),o($Vk,$Vr1,{135:245,136:246,143:247,144:248,31:$Vs1,112:$Vs1}),o($Vq1,[2,51]),o($Vq1,[2,52]),o($Vt1,[2,328],{119:249}),{29:$Vs,114:250},o($Vt1,[2,56]),{29:$Vs,114:251},o($Vd,[2,59]),o($Vw,[2,270]),{47:[1,252]},o($Vu1,[2,150]),o($Vv1,[2,428],{240:253}),o($Vw1,[2,430],{244:254}),o($Vw1,[2,155],{248:255,249:256,250:[2,438],290:[1,257],341:[1,258],342:[1,259],343:[1,260],344:[1,261],345:[1,262],346:[1,263]}),o($Vx1,[2,440],{252:264}),o($Vy1,[2,448],{260:265}),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,255:154,257:155,264:266,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,255:154,257:155,264:267,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,255:154,257:155,264:268,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vy1,[2,167]),o($Vy1,[2,168]),o($Vy1,[2,169]),o($Vy1,[2,170],{176:269,45:$Vz1,89:$VA1}),o($Vy1,[2,171]),o($Vy1,[2,172]),o($Vy1,[2,173]),o($Vy1,[2,174]),{13:$V9,16:$Va,44:136,45:$Vx,46:272,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VB1,[2,176]),{89:[1,273]},{45:[1,274]},{45:[1,275]},{45:[1,276]},{45:[1,277]},{45:[1,278]},{45:$VC1,89:$VD1,179:279},{45:[1,282]},{45:[1,284],89:[1,283]},{279:[1,285]},o($VE1,[2,192],{292:[1,286],293:[1,287]}),o($VE1,[2,195]),o($VE1,[2,196]),o($VE1,[2,197]),o($VE1,[2,198]),o($VE1,[2,199]),o($VE1,[2,200]),{13:$V9,16:$Va,44:39,55:40,82:$Vy,87:$Vb,139:289,172:291,255:154,257:155,266:290,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,320:288},{45:[1,292]},{45:[1,293]},{45:[1,294]},o($VF1,[2,452]),o($VF1,[2,453]),o($VF1,[2,454]),o($VF1,[2,455]),o($VF1,[2,456]),{279:[2,458]},o($VG1,[2,207]),o($VG1,[2,208]),o($VG1,[2,209]),o($VG1,[2,210]),o($VE1,[2,201]),o($VE1,[2,202]),o($VE1,[2,203]),o($VE1,[2,204]),o($VE1,[2,205]),o($VE1,[2,206]),o($V0,[2,5]),o($VH1,[2,297],{88:295}),o($VI1,[2,299],{90:296}),{48:[1,297],87:[1,298]},o($VJ1,[2,301]),o($V61,[2,43]),o($V61,[2,82]),o($V61,[2,83]),{29:[1,299]},{29:[1,300]},{87:[1,302],169:301},o($V6,[2,412]),o($VK1,[2,123]),o($VK1,[2,416],{221:303,339:304,39:[1,306],263:[1,307],340:[1,305]}),o($VL1,[2,124]),{13:$V9,16:$Va,45:[1,311],55:194,89:[1,310],197:$V71,223:312,225:308,226:309,229:$VM1,307:43,308:$Vc},o($V6,$V3,{215:10,214:314}),o($VL1,[2,236]),o($VL1,[2,237]),o($VN1,[2,6]),o($VO1,[2,287],{60:315,72:316,73:[1,317]}),o($V81,[2,286]),{13:$V9,16:$Va,45:$Vx,55:323,67:321,68:322,71:318,77:320,79:319,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,307:43,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o([6,31,63,70,73,81,83,85],[2,20]),o($Vk,$VP1,{38:17,49:324,147:325,17:326,21:327,148:328,154:329,155:330,29:$VQ1,31:$VQ1,85:$VQ1,112:$VQ1,159:$VQ1,160:$VQ1,161:$VQ1,163:$VQ1,164:$VQ1,41:$V4}),{13:$V9,16:$Va,55:331,307:43,308:$Vc},o($Vp,[2,280]),o($VN1,[2,7]),o($V81,$V91,{59:197,69:198,20:332,70:$Va1}),o($Vc1,[2,284]),{64:[1,333]},o($Vc1,$Vd1,{58:205,62:206,23:334,63:$Ve1}),o($V7,[2,254]),o($Vk,$Vr1,{144:248,30:335,143:336,31:[2,257]}),o($V7,[2,100]),{31:[2,387],184:337,335:[1,338]},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:342,186:339,190:340,195:341,197:$VR1,307:43,308:$Vc},o($VS1,[2,389],{44:39,55:40,307:43,190:340,195:341,139:342,188:344,189:345,186:346,13:$V9,16:$Va,87:$Vb,197:$VR1,308:$Vc}),o($VT1,[2,227]),o($VT1,[2,228]),o($VT1,[2,229]),{13:$V9,16:$Va,44:215,45:$Vf1,55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,187:350,200:348,230:347,231:$Vh1,234:349,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:342,186:352,190:340,195:341,197:$VR1,307:43,308:$Vc},o($VT1,[2,146]),o($VT1,[2,147]),o($VT1,[2,148]),o($VT1,[2,149]),{13:$V9,16:$Va,44:354,55:355,82:$Vy,87:$Vb,172:357,237:356,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:358,312:$Vk1,313:353},o($VU1,[2,215]),o($VU1,[2,216]),o($Vc1,$Vd1,{58:205,62:206,23:359,63:$Ve1}),o($Vl,[2,264]),o($Vl1,[2,266]),o($VN1,[2,11]),o($V2,[2,308],{6:[2,310]}),o($Vq1,[2,313],{102:360,120:361,121:[1,362]}),o($Vq1,[2,47]),o($Vq1,[2,63]),o($Vq1,[2,64]),{13:$V9,16:$Va,55:363,307:43,308:$Vc},o($Vq1,[2,336]),o($Vq1,[2,337]),o($Vq1,[2,338]),{109:[1,364]},o($VV1,[2,60]),{13:$V9,16:$Va,55:365,307:43,308:$Vc},o($Vp,[2,335]),{13:$V9,16:$Va,55:366,307:43,308:$Vc},{31:[1,367]},o($VW1,[2,341],{137:368}),o($VW1,[2,340]),{13:$V9,16:$Va,44:215,45:$Vf1,55:220,82:$Vy,87:$Vb,89:$Vg1,145:369,172:221,185:213,187:214,231:$Vh1,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},{28:[1,370],127:371,128:[1,372]},o($Vt1,[2,330],{124:373,125:374,126:$Vt}),o($Vt1,[2,57]),{44:375,87:$Vb},o($Vu1,[2,151],{241:376,242:[1,377]}),o($Vv1,[2,153],{245:378,246:[1,379]}),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,247:380,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{250:[1,381]},o($VX1,[2,432]),o($VX1,[2,433]),o($VX1,[2,434]),o($VX1,[2,435]),o($VX1,[2,436]),o($VX1,[2,437]),{250:[2,439]},o([47,48,193,242,246,250,272,290,341,342,343,344,345,346],[2,158],{253:382,254:383,255:384,257:385,263:[1,386],265:[1,387],297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW}),o($Vx1,[2,162],{261:388,262:389,39:$VY1,338:$VZ1}),o($Vy1,[2,164]),o($Vy1,[2,165]),o($Vy1,[2,166]),o($VB1,[2,95]),o($VB1,[2,96]),o($VX1,[2,377],{177:392,325:[1,393]}),{48:[1,394]},o($VB1,[2,177]),{13:$V9,16:$Va,44:136,45:$Vx,46:395,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:396,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:397,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:398,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:399,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VB1,[2,183]),o($VB1,[2,98]),o($VX1,[2,381],{180:400}),{87:[1,401]},o($VB1,[2,185]),{13:$V9,16:$Va,44:136,45:$Vx,46:402,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{29:$Vb1,57:403},o($VE1,[2,193]),{13:$V9,16:$Va,55:404,307:43,308:$Vc},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:342,195:405,197:$VR1,307:43,308:$Vc},o($V_1,[2,233]),o($V_1,[2,234]),o($V_1,[2,235]),o($V$1,[2,459],{281:406,325:[1,407]}),o($VX1,[2,463],{284:408,325:[1,409]}),o($VX1,[2,465],{286:410,325:[1,411]}),{13:$V9,16:$Va,31:[1,412],55:414,82:$Vy,171:413,172:415,173:416,174:$V02,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V12},{31:[1,419],89:[1,420]},{29:[1,421]},o($VJ1,[2,302]),o($VH1,[2,367],{167:422}),o($VI1,[2,369],{168:423}),{48:[1,424],87:[1,425]},o($VJ1,[2,371]),o($VK1,[2,122]),o($VK1,[2,417]),o($VK1,[2,413]),o($VK1,[2,414]),o($VK1,[2,415]),o($VL1,[2,125]),o($VL1,[2,127]),o($VL1,[2,128]),o($V22,[2,420],{227:426}),o($VL1,[2,130]),{13:$V9,16:$Va,55:194,197:$V71,223:427,307:43,308:$Vc},{48:[1,428]},o($V32,[2,289],{61:429,80:430,81:[1,431],83:[1,432]}),o($VO1,[2,288]),{64:[1,433]},o($V81,[2,29],{307:43,267:139,275:146,278:149,77:320,67:321,68:322,55:323,79:434,13:$V9,16:$Va,45:$Vx,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,276:$VI,277:$VJ,279:$VK,280:$VL,283:$VM,285:$VN,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51}),o($V42,[2,293]),o($V52,[2,92]),o($V52,[2,93]),o($V52,[2,94]),{45:$Vz1,89:$VA1,176:269},{31:[1,435]},{31:[1,436]},{19:437,28:$Vh,29:$Vi,56:85},{19:438,28:$Vh,29:$Vi,56:85},o($V62,[2,355],{149:439}),o($V62,[2,354]),{13:$V9,16:$Va,44:215,45:$V72,55:220,82:$Vy,87:$Vb,89:$Vg1,156:440,172:221,185:441,203:442,231:$V82,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($Vl,[2,19]),o($V32,[2,21]),{13:$V9,16:$Va,44:450,45:$V92,55:323,65:445,66:446,67:447,68:448,87:$Vb,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,307:43,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VN1,[2,8]),{31:[1,451]},{31:[2,258]},{31:[2,101]},o($Vk,[2,386],{31:[2,388]}),o($VS1,[2,102]),o($Va2,[2,391],{191:452}),o($Vk,[2,395],{196:453,198:454}),o($Vk,[2,108]),o($Vk,[2,109]),o($VS1,[2,103]),o($VS1,[2,104]),o($VS1,[2,390]),{13:$V9,16:$Va,44:215,45:$Vf1,48:[1,455],55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,187:350,200:456,231:$Vh1,234:349,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($Vb2,[2,424]),o($Vc2,[2,136]),o($Vc2,[2,137]),o($Vd2,[2,140]),{232:[1,457]},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:342,195:458,197:$VR1,307:43,308:$Vc},o($V_1,[2,219]),o($V_1,[2,220]),o($V_1,[2,221]),o($V_1,[2,222]),o($V_1,[2,223]),o($VN1,[2,10]),o($Vq1,[2,46]),o($Vq1,[2,314]),{112:$Vm1,122:459},o($Vq1,[2,62]),o($Vp,$Vn1,{133:242,108:460,112:$Vo1,132:$Vp1}),o($VV1,[2,61]),o($Vq1,[2,49]),o([6,28,126,128,193],[2,65]),{31:[2,66],112:[1,462],138:461},o($VW1,[2,351],{146:463,335:[1,464]}),{29:$Vb1,57:465},o($Vt1,[2,329]),o($Vp,[2,332],{129:466,327:[1,467]}),o($Vt1,[2,55]),o($Vt1,[2,331]),{48:[1,468]},o($Vv1,[2,429]),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,239:469,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vw1,[2,431]),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,243:470,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vw1,[2,156]),{45:$VC1,89:$VD1,179:471},o($Vx1,[2,441]),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,251:472,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vy1,[2,444],{256:473}),o($Vy1,[2,446],{258:474}),o($VX1,[2,442]),o($VX1,[2,443]),o($Vy1,[2,449]),{13:$V9,16:$Va,44:136,45:$Vx,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,255:154,257:155,259:475,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VX1,[2,450]),o($VX1,[2,451]),o($VX1,[2,379],{178:476}),o($VX1,[2,378]),o([6,13,16,29,31,39,45,47,48,73,76,78,81,82,83,85,87,89,112,159,160,161,163,164,193,231,242,246,250,263,265,268,269,270,271,272,273,274,276,277,279,280,283,285,290,294,295,296,297,298,299,300,301,302,303,304,305,306,308,309,310,312,335,338,341,342,343,344,345,346,347,348,349,350,351],[2,175]),{48:[1,477]},{48:[1,478]},{272:[1,479]},{272:[1,480]},{272:[1,481]},{13:$V9,16:$Va,44:136,45:$Vx,46:482,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{48:[1,483]},{48:[1,484]},o($VB1,[2,187]),o($VE1,[2,194]),{13:$V9,16:$Va,44:39,55:40,82:$Vy,87:$Vb,139:289,172:291,255:154,257:155,266:290,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,320:485},{13:$V9,16:$Va,39:[1,487],44:136,45:$Vx,46:488,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,282:486,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($V$1,[2,460]),{13:$V9,16:$Va,44:136,45:$Vx,46:489,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VX1,[2,464]),{13:$V9,16:$Va,44:136,45:$Vx,46:490,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VX1,[2,466]),o($V61,[2,40]),o($VH1,[2,298]),o($Ve2,[2,87]),o($Ve2,[2,88]),o($Ve2,[2,89]),o($Ve2,[2,90]),{13:$V9,16:$Va,55:492,82:$Vy,172:493,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,311:494,312:$Vk1,315:491},o($V61,[2,41]),o($VI1,[2,300]),o($Vf2,[2,303],{92:495}),{13:$V9,16:$Va,31:[1,496],55:414,82:$Vy,171:497,172:415,173:416,174:$V02,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V12},{31:[1,498],89:[1,499]},{29:[1,500]},o($VJ1,[2,372]),{13:$V9,16:$Va,48:[2,422],55:194,197:$V71,223:312,226:502,228:501,229:$VM1,307:43,308:$Vc},o($VL1,[2,131]),o($VL1,[2,126]),o($V32,[2,22]),o($V32,[2,290]),{82:[1,503]},{82:[1,504]},{13:$V9,16:$Va,44:510,45:$Vx,55:323,67:321,68:322,74:505,75:506,76:$Vg2,77:320,78:$Vh2,79:509,87:$Vb,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,307:43,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($V42,[2,294]),o($Vi2,[2,69]),o($Vi2,[2,70]),o($V81,$V91,{59:197,69:198,20:511,70:$Va1}),o($Vc1,$Vd1,{58:205,62:206,23:512,63:$Ve1}),{29:[2,375],31:[2,71],84:522,85:$V5,112:[1,518],150:513,151:514,158:515,159:[1,516],160:[1,517],161:[1,519],163:[1,520],164:[1,521],175:523},o($V62,[2,363],{157:524,335:[1,525]}),o($V6,$V3,{215:10,202:526,205:527,208:528,214:529,44:530,87:$Vb}),o($Vj2,[2,399],{215:10,205:527,208:528,214:529,44:530,204:531,202:532,13:$V3,16:$V3,45:$V3,197:$V3,224:$V3,229:$V3,308:$V3,87:$Vb}),{13:$V9,16:$Va,44:215,45:$V72,55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,203:536,212:534,231:$V82,233:533,234:535,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($V6,$V3,{215:10,205:527,208:528,214:529,44:530,202:537,87:$Vb}),o($Vc1,[2,23],{307:43,267:139,275:146,278:149,55:323,67:447,68:448,44:450,66:538,13:$V9,16:$Va,45:$V92,87:$Vb,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,276:$VI,277:$VJ,279:$VK,280:$VL,283:$VM,285:$VN,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51}),o($Vk2,[2,291]),o($Vk2,[2,24]),o($Vk2,[2,25]),{13:$V9,16:$Va,44:136,45:$Vx,46:539,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vk2,[2,28]),o($Vc1,$Vd1,{58:205,62:206,23:540,63:$Ve1}),o([31,112,232,318,335],[2,105],{192:541,193:[1,542]}),o($Va2,[2,107]),{13:$V9,16:$Va,44:215,45:$Vf1,55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,187:350,199:543,200:544,231:$Vh1,234:349,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($Vl2,[2,132]),o($Vb2,[2,425]),o($Vl2,[2,133]),{13:$V9,16:$Va,44:354,55:355,82:$Vy,87:$Vb,172:357,237:356,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:358,312:$Vk1,313:545},o($Vq1,[2,54]),o($Vq1,[2,48]),o($VW1,[2,342]),{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:546,307:43,308:$Vc},o($VW1,[2,68]),o($Vk,[2,350],{31:$Vm2,112:$Vm2}),o($Vq1,[2,53]),{13:$V9,16:$Va,55:547,307:43,308:$Vc},o($Vp,[2,333]),o($Vw,[2,16]),o($Vv1,[2,152]),o($Vw1,[2,154]),o($Vw1,[2,157]),o($Vx1,[2,159]),o($Vx1,[2,160],{262:389,261:548,39:$VY1,338:$VZ1}),o($Vx1,[2,161],{262:389,261:549,39:$VY1,338:$VZ1}),o($Vy1,[2,163]),{13:$V9,16:$Va,44:136,45:$Vx,46:550,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VB1,[2,178]),o($VB1,[2,179]),{13:$V9,16:$Va,44:136,45:$Vx,46:551,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:552,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:553,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{48:[1,554],272:[1,555]},o($VB1,[2,184]),o($VB1,[2,186]),{314:[1,556]},{48:[1,557]},{48:[2,461]},{48:[2,462]},{48:[1,558]},{48:[2,467],193:[1,561],287:559,288:560},{13:$V9,16:$Va,55:194,197:$V71,223:562,307:43,308:$Vc},o($Vn2,[2,224]),o($Vn2,[2,225]),o($Vn2,[2,226]),{31:[1,563],45:$Vo2,94:564},o($V61,[2,84]),o($VH1,[2,368]),o($V61,[2,85]),o($VI1,[2,370]),o($Vf2,[2,373],{170:566}),{48:[1,567]},{48:[2,423],337:[1,568]},o($V32,[2,35],{83:[1,569]}),o($V32,[2,36],{81:[1,570]}),o($VO1,[2,30],{307:43,267:139,275:146,278:149,77:320,67:321,68:322,55:323,79:509,44:510,75:571,13:$V9,16:$Va,45:$Vx,76:$Vg2,78:$Vh2,87:$Vb,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,276:$VI,277:$VJ,279:$VK,280:$VL,283:$VM,285:$VN,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51}),o($Vp2,[2,295]),{45:$Vx,77:572},{45:$Vx,77:573},o($Vp2,[2,33]),o($Vp2,[2,34]),{31:[2,275],50:574,84:575,85:$V5},{31:[2,277],51:576,84:577,85:$V5},o($V62,[2,356]),o($Vq2,[2,357],{152:578,335:[1,579]}),o($Vr2,[2,74]),{29:$Vb1,57:580},{29:$Vb1,57:581},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:582,307:43,308:$Vc},o($Vs2,[2,365],{162:583,328:[1,584]}),{13:$V9,16:$Va,45:$Vx,55:323,67:321,68:322,77:320,79:585,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,307:43,308:$Vc,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{45:[1,586]},o($Vr2,[2,81]),{29:$Vb1,57:587},o($V62,[2,73]),o($Vk,[2,362],{29:$Vt2,31:$Vt2,85:$Vt2,112:$Vt2,159:$Vt2,160:$Vt2,161:$Vt2,163:$Vt2,164:$Vt2}),o($Vj2,[2,112]),o($Vu2,[2,401],{206:588}),o($Vk,[2,405],{209:589,210:590}),o($Vk,[2,403]),o($Vk,[2,404]),o($Vj2,[2,113]),o($Vj2,[2,400]),{13:$V9,16:$Va,44:215,45:$V72,48:[1,591],55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,203:536,212:592,231:$V82,234:535,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($Vb2,[2,426]),o($Vd2,[2,138]),o($Vd2,[2,139]),{232:[1,593]},o($Vk2,[2,292]),{47:[1,595],48:[1,594]},o($VN1,[2,9]),o($Va2,[2,392]),o($Va2,[2,393],{44:39,55:40,307:43,195:341,139:342,194:596,190:597,13:$V9,16:$Va,87:$Vb,197:$VR1,308:$Vc}),o($Va2,[2,110],{272:[1,598]}),o($Vv2,[2,397],{201:599,316:600,317:[1,601]}),{314:[1,602]},{29:[1,603]},o($Vt1,[2,58]),o($Vy1,[2,445]),o($Vy1,[2,447]),{48:[1,604],272:[1,605]},{48:[1,606]},{272:[1,607]},{272:[1,608]},o($VB1,[2,99]),o($VX1,[2,382]),o([13,16,39,47,48,87,193,197,242,246,250,263,265,272,290,297,298,299,300,301,302,308,314,338,341,342,343,344,345,346],[2,232]),o($VB1,[2,188]),o($VB1,[2,189]),{48:[1,609]},{48:[2,468]},{289:[1,610]},{13:$V9,16:$Va,55:492,82:$Vy,172:493,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,311:494,312:$Vk1,315:611},o($V61,[2,42]),o($Vf2,[2,304]),{13:$V9,16:$Va,55:414,82:$Vy,95:612,171:613,172:415,173:416,174:$V02,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V12},{31:[1,614],45:$Vo2,94:615},o($VL1,[2,129]),o($V22,[2,421]),{82:[1,616]},{82:[1,617]},o($Vp2,[2,296]),o($Vp2,[2,31]),o($Vp2,[2,32]),{31:[2,17]},{31:[2,276]},{31:[2,18]},{31:[2,278]},o($Vk,$VP1,{155:330,153:618,154:619,29:$Vw2,31:$Vw2,85:$Vw2,112:$Vw2,159:$Vw2,160:$Vw2,161:$Vw2,163:$Vw2,164:$Vw2}),o($Vq2,[2,358]),o($Vr2,[2,75]),o($Vr2,[2,76]),{29:$Vb1,57:620},{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:621,307:43,308:$Vc},o($Vs2,[2,366]),o($Vr2,[2,79]),{13:$V9,16:$Va,44:136,45:$Vx,46:622,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($Vr2,[2,91],{336:[1,623]}),o([29,31,85,112,159,160,161,163,164,232,318,335],[2,114],{207:624,193:[1,625]}),o($Vu2,[2,117]),{13:$V9,16:$Va,44:215,45:$V72,55:220,82:$Vy,87:$Vb,89:$Vg1,172:221,185:351,203:536,211:626,212:627,231:$V82,234:535,236:216,237:222,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,309:$Vi1,310:$Vj1,311:217,312:$Vk1},o($VT1,[2,134]),o($Vb2,[2,427]),o($VT1,[2,135]),o($Vk2,[2,26]),{44:628,87:$Vb},o($Va2,[2,106]),o($Va2,[2,394]),o($Vk,[2,396]),o($Vv2,[2,111]),o($Vv2,[2,398]),{13:$V9,16:$Va,44:39,55:40,87:$Vb,139:342,186:629,190:340,195:341,197:$VR1,307:43,308:$Vc},o($VU1,[2,217]),o($Vk,$Vr1,{144:248,140:630,143:631,31:[2,343]}),o($VB1,[2,97]),o($VX1,[2,380]),o($VB1,[2,180]),{13:$V9,16:$Va,44:136,45:$Vx,46:632,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},{13:$V9,16:$Va,44:136,45:$Vx,46:633,55:133,67:132,68:134,77:131,82:$Vy,87:$Vb,172:135,224:$Vz,238:121,239:122,243:123,247:124,251:125,255:154,257:155,259:126,263:$VA,264:130,265:$VB,266:137,267:139,268:$VC,269:$VD,270:$VE,271:$VF,273:$VG,274:$VH,275:146,276:$VI,277:$VJ,278:149,279:$VK,280:$VL,283:$VM,285:$VN,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V$,346:$V01,347:$V11,348:$V21,349:$V31,350:$V41,351:$V51},o($VB1,[2,190]),{290:[1,634]},{314:[1,635]},{13:$V9,16:$Va,48:[1,636],55:414,82:$Vy,171:637,172:415,173:416,174:$V02,255:154,257:155,291:150,294:$VO,295:$VP,296:$VQ,297:$VR,298:$VS,299:$VT,300:$VU,301:$VV,302:$VW,303:$VX,304:$VY,305:$VZ,306:$V_,307:43,308:$Vc,312:$V12},o($Vx2,[2,305]),o($V61,[2,86]),o($Vf2,[2,374]),o($V32,[2,37]),o($V32,[2,38]),o($V62,[2,72]),o($V62,[2,360]),o($Vr2,[2,77]),{29:$Vb1,57:638},{47:[1,639]},{29:[2,376]},o($Vu2,[2,402]),o($Vu2,[2,115],{215:10,208:528,214:529,44:530,205:640,13:$V3,16:$V3,45:$V3,197:$V3,224:$V3,229:$V3,308:$V3,87:$Vb}),o($Vu2,[2,118],{272:[1,641]}),o($Vy2,[2,407],{213:642,319:643,317:[1,644]}),{48:[1,645]},{318:[1,646]},{31:[1,647]},{31:[2,344]},{48:[1,648]},{48:[1,649]},{291:650,303:$VX,304:$VY,305:$VZ,306:$V_},o($Ve2,[2,218]),o($Vf2,[2,44]),o($Vx2,[2,306]),o($Vr2,[2,78]),{44:651,87:$Vb},o($Vu2,[2,116]),o($Vk,[2,406]),o($Vy2,[2,119]),o($Vy2,[2,408]),o($V6,$V3,{215:10,205:527,208:528,214:529,44:530,202:652,87:$Vb}),o($Vk2,[2,27]),o($Vv2,[2,230]),o($Vz2,[2,345],{141:653,335:[1,654]}),o($VB1,[2,181]),o($VB1,[2,182]),{48:[2,191]},{48:[1,655]},{318:[1,656]},o($Vk,$Vr1,{144:248,142:657,143:658,31:$VA2,112:$VA2}),o($Vz2,[2,346]),o($Vr2,[2,80]),o($Vy2,[2,231]),o($VW1,[2,67]),o($VW1,[2,348])],
defaultActions: {5:[2,240],6:[2,241],7:[2,242],9:[2,239],24:[2,1],25:[2,2],26:[2,244],87:[2,282],94:[2,384],100:[2,45],109:[2,325],166:[2,458],263:[2,439],336:[2,258],337:[2,101],487:[2,461],488:[2,462],560:[2,468],574:[2,17],575:[2,276],576:[2,18],577:[2,278],623:[2,376],631:[2,344],650:[2,191]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    let allExpected = {};
    let allExpectedTerminals = {};
    Parser.contextTriples = null;
    // console.log(table)
    while (true) {
        state = stack[stack.length - 1];
        // inserted by wv ->
        // console.log("vstack", vstack)
        // console.log("lstack", lstack)
        // console.log("stack", stack.slice())
        // console.log("tstack", tstack)
        // console.log("state", state)
        // console.log(`table[${state}]: `, Object.assign({}, table[state]))
        let expectedSymbols = [];
        for (p in table[state]) {
            if (p > TERROR) {
                expectedSymbols.push(this.invertedSymbols[p]);
            }
        }
        let expectedTerminals = [];
        for (p in table[state]) {
            if (this.terminals_[p] && p > TERROR) {
                expectedTerminals.push(this.terminals_[p]);
            }
        }
        if (!Object.hasOwn(allExpected, [yyloc.last_line, yyloc.last_column])) {
            allExpected[[yyloc.last_line, yyloc.last_column]] = new Set();
        }
        expectedSymbols.forEach(s => allExpected[[yyloc.last_line, yyloc.last_column]].add(s));
        if (!Object.hasOwn(allExpectedTerminals, [yyloc.last_line, yyloc.last_column])) {
            allExpectedTerminals[[yyloc.last_line, yyloc.last_column]] = new Set();
        }
        expectedTerminals.forEach(s => allExpectedTerminals[[yyloc.last_line, yyloc.last_column]].add(s))
        // console.log(yyloc.last_line, yyloc.last_column, self.invertedSymbols[symbol], expectedSymbols.slice());
        // <- inserted
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
            // console.log("symbol: ", this.invertedSymbols[symbol], `${symbol}`);
            // console.log("action: ", action);
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push(this.terminals_[p]);
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    matched: lexer.matched,
                    expected: expected,
                    allExpected: allExpected,
                    vstack: vstack,
                    contextTriples: Parser.contextTriples,
                    prefixes: Parser.prefixes ? Parser.prefixes : {},
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return {
                    result: r,
                    allExpected: allExpected,
                };
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

  /*
    SPARQL parser in the Jison parser generator format.
  */

  var Wildcard = require('./Wildcard').Wildcard;

  // Common namespaces and entities
  var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      RDF_TYPE  = RDF + 'type',
      RDF_FIRST = RDF + 'first',
      RDF_REST  = RDF + 'rest',
      RDF_NIL   = RDF + 'nil',
      XSD = 'http://www.w3.org/2001/XMLSchema#',
      XSD_INTEGER  = XSD + 'integer',
      XSD_DECIMAL  = XSD + 'decimal',
      XSD_DOUBLE   = XSD + 'double',
      XSD_BOOLEAN  = XSD + 'boolean';

  var base = '', basePath = '', baseRoot = '';

  // Returns a lowercase version of the given string
  function lowercase(string) {
    return string.toLowerCase();
  }

  // Appends the item to the array and returns the array
  function appendTo(array, item) {
    return array.push(item), array;
  }

  // Appends the items to the array and returns the array
  function appendAllTo(array, items) {
    return array.push.apply(array, items), array;
  }

  // Extends a base object with properties of other objects
  function extend(base) {
    if (!base) base = {};
    for (var i = 1, l = arguments.length, arg; i < l && (arg = arguments[i] || {}); i++)
      for (var name in arg)
        base[name] = arg[name];
    return base;
  }

  // Creates an array that contains all items of the given arrays
  function unionAll() {
    var union = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      union = union.concat.apply(union, arguments[i]);
    return union;
  }

  // Resolves an IRI against a base path
  function resolveIRI(iri) {
    // Strip off possible angular brackets
    if (iri[0] === '<')
      iri = iri.substring(1, iri.length - 1);
    // Return absolute IRIs unmodified
    if (/^[a-z]+:/i.test(iri))
      return iri;
    if (!Parser.base)
      throw new Error('Cannot resolve relative IRI ' + iri + ' because no base IRI was set.');
    if (base !== Parser.base) {
      base = Parser.base;
      basePath = base.replace(/[^\/:]*$/, '');
      baseRoot = base.match(/^(?:[a-z]+:\/*)?[^\/]*/)[0];
    }
    switch (iri[0]) {
    // An empty relative IRI indicates the base IRI
    case undefined:
      return base;
    // Resolve relative fragment IRIs against the base IRI
    case '#':
      return base + iri;
    // Resolve relative query string IRIs by replacing the query string
    case '?':
      return base.replace(/(?:\?.*)?$/, iri);
    // Resolve root relative IRIs at the root of the base IRI
    case '/':
      return baseRoot + iri;
    // Resolve all other IRIs at the base IRI's path
    default:
      return basePath + iri;
    }
  }

  // If the item is a variable, ensures it starts with a question mark
  function toVar(variable) {
    if (variable) {
      var first = variable[0];
      if (first === '?' || first === '$') return Parser.factory.variable(variable.substr(1));
    }
    return variable;
  }

  // Creates an operation with the given name and arguments
  function operation(operatorName, args) {
    return { type: 'operation', operator: operatorName, args: args || [] };
  }

  // Creates an expression with the given type and attributes
  function expression(expr, attr) {
    var expression = { expression: expr === '*'? new Wildcard() : expr };
    if (attr)
      for (var a in attr)
        expression[a] = attr[a];
    return expression;
  }

  // Creates a path with the given type and items
  function path(type, items) {
    return { type: 'path', pathType: type, items: items };
  }

  // Transforms a list of operations types and arguments into a tree of operations
  function createOperationTree(initialExpression, operationList) {
    for (var i = 0, l = operationList.length, item; i < l && (item = operationList[i]); i++)
      initialExpression = operation(item[0], [initialExpression, item[1]]);
    return initialExpression;
  }

  // Group datasets by default and named
  function groupDatasets(fromClauses, groupName) {
    var defaults = [], named = [], l = fromClauses.length, fromClause, group = {};
    if (!l)
      return null;
    for (var i = 0; i < l && (fromClause = fromClauses[i]); i++)
      (fromClause.named ? named : defaults).push(fromClause.iri);
    group[groupName || 'from'] = { default: defaults, named: named };
    return group;
  }

  // Converts the string to a number
  function toInt(string) {
    return parseInt(string, 10);
  }

  // Transforms a possibly single group into its patterns
  function degroupSingle(group) {
    return group.type === 'group' && group.patterns.length === 1 ? group.patterns[0] : group;
  }

  // Creates a literal with the given value and type
  function createTypedLiteral(value, type) {
    if (type && type.termType !== 'NamedNode'){
      type = Parser.factory.namedNode(type);
    }
    return Parser.factory.literal(value, type);
  }

  // Creates a literal with the given value and language
  function createLangLiteral(value, lang) {
    return Parser.factory.literal(value, lang);
  }

  function nestedTriple(subject, predicate, object) {

    // TODO: Remove this when it is caught by the grammar
    if (!('termType' in predicate)) {
      throw new Error('Nested triples cannot contain paths');
    }

    return Parser.factory.quad(subject, predicate, object);
  }

  // Creates a triple with the given subject, predicate, and object
  function triple(subject, predicate, object, annotations) {
    var triple = {};
    if (subject     != null) triple.subject     = subject;
    if (predicate   != null) triple.predicate   = predicate;
    if (object      != null) triple.object      = object;
    if (annotations != null) triple.annotations = annotations;
    return triple;
  }

  // Creates a new blank node
  function blank(name) {
    if (typeof name === 'string') {  // Only use name if a name is given
      if (name.startsWith('e_')) return Parser.factory.blankNode(name);
      return Parser.factory.blankNode('e_' + name);
    }
    return Parser.factory.blankNode('g_' + blankId++);
  };
  var blankId = 0;
  Parser._resetBlanks = function () { blankId = 0; }

  // Regular expression and replacement strings to escape strings
  var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\(.)/g,
      escapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                             't': '\t', 'b': '\b', 'n': '\n', 'r': '\r', 'f': '\f' },
      partialSurrogatesWithoutEndpoint = /[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/,
      fromCharCode = String.fromCharCode;

  // Translates escape codes in the string into their textual equivalent
  function unescapeString(string, trimLength) {
    string = string.substring(trimLength, string.length - trimLength);
    try {
      string = string.replace(escapeSequence, function (sequence, unicode4, unicode8, escapedChar) {
        var charCode;
        if (unicode4) {
          charCode = parseInt(unicode4, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          return fromCharCode(charCode);
        }
        else if (unicode8) {
          charCode = parseInt(unicode8, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          if (charCode < 0xFFFF) return fromCharCode(charCode);
          return fromCharCode(0xD800 + ((charCode -= 0x10000) >> 10), 0xDC00 + (charCode & 0x3FF));
        }
        else {
          var replacement = escapeReplacements[escapedChar];
          if (!replacement) throw new Error();
          return replacement;
        }
      });
    }
    catch (error) { return ''; }

    // Test for invalid unicode surrogate pairs
    if (partialSurrogatesWithoutEndpoint.exec(string)) {
      throw new Error('Invalid unicode codepoint of surrogate pair without corresponding codepoint in ' + string);
    }

    return string;
  }

  // Creates a list, collecting its (possibly blank) items and triples associated with those items
  function createList(objects) {
    var list = blank(), head = list, listItems = [], listTriples, triples = [];
    objects.forEach(function (o) { listItems.push(o.entity); appendAllTo(triples, o.triples); });

    // Build an RDF list out of the items
    for (var i = 0, j = 0, l = listItems.length, listTriples = Array(l * 2); i < l;)
      listTriples[j++] = triple(head, Parser.factory.namedNode(RDF_FIRST), listItems[i]),
      listTriples[j++] = triple(head, Parser.factory.namedNode(RDF_REST),  head = ++i < l ? blank() : Parser.factory.namedNode(RDF_NIL));

    // Return the list's identifier, its triples, and the triples associated with its items
    return { entity: list, triples: appendAllTo(listTriples, triples) };
  }

  // Creates a blank node identifier, collecting triples with that blank node as subject
  function createAnonymousObject(propertyList) {
    var entity = blank();
    return {
      entity: entity,
      triples: propertyList.map(function (t) { return extend(triple(entity), t); })
    };
  }

  // Collects all (possibly blank) objects, and triples that have them as subject
  function objectListToTriples(predicate, objectList, otherTriples) {
    var objects = [], triples = [];
    objectList.forEach(function (l) {
      let annotation = null;
      if (l.annotation) {
        annotation = l.annotation
        l = l.object;
      }
      objects.push(triple(null, predicate, l.entity, annotation));
      appendAllTo(triples, l.triples);
    });
    return unionAll(objects, otherTriples || [], triples);
  }

  // Simplifies groups by merging adjacent BGPs
  function mergeAdjacentBGPs(groups) {
    var merged = [], currentBgp;
    for (var i = 0, group; group = groups[i]; i++) {
      switch (group.type) {
        // Add a BGP's triples to the current BGP
        case 'bgp':
          if (group.triples.length) {
            if (!currentBgp)
              appendTo(merged, currentBgp = group);
            else
              appendAllTo(currentBgp.triples, group.triples);
          }
          break;
        // All other groups break up a BGP
        default:
          // Only add the group if its pattern is non-empty
          if (!group.patterns || group.patterns.length > 0) {
            appendTo(merged, group);
            currentBgp = null;
          }
      }
    }
    return merged;
  }

  // Return the id of an expression
  function getExpressionId(expression) {
    return expression.variable ? expression.variable.value : expression.value || expression.expression.value;
  }

  // Get all "aggregate"'s from an expression
  function getAggregatesOfExpression(expression) {
    if (!expression) {
      return [];
    }
    if (expression.type === 'aggregate') {
      return [expression];
    } else if (expression.type === "operation") {
      const aggregates = [];
      for (const arg of expression.args) {
        aggregates.push(...getAggregatesOfExpression(arg));
      }
      return aggregates;
    }
    return [];
  }

  // Get all variables used in an expression
  function getVariablesFromExpression(expression) {
    const variables = new Set();
    const visitExpression = function (expr) {
      if (!expr) { return; }
      if (expr.termType === "Variable") {
        variables.add(expr);
      } else if (expr.type === "operation") {
        expr.args.forEach(visitExpression);
      }
    };
    visitExpression(expression);
    return variables;
  }

  // Helper function to flatten arrays
  function flatten(input, depth = 1, stack = []) {
    for (const item of input) {
        if (depth > 0 && item instanceof Array) {
          flatten(item, depth - 1, stack);
        } else {
          stack.push(item);
        }
    }
    return stack;
  }

  function isVariable(term) {
    return term.termType === 'Variable';
  }

  function getBoundVarsFromGroupGraphPattern(pattern) {
    if (pattern.triples) {
      const boundVars = [];
      for (const triple of pattern.triples) {
        if (isVariable(triple.subject)) boundVars.push(triple.subject.value);
        if (isVariable(triple.predicate)) boundVars.push(triple.predicate.value);
        if (isVariable(triple.object)) boundVars.push(triple.object.value);
      }
      return boundVars;
    } else if (pattern.patterns) {
      const boundVars = [];
      for (const pat of pattern.patterns) {
        boundVars.push(...getBoundVarsFromGroupGraphPattern(pat));
      }
      return boundVars;
    }
    return [];
  }

  // Helper function to find duplicates in array
  function getDuplicatesInArray(array) {
    const sortedArray = array.slice().sort();
    const duplicates = [];
    for (let i = 0; i < sortedArray.length - 1; i++) {
      if (sortedArray[i + 1] == sortedArray[i]) {
        duplicates.push(sortedArray[i]);
      }
    }
    return duplicates;
  }

  function ensureSparqlStar(value) {
    if (!Parser.sparqlStar) {
      throw new Error('SPARQL-star support is not enabled');
    }
    return value;
  }

  function _applyAnnotations(subject, annotations, arr) {
    for (const annotation of annotations) {
      const t = triple(
        // If the annotation already has a subject then just push the
        // annotation to the upper scope as it is a blank node introduced
        // from a pattern like :s :p :o {| :p1 [ :p2 :o2; :p3 :o3 ] |}
        'subject' in annotation ? annotation.subject : subject,
        annotation.predicate,
        annotation.object
      )

      arr.push(t);

      if (annotation.annotations) {
        _applyAnnotations(nestedTriple(
        subject,
        annotation.predicate,
        annotation.object
      ), annotation.annotations, arr)
      }
    }
  }

  function applyAnnotations(triples) {
    if (Parser.sparqlStar) {
      const newTriples = [];

      triples.forEach(t => {
        const s = triple(t.subject, t.predicate, t.object);

        newTriples.push(s);

        if (t.annotations) {
          _applyAnnotations(nestedTriple(t.subject, t.predicate, t.object), t.annotations, newTriples);
        }
      });

      return newTriples;
    }
    return triples;
  }

  function ensureSparqlStarNestedQuads(value) {
    if (!Parser.sparqlStarNestedQuads) {
      throw new Error('Lenient SPARQL-star support with nested quads is not enabled');
    }
    return value;
  }

  function ensureNoVariables(operations) {
    for (const operation of operations) {
      if (operation.type === 'graph' && operation.name.termType === 'Variable') {
        throw new Error('Detected illegal variable in GRAPH');
      }
      if (operation.type === 'bgp' || operation.type === 'graph') {
        for (const triple of operation.triples) {
          if (triple.subject.termType === 'Variable' ||
              triple.predicate.termType === 'Variable' ||
              triple.object.termType === 'Variable') {
            throw new Error('Detected illegal variable in BGP');
          }
        }
      }
    }
    return operations;
  }

  function ensureNoBnodes(operations) {
    for (const operation of operations) {
      if (operation.type === 'bgp') {
        for (const triple of operation.triples) {
          if (triple.subject.termType === 'BlankNode' ||
              triple.predicate.termType === 'BlankNode' ||
              triple.object.termType === 'BlankNode') {
            throw new Error('Detected illegal blank node in BGP');
          }
        }
      }
    }
    return operations;
  }
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"flex":true,"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* ignore */
break;
case 1:return 12
break;
case 2:return 15
break;
case 3:return 41
break;
case 4:return 325
break;
case 5:return 326
break;
case 6:return 45
break;
case 7:return 47
break;
case 8:return 48
break;
case 9:return 39
break;
case 10:return 24
break;
case 11:return 28
break;
case 12:return 29
break;
case 13:return 31
break;
case 14:return 32
break;
case 15:return 36
break;
case 16:return 53
break;
case 17:return 327
break;
case 18:return 63
break;
case 19:return 64
break;
case 20:return 70
break;
case 21:return 73
break;
case 22:return 76
break;
case 23:return 78
break;
case 24:return 81
break;
case 25:return 83
break;
case 26:return 85
break;
case 27:return 193
break;
case 28:return 100
break;
case 29:return 328
break;
case 30:return 121
break;
case 31:return 329
break;
case 32:return 330
break;
case 33:return 110
break;
case 34:return 331
break;
case 35:return 109
break;
case 36:return 332
break;
case 37:return 333
break;
case 38:return 113
break;
case 39:return 115
break;
case 40:return 116
break;
case 41:return 131
break;
case 42:return 123
break;
case 43:return 126
break;
case 44:return 128
break;
case 45:return 132
break;
case 46:return 112
break;
case 47:return 334
break;
case 48:return 335
break;
case 49:return 159
break;
case 50:return 161
break;
case 51:return 164
break;
case 52:return 174
break;
case 53:return 160
break;
case 54:return 336
break;
case 55:return 163
break;
case 56:return 312
break;
case 57:return 314
break;
case 58:return 317
break;
case 59:return 318
break;
case 60:return 272
break;
case 61:return 197
break;
case 62:return 337
break;
case 63:return 338
break;
case 64:return 229
break;
case 65:return 340
break;
case 66:return 263
break;
case 67:return 224
break;
case 68:return 231
break;
case 69:return 232
break;
case 70:return 242
break;
case 71:return 246
break;
case 72:return 290
break;
case 73:return 341
break;
case 74:return 342
break;
case 75:return 343
break;
case 76:return 344
break;
case 77:return 345
break;
case 78:return 250
break;
case 79:return 346
break;
case 80:return 265
break;
case 81:return 276
break;
case 82:return 277
break;
case 83:return 268
break;
case 84:return 269
break;
case 85:return 270
break;
case 86:return 271
break;
case 87:return 347
break;
case 88:return 348
break;
case 89:return 273
break;
case 90:return 274
break;
case 91:return 350
break;
case 92:return 349
break;
case 93:return 351
break;
case 94:return 279
break;
case 95:return 280
break;
case 96:return 283
break;
case 97:return 285
break;
case 98:return 289
break;
case 99:return 293
break;
case 100:return 296
break;
case 101:return 13
break;
case 102:return 16
break;
case 103:return 308
break;
case 104:return 309
break;
case 105:return 87
break;
case 106:return 292
break;
case 107:return 82
break;
case 108:return 294
break;
case 109:return 295
break;
case 110:return 297
break;
case 111:return 298
break;
case 112:return 299
break;
case 113:return 300
break;
case 114:return 301
break;
case 115:return 302
break;
case 116:return 'EXPONENT'
break;
case 117:return 303
break;
case 118:return 304
break;
case 119:return 305
break;
case 120:return 306
break;
case 121:return 89
break;
case 122:return 310
break;
case 123:return 6
break;
case 124:return 'INVALID'
break;
case 125:console.log(yy_.yytext);
break;
}
},
rules: [/^(?:\s+|(#[^\n\r]*))/i,/^(?:BASE)/i,/^(?:PREFIX)/i,/^(?:SELECT)/i,/^(?:DISTINCT)/i,/^(?:REDUCED)/i,/^(?:\()/i,/^(?:AS)/i,/^(?:\))/i,/^(?:\*)/i,/^(?:CONSTRUCT)/i,/^(?:WHERE)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:DESCRIBE)/i,/^(?:ASK)/i,/^(?:FROM)/i,/^(?:NAMED)/i,/^(?:GROUP)/i,/^(?:BY)/i,/^(?:HAVING)/i,/^(?:ORDER)/i,/^(?:ASC)/i,/^(?:DESC)/i,/^(?:LIMIT)/i,/^(?:OFFSET)/i,/^(?:VALUES)/i,/^(?:;)/i,/^(?:LOAD)/i,/^(?:SILENT)/i,/^(?:INTO)/i,/^(?:CLEAR)/i,/^(?:DROP)/i,/^(?:CREATE)/i,/^(?:ADD)/i,/^(?:TO)/i,/^(?:MOVE)/i,/^(?:COPY)/i,/^(?:INSERT((\s+|(#[^\n\r]*)\n\r?)+)DATA)/i,/^(?:DELETE((\s+|(#[^\n\r]*)\n\r?)+)DATA)/i,/^(?:DELETE((\s+|(#[^\n\r]*)\n\r?)+)WHERE)/i,/^(?:WITH)/i,/^(?:DELETE)/i,/^(?:INSERT)/i,/^(?:USING)/i,/^(?:DEFAULT)/i,/^(?:GRAPH)/i,/^(?:ALL)/i,/^(?:\.)/i,/^(?:OPTIONAL)/i,/^(?:SERVICE)/i,/^(?:BIND)/i,/^(?:UNDEF)/i,/^(?:MINUS)/i,/^(?:UNION)/i,/^(?:FILTER)/i,/^(?:<<)/i,/^(?:>>)/i,/^(?:\{\|)/i,/^(?:\|\})/i,/^(?:,)/i,/^(?:a)/i,/^(?:\|)/i,/^(?:\/)/i,/^(?:\^)/i,/^(?:\?)/i,/^(?:\+)/i,/^(?:!)/i,/^(?:\[)/i,/^(?:\])/i,/^(?:\|\|)/i,/^(?:&&)/i,/^(?:=)/i,/^(?:!=)/i,/^(?:<)/i,/^(?:>)/i,/^(?:<=)/i,/^(?:>=)/i,/^(?:IN)/i,/^(?:NOT)/i,/^(?:-)/i,/^(?:BOUND)/i,/^(?:BNODE)/i,/^(?:(RAND|NOW|UUID|STRUUID))/i,/^(?:(LANG|DATATYPE|IRI|URI|ABS|CEIL|FLOOR|ROUND|STRLEN|STR|UCASE|LCASE|ENCODE_FOR_URI|YEAR|MONTH|DAY|HOURS|MINUTES|SECONDS|TIMEZONE|TZ|MD5|SHA1|SHA256|SHA384|SHA512|isIRI|isURI|isBLANK|isLITERAL|isNUMERIC))/i,/^(?:(SUBJECT|PREDICATE|OBJECT|isTRIPLE))/i,/^(?:(LANGMATCHES|CONTAINS|STRSTARTS|STRENDS|STRBEFORE|STRAFTER|STRLANG|STRDT|sameTerm))/i,/^(?:CONCAT)/i,/^(?:COALESCE)/i,/^(?:IF)/i,/^(?:TRIPLE)/i,/^(?:REGEX)/i,/^(?:SUBSTR)/i,/^(?:REPLACE)/i,/^(?:EXISTS)/i,/^(?:COUNT)/i,/^(?:SUM|MIN|MAX|AVG|SAMPLE)/i,/^(?:GROUP_CONCAT)/i,/^(?:SEPARATOR)/i,/^(?:\^\^)/i,/^(?:true|false)/i,/^(?:(<(?:[^<>\"\{\}\|\^`\\\u0000-\u0020])*>))/i,/^(?:((([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])(?:(?:(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])|\.)*(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040]))?)?:))/i,/^(?:(((([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])(?:(?:(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])|\.)*(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040]))?)?:)((?:((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|:|[0-9]|((%([0-9A-Fa-f])([0-9A-Fa-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%))))(?:(?:(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])|\.|:|((%([0-9A-Fa-f])([0-9A-Fa-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%))))*(?:(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])|:|((%([0-9A-Fa-f])([0-9A-Fa-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%)))))?)))/i,/^(?:(_:(?:((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9])(?:(?:(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])|\.)*(((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040]))?))/i,/^(?:([\?\$]((?:((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9])(?:((?:([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])*)))/i,/^(?:(@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*))/i,/^(?:([0-9]+))/i,/^(?:([0-9]*\.[0-9]+))/i,/^(?:([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+)))/i,/^(?:(\+([0-9]+)))/i,/^(?:(\+([0-9]*\.[0-9]+)))/i,/^(?:(\+([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+))))/i,/^(?:(-([0-9]+)))/i,/^(?:(-([0-9]*\.[0-9]+)))/i,/^(?:(-([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+))))/i,/^(?:([eE][+-]?[0-9]+))/i,/^(?:('(?:(?:[^\u0027\u005C\u000A\u000D])|(\\[tbnrf\\\"']|\\u([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])|\\U([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])))*'))/i,/^(?:("(?:(?:[^\u0022\u005C\u000A\u000D])|(\\[tbnrf\\\"']|\\u([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])|\\U([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])))*"))/i,/^(?:('''(?:(?:'|'')?(?:[^'\\]|(\\[tbnrf\\\"']|\\u([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])|\\U([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f]))))*'''))/i,/^(?:("""(?:(?:"|"")?(?:[^\"\\]|(\\[tbnrf\\\"']|\\u([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])|\\U([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f]))))*"""))/i,/^(?:(\((\u0020|\u0009|\u000D|\u000A)*\)))/i,/^(?:(\[(\u0020|\u0009|\u000D|\u000A)*\]))/i,/^(?:$)/i,/^(?:.)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();module.exports=SparqlParser

},{"./Wildcard":17}],17:[function(require,module,exports){

// Wildcard constructor
class Wildcard {
  constructor() {
    return WILDCARD || this;
  }

  equals(other) {
    return other && (this.termType === other.termType);
  }
}

Object.defineProperty(Wildcard.prototype, 'value', {
  enumerable: true,
  value: '*',
});

Object.defineProperty(Wildcard.prototype, 'termType', {
  enumerable: true,
  value: 'Wildcard',
});


// Wildcard singleton
var WILDCARD = new Wildcard();

module.exports.Wildcard = Wildcard;

},{}],"randexp":[function(require,module,exports){
const ret    = require('ret');
const DRange = require('drange');
const types  = ret.types;


module.exports = class RandExp {
  /**
   * @constructor
   * @param {RegExp|String} regexp
   * @param {String} m
   */
  constructor(regexp, m) {
    this._setDefaults(regexp);
    if (regexp instanceof RegExp) {
      this.ignoreCase = regexp.ignoreCase;
      this.multiline = regexp.multiline;
      regexp = regexp.source;

    } else if (typeof regexp === 'string') {
      this.ignoreCase = m && m.indexOf('i') !== -1;
      this.multiline = m && m.indexOf('m') !== -1;
    } else {
      throw new Error('Expected a regexp or string');
    }

    this.tokens = ret(regexp);
  }


  /**
   * Checks if some custom properties have been set for this regexp.
   *
   * @param {RandExp} randexp
   * @param {RegExp} regexp
   */
  _setDefaults(regexp) {
    // When a repetitional token has its max set to Infinite,
    // randexp won't actually generate a random amount between min and Infinite
    // instead it will see Infinite as min + 100.
    this.max = regexp.max != null ? regexp.max :
      RandExp.prototype.max != null ? RandExp.prototype.max : 100;

    // This allows expanding to include additional characters
    // for instance: RandExp.defaultRange.add(0, 65535);
    this.defaultRange = regexp.defaultRange ?
      regexp.defaultRange : this.defaultRange.clone();

    if (regexp.randInt) {
      this.randInt = regexp.randInt;
    }
  }


  /**
   * Generates the random string.
   *
   * @return {String}
   */
  gen() {
    return this._gen(this.tokens, []);
  }


  /**
   * Generate random string modeled after given tokens.
   *
   * @param {Object} token
   * @param {Array.<String>} groups
   * @return {String}
   */
  _gen(token, groups) {
    var stack, str, n, i, l;

    switch (token.type) {
      case types.ROOT:
      case types.GROUP:
        // Ignore lookaheads for now.
        if (token.followedBy || token.notFollowedBy) { return ''; }

        // Insert placeholder until group string is generated.
        if (token.remember && token.groupNumber === undefined) {
          token.groupNumber = groups.push(null) - 1;
        }

        stack = token.options ?
          this._randSelect(token.options) : token.stack;

        str = '';
        for (i = 0, l = stack.length; i < l; i++) {
          str += this._gen(stack[i], groups);
        }

        if (token.remember) {
          groups[token.groupNumber] = str;
        }
        return str;

      case types.POSITION:
        // Do nothing for now.
        return '';

      case types.SET:
        var expandedSet = this._expand(token);
        if (!expandedSet.length) { return ''; }
        return String.fromCharCode(this._randSelect(expandedSet));

      case types.REPETITION:
        // Randomly generate number between min and max.
        n = this.randInt(token.min,
          token.max === Infinity ? token.min + this.max : token.max);

        str = '';
        for (i = 0; i < n; i++) {
          str += this._gen(token.value, groups);
        }

        return str;

      case types.REFERENCE:
        return groups[token.value - 1] || '';

      case types.CHAR:
        var code = this.ignoreCase && this._randBool() ?
          this._toOtherCase(token.value) : token.value;
        return String.fromCharCode(code);
    }
  }


  /**
   * If code is alphabetic, converts to other case.
   * If not alphabetic, returns back code.
   *
   * @param {Number} code
   * @return {Number}
   */
  _toOtherCase(code) {
    return code + (97 <= code && code <= 122 ? -32 :
      65 <= code && code <= 90  ?  32 : 0);
  }


  /**
   * Randomly returns a true or false value.
   *
   * @return {Boolean}
   */
  _randBool() {
    return !this.randInt(0, 1);
  }


  /**
   * Randomly selects and returns a value from the array.
   *
   * @param {Array.<Object>} arr
   * @return {Object}
   */
  _randSelect(arr) {
    if (arr instanceof DRange) {
      return arr.index(this.randInt(0, arr.length - 1));
    }
    return arr[this.randInt(0, arr.length - 1)];
  }


  /**
   * expands a token to a DiscontinuousRange of characters which has a
   * length and an index function (for random selecting)
   *
   * @param {Object} token
   * @return {DiscontinuousRange}
   */
  _expand(token) {
    if (token.type === ret.types.CHAR) {
      return new DRange(token.value);
    } else if (token.type === ret.types.RANGE) {
      return new DRange(token.from, token.to);
    } else {
      let drange = new DRange();
      for (let i = 0; i < token.set.length; i++) {
        let subrange = this._expand(token.set[i]);
        drange.add(subrange);
        if (this.ignoreCase) {
          for (let j = 0; j < subrange.length; j++) {
            let code = subrange.index(j);
            let otherCaseCode = this._toOtherCase(code);
            if (code !== otherCaseCode) {
              drange.add(otherCaseCode);
            }
          }
        }
      }
      if (token.not) {
        return this.defaultRange.clone().subtract(drange);
      } else {
        return this.defaultRange.clone().intersect(drange);
      }
    }
  }


  /**
   * Randomly generates and returns a number between a and b (inclusive).
   *
   * @param {Number} a
   * @param {Number} b
   * @return {Number}
   */
  randInt(a, b) {
    return a + Math.floor(Math.random() * (1 + b - a));
  }


  /**
   * Default range of characters to generate from.
   */
  get defaultRange() {
    return this._range = this._range || new DRange(32, 126);
  }

  set defaultRange(range) {
    this._range = range;
  }


  /**
   *
   * Enables use of randexp with a shorter call.
   *
   * @param {RegExp|String| regexp}
   * @param {String} m
   * @return {String}
   */
  static randexp(regexp, m) {
    var randexp;
    if(typeof regexp === 'string') {
      regexp = new RegExp(regexp, m);
    }

    if (regexp._randexp === undefined) {
      randexp = new RandExp(regexp, m);
      regexp._randexp = randexp;
    } else {
      randexp = regexp._randexp;
      randexp._setDefaults(regexp);
    }
    return randexp.gen();
  }


  /**
   * Enables sugary /regexp/.gen syntax.
   */
  static sugar() {
    /* eshint freeze:false */
    RegExp.prototype.gen = function() {
      return RandExp.randexp(this);
    };
  }
};

},{"drange":1,"ret":10}],"sparqljs":[function(require,module,exports){
var Parser = require('./lib/SparqlParser').Parser;
var Generator = require('./lib/SparqlGenerator');
var Wildcard = require("./lib/Wildcard").Wildcard;
var { DataFactory } = require('rdf-data-factory');

module.exports = {
  /**
   * Creates a SPARQL parser with the given pre-defined prefixes and base IRI
   * @param options {
   *   prefixes?: { [prefix: string]: string },
   *   baseIRI?: string,
   *   factory?: import('rdf-js').DataFactory,
   *   sparqlStar?: boolean,
   *   skipValidation?: boolean,
   *   skipUngroupedVariableCheck?: boolean
   * }
   */
  Parser: function ({ prefixes, baseIRI, factory, sparqlStar, skipValidation, skipUngroupedVariableCheck, pathOnly } = {}) {

    // Create a copy of the prefixes
    var prefixesCopy = {};
    for (var prefix in prefixes || {})
      prefixesCopy[prefix] = prefixes[prefix];

    // Create a new parser with the given prefixes
    // (Workaround for https://github.com/zaach/jison/issues/241)
    var parser = new Parser();
    parser.parse = function () {
      Parser.base = baseIRI || '';
      Parser.prefixes = Object.create(prefixesCopy);
      Parser.factory = factory || new DataFactory();
      Parser.sparqlStar = Boolean(sparqlStar);
      Parser.pathOnly = Boolean(pathOnly);
      // We keep skipUngroupedVariableCheck for compatibility reasons.
      Parser.skipValidation = Boolean(skipValidation) || Boolean(skipUngroupedVariableCheck)
      return Parser.prototype.parse.apply(parser, arguments);
    };
    parser._resetBlanks = Parser._resetBlanks;
    return parser;
  },
  Generator: Generator,
  Wildcard: Wildcard,
};

},{"./lib/SparqlGenerator":15,"./lib/SparqlParser":16,"./lib/Wildcard":17,"rdf-data-factory":2}]},{},[]);
