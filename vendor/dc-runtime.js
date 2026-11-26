/* Minimal runtime for the Design Component template format, built on Preact.
   Supports {{ holes }}, <sc-for list as>, <sc-if value>, event attributes and refs. */
(function () {
  var h = preact.h, Fragment = preact.Fragment;
  var FULL = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    var parts = path.split('.'), v, found = false;
    for (var s = scope; s; s = s.parent) {
      if (Object.prototype.hasOwnProperty.call(s.vars, parts[0])) { v = s.vars[parts[0]]; found = true; break; }
    }
    if (!found) return undefined;
    for (var i = 1; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function attrValue(raw, scope) {
    var m = raw.match(FULL);
    return m ? lookup(m[1], scope) : interp(raw, scope);
  }

  function compile(node) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (!t.trim()) return t.indexOf('\n') >= 0 ? null : { t: 'text', v: ' ' };
      return { t: 'text', v: t.replace(/\s+/g, ' ') };
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    var kids = [];
    var src = tag === 'template' ? node.content.childNodes : node.childNodes;
    for (var i = 0; i < src.length; i++) { var c = compile(src[i]); if (c) kids.push(c); }
    if (tag === 'sc-for') return { t: 'for', list: node.getAttribute('list'), as: node.getAttribute('as') || 'item', kids: kids };
    if (tag === 'sc-if') return { t: 'if', value: node.getAttribute('value'), kids: kids };
    var attrs = [];
    for (var j = 0; j < node.attributes.length; j++) {
      var a = node.attributes[j];
      if (a.name.indexOf('hint-') === 0) continue;
      attrs.push({ n: a.name, v: a.value });
    }
    return { t: 'el', tag: tag, attrs: attrs, kids: kids };
  }

  function renderList(nodes, scope) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) out.push(renderNode(nodes[i], scope));
    return out;
  }
  function renderNode(n, scope) {
    if (n.t === 'text') return n.v.indexOf('{{') >= 0 ? interp(n.v, scope) : n.v;
    if (n.t === 'if') return attrValue(n.value, scope) ? h(Fragment, null, renderList(n.kids, scope)) : null;
    if (n.t === 'for') {
      var list = attrValue(n.list, scope) || [];
      return h(Fragment, null, list.map(function (item, idx) {
        var vars = { $index: idx }; vars[n.as] = item;
        return h(Fragment, { key: idx }, renderList(n.kids, { vars: vars, parent: scope }));
      }));
    }
    var props = {};
    for (var i = 0; i < n.attrs.length; i++) {
      var a = n.attrs[i], v = attrValue(a.v, scope);
      if ((v === 'true' || v === 'false') && !/^(aria|data)-/.test(a.n)) v = v === 'true';
      if (a.n.indexOf('on') === 0 && typeof v !== 'function') continue;
      props[a.n] = v;
    }
    return h(n.tag, props, renderList(n.kids, scope));
  }

  window.DCLogic = class extends preact.Component {
    constructor(props) { super(props); this.state = {}; }
    render() { return renderList(window.DCLogic.tree, { vars: this.renderVals() || {}, parent: null }); }
  };
  window.DCMount = function (Component, tplEl, mountEl) {
    var root = compile(tplEl);
    window.DCLogic.tree = root.kids;
    preact.render(h(Component, {}), mountEl);
  };
})();
