"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var Formatter = /*#__PURE__*/function () {
  function Formatter() {
    _classCallCheck(this, Formatter);

    this.data = {};
    this.includes = null;
    this.fields = null;
    this.includedData = [];
  }

  _createClass(Formatter, [{
    key: "includeOnly",
    value: function includeOnly() {
      var includes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      this.includes = includes;
      return this;
    }
  }, {
    key: "filterFields",
    value: function filterFields() {
      var fields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.fields = fields;
      return this;
    }
  }, {
    key: "shouldIncludeRelation",
    value: function shouldIncludeRelation(relation) {
      if (this.includes === null) {
        return true;
      }

      return (0, _lodash.indexOf)(this.includes, relation) !== -1;
    }
  }, {
    key: "shouldIncludeField",
    value: function shouldIncludeField(relation, field) {
      if (this.fields === null) {
        return true;
      }

      if (!Object.prototype.hasOwnProperty.call(this.fields, relation)) {
        return true;
      }

      if ((0, _lodash.indexOf)(this.fields[relation], field) !== -1) {
        return true;
      }

      return false;
    }
  }, {
    key: "deserialize",
    value: function deserialize(data) {
      this.data = data;

      if ((0, _lodash.isArray)(data.data)) {
        return this.deserializeCollection(data);
      }

      return this.deserializeOne(data.data);
    }
  }, {
    key: "deserializeOne",
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

      (0, _lodash.forOwn)(data.attributes, function (value, key) {
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

            if ((0, _lodash.isArray)(data.relationships[key].data)) {
              relationship.data = data.relationships[key].data ? this.resolveRelationCollection(data.relationships[key].data) : [];
            } else {
              relationship.data = data.relationships[key].data ? this.resolveRelation(data.relationships[key].data) : null;
            }

            formatted[key] = relationship;
          }
        }
      }

      return formatted;
    }
  }, {
    key: "deserializeCollection",
    value: function deserializeCollection(data) {
      var _this2 = this;

      data.data = (0, _lodash.map)(data.data, function (item) {
        return _this2.deserializeOne(item);
      });
      return data;
    }
  }, {
    key: "resolveRelation",
    value: function resolveRelation(data) {
      return this.deserializeOne((0, _lodash.find)(this.data.included, data));
    }
  }, {
    key: "resolveRelationCollection",
    value: function resolveRelationCollection(relations) {
      var _this3 = this;

      return (0, _lodash.map)(relations, function (relation) {
        return _this3.resolveRelation(relation);
      });
    }
  }, {
    key: "mapAndKillProps",
    value: function mapAndKillProps(from, to, props) {
      (0, _lodash.each)(props, function (prop) {
        if (Object.prototype.hasOwnProperty.call(from, prop)) {
          to[prop] = from[prop];
          delete from[prop];
        }
      });
      return {
        from: from,
        to: to
      };
    }
  }, {
    key: "isSerializeableCollection",
    value: function isSerializeableCollection(data) {
      return Object.prototype.hasOwnProperty.call(data, 'data') && (0, _lodash.isArray)(data.data);
    }
  }, {
    key: "serialize",
    value: function serialize(data) {
      this.includedData = [];
      var serialized = {};

      if (Object.prototype.hasOwnProperty.call(data, 'relationships')) {
        serialized.included = [];
      }

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
    key: "serializeOne",
    value: function serializeOne(data) {
      var _this4 = this;

      var serialized = {
        attributes: {},
        relationships: {}
      };
      var mapAndKilled = this.mapAndKillProps(data, serialized, ['id', 'type', 'links', 'meta']);
      data = mapAndKilled.from;
      serialized = mapAndKilled.to;

      if (Object.prototype.hasOwnProperty.call(data, 'relationships')) {
        (0, _lodash.forEach)(data.relationships, function (relationship) {
          if (_this4.shouldIncludeRelation(relationship)) {
            var relationshipData = _this4.mapAndKillProps(data[relationship], {}, ['links', 'meta']).to;

            if (_this4.isSerializeableCollection(data[relationship])) {
              relationshipData.data = _this4.serializeRelationshipCollection(data[relationship].data);
            } else {
              relationshipData.data = data[relationship].data === null ? null : _this4.serializeRelationship(data[relationship].data);
            }

            serialized.relationships[relationship] = relationshipData;
          }

          delete data[relationship];
        });
        delete data.relationships;
      }

      (0, _lodash.forOwn)(data, function (value, key) {
        if (_this4.shouldIncludeField(serialized.type, key)) {
          serialized.attributes[key] = value;
        }
      });

      if ((0, _lodash.isEmpty)(serialized.relationships)) {
        delete serialized.relationships;
      }

      return serialized;
    }
  }, {
    key: "serializeCollection",
    value: function serializeCollection(data) {
      var _this5 = this;

      var mapAndKilled = this.mapAndKillProps(data, {}, ['links', 'meta']);
      data = mapAndKilled.from;
      var serialized = mapAndKilled.to;
      serialized.data = (0, _lodash.map)(data.data, function (item) {
        return _this5.serializeOne(item);
      });
      return serialized;
    }
  }, {
    key: "serializeRelationship",
    value: function serializeRelationship(data) {
      var serialized = this.serializeOne(data);
      this.addToIncludes(serialized);
      return {
        type: serialized.type,
        id: serialized.id
      };
    }
  }, {
    key: "serializeRelationshipCollection",
    value: function serializeRelationshipCollection(data) {
      var _this6 = this;

      return (0, _lodash.map)(data, function (item) {
        return _this6.serializeRelationship(item);
      });
    }
  }, {
    key: "addToIncludes",
    value: function addToIncludes(data) {
      if ((0, _lodash.isUndefined)((0, _lodash.find)(this.includedData, {
        id: data.id,
        type: data.type
      }))) {
        this.includedData.push(data);
      }
    }
  }]);

  return Formatter;
}();

exports["default"] = Formatter;