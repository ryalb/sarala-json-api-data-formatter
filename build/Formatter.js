'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Formatter = function () {
    function Formatter() {
        _classCallCheck(this, Formatter);

        this.data = {};
        this.includes = null;
        this.fields = null;
        this.includedData = [];
    }

    _createClass(Formatter, [{
        key: 'includeOnly',
        value: function includeOnly() {
            var includes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            this.includes = includes;

            return this;
        }
    }, {
        key: 'filterFields',
        value: function filterFields() {
            var fields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            this.fields = fields;

            return this;
        }
    }, {
        key: 'shouldIncludeRelation',
        value: function shouldIncludeRelation(relation) {
            if (this.includes === null) {
                return true;
            }

            return _lodash2.default.indexOf(this.includes, relation) > 0;
        }
    }, {
        key: 'shouldIncludeField',
        value: function shouldIncludeField(relation, field) {
            if (this.fields === null) {
                return true;
            }

            if (!this.fields.hasOwnProperty(relation)) {
                return true;
            }

            if (_lodash2.default.indexOf(this.fields[relation], field) !== -1) {
                return true;
            }

            return false;
        }
    }, {
        key: 'deserialize',
        value: function deserialize(data) {
            this.data = data;

            if (_lodash2.default.isArray(data.data)) {
                return this.deserializeCollection(data);
            }

            return this.deserializeOne(data.data);
        }
    }, {
        key: 'deserializeOne',
        value: function deserializeOne(data) {
            var _this = this;

            if (!data) return {};

            var formatted = {};
            formatted.id = data.id;
            formatted.type = data.type;

            if (data.links) {
                formatted.links = data.links;
            }

            if (data.meta) {
                formatted.meta = data.meta;
            }

            _lodash2.default.forOwn(data.attributes, function (value, key) {
                if (_this.shouldIncludeField(data.type, key)) {
                    formatted[key] = value;
                }
            });

            if (data.relationships) {
                formatted.relationships = [];

                for (var key in data.relationships) {
                    if (this.shouldIncludeRelation(key)) {
                        formatted.relationships.push(key);
                        var relationship = this.mapAndKillProps(data.relationships[key], {}, ['links', 'meta']).to;

                        if (_lodash2.default.isArray(data.relationships[key].data)) {
                            relationship.data_collection = true;
                            relationship.data = this.resolveRelationCollection(data.relationships[key].data);
                        } else if (data.relationships[key].data) {
                            relationship.data = this.resolveRelation(data.relationships[key].data);
                        }

                        formatted[key] = relationship;
                    }
                }
            }

            return formatted;
        }
    }, {
        key: 'deserializeCollection',
        value: function deserializeCollection(data) {
            var _this2 = this;

            data.data_collection = true;

            data.data = _lodash2.default.map(data.data, function (item) {
                return _this2.deserializeOne(item);
            });

            return data;
        }
    }, {
        key: 'resolveRelation',
        value: function resolveRelation(data) {
            return this.deserializeOne(_lodash2.default.find(this.data.included, data));
        }
    }, {
        key: 'resolveRelationCollection',
        value: function resolveRelationCollection(relations) {
            var _this3 = this;

            return _lodash2.default.map(relations, function (relation) {
                return _this3.resolveRelation(relation);
            });
        }
    }, {
        key: 'mapAndKillProps',
        value: function mapAndKillProps(from, to, props) {
            _lodash2.default.each(props, function (prop) {
                if (from.hasOwnProperty(prop)) {
                    to[prop] = from[prop];
                    delete from[prop];
                }
            });

            return { from: from, to: to };
        }
    }, {
        key: 'isSerializeableCollection',
        value: function isSerializeableCollection(data) {
            return data.hasOwnProperty('data_collection') && data.data_collection === true && _lodash2.default.isArray(data.data);
        }
    }, {
        key: 'serialize',
        value: function serialize(data) {
            this.includedData = [];
            var serialized = {};

            if (this.isSerializeableCollection(data)) {
                serialized = this.serializeCollection(data);
            } else {
                serialized.data = this.serializeOne(data);
            }

            if (this.includedData.length) {
                serialized.included = this.includedData;
            }

            return serialized;
        }
    }, {
        key: 'serializeOne',
        value: function serializeOne(data) {
            var _this4 = this;

            var serialized = {
                attributes: {},
                relationships: {}
            };

            var mapAndKilled = this.mapAndKillProps(data, serialized, ['id', 'type', 'links', 'meta']);

            data = mapAndKilled.from;
            serialized = mapAndKilled.to;

            if (data.hasOwnProperty('relationships')) {
                _lodash2.default.forEach(data.relationships, function (relationship) {
                    if (_this4.shouldIncludeRelation(relationship)) {
                        var relationshipData = _this4.mapAndKillProps(data[relationship], {}, ['links', 'meta']).to;

                        if (_this4.isSerializeableCollection(data[relationship])) {
                            relationshipData.data = _this4.serializeRelationshipCollection(data[relationship].data);
                        } else {
                            relationshipData.data = _this4.serializeRelationship(data[relationship].data);
                        }

                        serialized.relationships[relationship] = relationshipData;
                    }

                    delete data[relationship];
                });

                delete data.relationships;
            }

            _lodash2.default.forOwn(data, function (value, key) {
                if (_this4.shouldIncludeField(serialized.type, key)) {
                    serialized.attributes[key] = value;
                }
            });

            if (_lodash2.default.isEmpty(serialized.relationships)) {
                delete serialized.relationships;
            }

            return serialized;
        }
    }, {
        key: 'serializeCollection',
        value: function serializeCollection(data) {
            var _this5 = this;

            var mapAndKilled = this.mapAndKillProps(data, {}, ['links', 'meta']);

            data = mapAndKilled.from;
            var serialized = mapAndKilled.to;

            serialized.data = _lodash2.default.map(data.data, function (item) {
                return _this5.serializeOne(item);
            });

            return serialized;
        }
    }, {
        key: 'serializeRelationship',
        value: function serializeRelationship(data) {
            var serialized = this.serializeOne(data);
            this.addToIncludes(serialized);

            return { type: serialized.type, id: serialized.id };
        }
    }, {
        key: 'serializeRelationshipCollection',
        value: function serializeRelationshipCollection(data) {
            var _this6 = this;

            return _lodash2.default.map(data, function (item) {
                return _this6.serializeRelationship(item);
            });
        }
    }, {
        key: 'addToIncludes',
        value: function addToIncludes(data) {
            if (_lodash2.default.isUndefined(_lodash2.default.find(this.includedData, { id: data.id, type: data.type }))) {
                this.includedData.push(data);
            }
        }
    }]);

    return Formatter;
}();

exports.default = Formatter;