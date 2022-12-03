var Pomelo = (function (exports, options) {
    // Options
    var _options = {
        resolveModulesParallelly: true,
        mobile: function () {
            return window.innerWidth <= 768;
        },
        httpGet: function (url) {
            return fetch(url);
        },
        onNotFound: function (url, options) {
            if (url.indexOf('/404') == 0) {
                throw 'No not-found template found';
            }
            if (options) {
                return Redirect('/404?' + _serializeOptionsToUrl(options));
            } else {
                return Redirect('/404');
            }
        }
    };

    _combineObject(options, _options);

    // Common
    var _cache = {};

    var _css = {};

    function _httpCached(url) {
        return !!_cache[url];
    }

    function _httpGet(url) {
        if (_cache[url]) {
            return Promise.resolve(_cache[url]);
        }

        var _url = url;
        if (_options.version) {
            if (url.indexOf('?') > 0) {
                _url += "&";
            } else {
                _url += "?"
            }
            _url += "v=" + _options.version;
        }

        return _options.httpGet(_url).then(function (result) {
            if (result.status > 300 || result.status < 200) {
                return Promise.reject(result);
            }

            var txt = result.text();
            _cache[url] = txt;
            return Promise.resolve(txt);
        }).catch(function (err) {
            Promise.reject(err);
        });
    };

    function _httpExist(url) {
        return _httpGet(url)
            .then(function () {
                return Promise.resolve(true);
            })
            .catch(function () {
                return Promise.resolve(false);
            });
    };

    function _serializeOptionsToUrl(options) {
        var fields = Object.getOwnPropertyNames(options);
        var str = '';
        for (var i = 0; i < fields.length; ++i) {
            str += encodeURIComponent(fields[i]) + '=' + encodeURIComponent(options[fields[i]]) + '&';
        }

        if (str[str.length - 1] === '&') {
            str = str.substr(0, str.length - 1);
        }

        return str;
    }

    var _root = null;
    function root() {
        return _root;
    };
    var _rules = {};
    // Fetch route rules
    var _loadRoutePromise = _httpGet('/shared/_routes.json').then(function (rules) {
        _rules = JSON.parse(rules);
    }).catch(err => {
        console.error('No route provided. Please prepare /shared/_routes.json file and try again.');
    });


    // Internal
    function _combineObject(src, dest) {
        if (!src) {
            return;
        }

        var fields = Object.getOwnPropertyNames(src);
        for (var i = 0; i < fields.length; ++i) {
            dest[fields[i]] = src[fields[i]];
        }
    };

    function _parseQueryString(dest) {
        if (!window.location.search) {
            return;
        }

        var str = window.location.search;
        if (str[0] == '?') {
            str = str.substr(1);
        }

        var splited = str.split('&');
        for (var i = 0; i < splited.length; ++i) {
            var splited2 = splited[i].split('=');
            var key = decodeURIComponent(splited2[0]);
            var val = decodeURIComponent(splited2[1]);
            _fillObjectField(key, val, dest);
        }
    }

    function _resolveModules(modules) {
        if (!modules) {
            return Promise.resolve();
        }

        if (_options.resolveModulesParallelly) {
            var promises = [];
            for (var i = 0; i < modules.length; ++i) {
                promises.push(LoadScript(modules[i]));
            }

            return Promise.all(promises);
        } else {
            var promise = Promise.resolve(null);
            var makeFunc = function (module) {
                return function (result) {
                    return LoadScript(module);
                };
            };
            for (var i = 0; i < modules.length; ++i) {
                var m = modules[i];
                promise = promise.then(makeFunc(m));
            }
            return promise;
        }
    }

    function _buildApp(url, params, mobile, parent) {
        var componentObject;
        return _httpGet(url + '.js')
            .then(function (js) {
                var Page = function (options) {
                    componentObject = options;
                };
                eval(js);
                hookMountedAndUnmounted(componentObject, url + (mobile ? '.m' : ''));
                return _resolveModules(componentObject.modules).then(function () {
                    return Promise.resolve(componentObject)
                });
            })
            .then(function (component) {
                var promise = null;
                if (mobile) {
                    promise = _httpExist(url + '.m.html').then(function (res) {
                        return _httpGet(url + (res ? '.m.html' : '.html'));
                    });
                } else {
                    promise = _httpGet(url + '.html');
                }

                return promise.then(function (template) {
                    component.template = template;
                    return Promise.resolve(component);
                });
            })
            .then(function (component) {
                // Hook setup()
                var setup = component.setup;
                component.setup = function (props, context) {
                    if (typeof setup == 'function') {
                        setup(props, context);
                    }
                    var instance = Vue.getCurrentInstance();
                    instance.$parent = parent || Pomelo.root();
                    instance.$root = Pomelo.root() || parent;
                    instance.$view = url;
                    _attachContainer(instance);
                }

                // Hook data()
                var originalDataFunc = component.data || function () {
                    return {};
                };
                component.data = function () {
                    var data = originalDataFunc();
                    _combineObject(params, data);
                    _parseQueryString(data);
                    return data;
                };

                // Create instance
                return _resolveModules(component.modules).then(function () {
                    var components = component.components || [];
                    return _loadComponents(components).then(function (components) {
                        var ret = Vue.createApp(component);

                        for (var i = 0; i < components.length; ++i) {
                            var com = components[i];
                            ret.component(com.name, com.options);
                        }

                        var originalMountFunc = ret.mount || function () { };
                        ret.mount = function (el) {
                            ret.proxy = originalMountFunc(el);
                            return ret.proxy;
                        }

                        return Promise.resolve(ret);
                    });
                });
            });
    };

    function _replace(source, find, replace) {
        var idx = source.indexOf(find);
        if (idx < 0) {
            return source;
        }

        var ret = source.substr(0, idx) + replace + source.substr(idx + find.length);
        return ret;
    }

    function _attachContainer(instance) {
        if (!instance) {
            console.warn('Invalid view model');
        }

        if (!instance.$containers) {
            instance.$containers = [];
        }

        if (!instance.$containers) {
            instance.$containers = [];
        }

        var containers = instance.$containers;
        instance.$container = function (el) {
            var container = {
                element: document.querySelector(el),
                selector: el,
                open: function (url, params) {
                    var mobile = _options.mobile();
                    var currentProxy = null;
                    if (instance.proxy) {
                        currentProxy = instance.proxy;
                    }
                    if (instance.$ && instance.$.proxy) {
                        currentProxy = instance.$.proxy;
                    }

                    this.close();

                    var self = this;

                    params = generateParametersFromRoute(params);
                    _parseQueryString(params);
                    return _buildApp(url, params, mobile, currentProxy).then(function (result) {
                        self.active = result;
                        self.active = self.active.mount(self.selector);
                        return Promise.resolve(self.active);
                    });
                },
                close: function (recurse = true) {
                    function liftClose(container) {
                        if (container.active && container.active.$) {
                            if (recurse) {
                                for (var i = 0; i < container.active.$containers.length; ++i) {
                                    liftClose(container.active.$containers[i]);
                                }
                            }
                            container.active.$.appContext.app.unmount();
                        }
                    }

                    liftClose(this);
                },
                active: null
            };
            containers.push(container);
            return container;
        };
    };

    function Root(options, el, layout) {
        options = options || {};
        if (typeof options.setup != "function") {
            options.setup = function () { };
        }

        var originalSetup = options.setup;
        options.setup = function () {
            originalSetup();
            var instance = Vue.getCurrentInstance();
            instance.$parent = parent || Pomelo.root();
            instance.$root = Pomelo.root() || parent;
            instance.$onUpdating = options.onUpdating;
            if (layout) {
                instance.$layout = layout;
                instance.$view = layout;
            }
            _attachContainer(instance);
        };
        return _resolveModules(options.modules).then(function () {
            return _loadComponents(options.components || []).then(function (components) {
                var app = Vue.createApp(options || {});
                for (var i = 0; i < components.length; ++i) {
                    var com = components[i];
                    app.component(com.name, com.options);
                }

                _root = app.mount(el);
                _root.$.proxy = _root;
            });
        });
    }

    function SetOptions(options) {
        _combineObject(options, _options);
    }

    function Route(rule, view) {
        _rules[rule] = view;
    }

    function ForceUpdate(proxy = Pomelo.root()) {
        if (!proxy) return;
        proxy.$forceUpdate();
        if (proxy.$containers) {
            for (var i = 0; i < proxy.$containers.length; ++i) {
                if (proxy.$containers[i].active) {
                    ForceUpdate(proxy.$containers[i].active);
                }
            }
        }
    }

    function MatchRoute() {
        function replaceAll(str, s1, s2) {
            return str.replace(new RegExp(s1, "g"), s2);
        };

        function matchAll(src) {
            var ruleRegex = new RegExp("{((?!/).)*}", "g");
            var ret = [];
            while (true) {
                var match = ruleRegex.exec(src);
                if (match == null) {
                    break;
                }

                ret.push({
                    value: match[0],
                    groups: match.slice(1)
                });
            }
            return ret;
        }

        function unwrapBrackets(src) {
            if (src[0] === '{') {
                return src.substr(1, src.length - 2);
            } else {
                return src;
            }
        }

        var keys = Object.getOwnPropertyNames(_rules);
        for (var i = 0; i < keys.length; ++i) {
            var rule = keys[i];
            var view = _rules[keys[i]];
            var matches = matchAll(rule);
            var params = [];
            for (var j = 0; j < matches.length; ++j) {
                var param = matches[j];
                var k = unwrapBrackets(param.value);
                regex = '(.*)';
                if (param.value.indexOf(':') > 0) {
                    regex = param.value.substr(param.value.indexOf(':') + 1)
                    regex = regex.substr(0, regex.length - 1);
                    params.push(k.substr(0, k.indexOf(':')));
                } else {
                    params.push(k);
                }
                rule = _replace(rule, param.value, regex);
            }

            var parsedReg = new RegExp('^' + rule + '$');
            var matches = parsedReg.exec(window.location.pathname)
            if (matches) {
                var ret = {
                    view: view,
                    params: []
                };

                var values = matches.slice(1).map(function (x) { return decodeURIComponent(x); });
                for (var j = 0; j < Math.min(params.length, values.length); ++j) {
                    ret.params.push({ key: params[j], value: values[j] });
                }

                return ret;
            }
        }

        return null;
    }

    function _fillObjectField(param, value, dest) {
        if (!dest) {
            return;
        }

        var splited = param.split('.');
        for (var i = 0; i < splited.length - 1; ++i) {
            if (!dest[splited[i]]) {
                dest[splited[i]] = {}
            }
            dest = dest[splited[i]];
        }
        dest[splited[splited.length - 1]] = value;
    }

    function _applyLayoutHtml(layout) {
        return _httpGet(layout + (_options.mobile() ? '.m.html' : '.html')).then(function (layoutHtml) {
            var htmlBeginTagIndex = layoutHtml.indexOf('<html');
            var htmlBeginTagIndex2 = layoutHtml.indexOf('>', htmlBeginTagIndex);
            layoutHtml = layoutHtml.substr(htmlBeginTagIndex2 + 1);
            var htmlEndTagIndex = layoutHtml.lastIndexOf('</html>');
            layoutHtml = layoutHtml.substr(0, htmlEndTagIndex);
            document.querySelector('html').innerHTML = layoutHtml;

            var ticks = new Date().getTime();
            var appId = 'pomelo-' + ticks;
            document.querySelector('body').innerHTML = '<div id="' + appId + '">' + document.querySelector('body').innerHTML + '</div>';

            return Promise.resolve(appId);
        })
    }

    function generateParametersFromRoute(params = {}) {
        var route = null;
        route = Pomelo.MatchRoute();
        if (route == null) {
            try {
                _options.onNotFound(window.location.pathname + window.location.search);
            } catch (ex) {
                console.error(ex);
                console.error("No available route found.");
                return Promise.reject("No available route found.");
            }
        }

        for (var i = 0; i < route.params.length; ++i) {
            var param = route.params[i];
            _fillObjectField(param.key, param.value, params);
        }

        return params;
    }

    function appendCssReference(view, style) {
        if (typeof style == 'boolean') {
            var href = view + '.css';
            if (_options.version) {
                href += '?v=' + _options.version;
            }
            internalAppendCssReference(view, href);
        } else if (typeof style == 'string') {
            var href = style;
            if (href == '@') {
            }
            if (_options.version) {
                if (href.indexOf('>') < 0) {
                    href += '?v=' + _options.version;
                } else {
                    href += '&v=' + _options.version;
                }
            }
            internalAppendCssReference(view, href);
        } else if (style instanceof Array) {
            for (var i = 0; i < style.length; ++i) {
                if (typeof style[i] != 'string') {
                    continue;
                }
                var href = style[i];
                if (href == '@') {
                    href = view + '.css';
                }
                if (_options.version) {
                    if (href.indexOf('>') < 0) {
                        href += '?v=' + _options.version;
                    } else {
                        href += '&v=' + _options.version;
                    }
                }
                internalAppendCssReference(view, href);
            }
        } else {
            throw 'style type not supported'
        }
    }

    function internalAppendCssReference(viewName, href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.setAttribute('data-style', viewName)
        link.href = href;
        try {
            document.querySelector('head').appendChild(link);
        } catch (ex) { }
    }

    function removeCssReference(view) {
        var dom = document.querySelectorAll('link[data-style="' + view + '"]');
        if (dom && dom.length) {
            for (var i = 0; i < dom.length; ++i) {
                dom[i].remove();
            }
        }
    }

    function hookMountedAndUnmounted(options, view) {
        if (!options) {
            return;
        }

        if (!options.mounted) {
            options.mounted = function () { };
        }

        if (!options.unmounted) {
            options.unmounted = function () { };
        }

        if (options.style) {
            var originalMounted = options.mounted;
            options.mounted = function () {
                if (!_css[view]) {
                    _css[view] = 0;
                }
                if (_css[view] == 0) {
                    appendCssReference(view, options.style);
                }
                ++_css[view];
                return originalMounted.call(this);
            };

            var originalUnmounted = options.unmounted;
            options.unmounted = function () {
                if (!_css[view]) {
                    return;
                }

                --_css[view];
                if (_css[view] <= 0) {
                    removeCssReference(view);
                    delete _css[view];
                }
                return originalUnmounted.call(this);
            };
        }
    }

    function UpdateLayout() {
        var mobile = _options.mobile();
        var params = {};
        var route = null;
        var layout = _options.layout;

        route = Pomelo.MatchRoute();
        params = generateParametersFromRoute();

        var _def;
        var viewName = route.view + (_options.mobile() ? '.m' : '');
        return _httpGet(route.view + '.js').then(function (def) {
            _def = def;
            var modules = null;
            var _opt;
            var Page = function (options) {
                _opt = options;
                layout = options.layout || layout;
                modules = options.modules;
            };
            def = eval(def);
            hookMountedAndUnmounted(_opt, viewName);
            return _resolveModules(modules);
        }).then(function () {
            if (Pomelo.root() && Pomelo.root().$layout) {
                if (Pomelo.root().$layout === layout) {
                    _parseQueryString(params);
                    var fields = Object.getOwnPropertyNames(params);
                    for (var i = 0; i < fields.length; ++i) {
                        var val = params[fields[i]];
                        Pomelo.root()[fields[i]] = val;
                    }

                    Pomelo.root().$containers[0].open(route.view, params);
                    var promise = Promise.resolve();
                    if (typeof Pomelo.root().$.$onUpdating == 'function') {
                        var result = Pomelo.root().$.$onUpdating.call(Pomelo.root());
                        if (result instanceof Promise) {
                            promise = result;
                        }
                    }
                    return promise;
                }

                Pomelo.root().$.appContext.app.unmount();
            }

            if (layout) {
                var layoutName = layout + (mobile ? '.m' : '');
                return _httpGet(layoutName + '.html').then(function (layoutHtml) {
                    var htmlBeginTagIndex = layoutHtml.indexOf('<html');
                    var htmlBeginTagIndex2 = layoutHtml.indexOf('>', htmlBeginTagIndex);
                    layoutHtml = layoutHtml.substr(htmlBeginTagIndex2 + 1);
                    var htmlEndTagIndex = layoutHtml.lastIndexOf('</html>');
                    layoutHtml = layoutHtml.substr(0, htmlEndTagIndex);
                    document.querySelector('html').innerHTML = layoutHtml;

                    return _httpGet(layout + ".js");
                }).then(function (js) {
                    var _opt = null;
                    var Layout = function (options) {
                        _opt = options;
                    };
                    var LayoutNext = function (options) {
                        // Hook data()
                        if (!options.data) {
                            options.data = function () {
                                return {};
                            };
                        }

                        var dataFunc = options.data;
                        options.data = function () {
                            var data = dataFunc.call(this);
                            _combineObject(params, data);
                            _parseQueryString(data);
                            return data;
                        }

                        var ticks = new Date().getTime();
                        var appId = 'pomelo-' + ticks;
                        var containerId = 'container-' + ticks;
                        document.querySelector('body').innerHTML = '<div id="' + appId + '">' + document.querySelector('body').innerHTML.replace('<render-body></render-body>', '<div id="' + containerId + '"></div>') + '</div>'

                        // Hook mounted
                        if (!options.mounted) {
                            options.mounted = function () { };
                        }

                        mountedFunc = options.mounted;
                        options.mounted = function () {
                            var container = this.$container('#' + containerId);
                            container.open(route.view, params);
                            return mountedFunc.call(this);
                        };

                        Root(options, '#' + appId, layout);
                    };

                    eval(js);
                    hookMountedAndUnmounted(_opt, layoutName);
                    return _resolveModules(_opt.modules).then(function () {
                        LayoutNext(_opt);
                        return Promise.resolve();
                    });
                });
            } else {
                var viewName = route.view + (_options.mobile() ? '.m' : '');
                return _applyLayoutHtml(route.view).then((appId) => {
                    var _opt = null;
                    var components = null;
                    var Page = function (options) {
                        _opt = options;
                    };
                    var PageNext = function (options) {
                        modules = options.modules;
                        components = options.components || [];
                        Root(options, '#' + appId, layout);
                    };
                    eval(_def);
                    if (!_opt.data) {
                        _opt.data = function () {
                            return {};
                        };
                    }
                    var dataFunc = _opt.data;
                    _opt.data = function () {
                        var data = dataFunc.call(this);
                        _combineObject(params, data);
                        _parseQueryString(data);
                        return data;
                    }
                    hookMountedAndUnmounted(_opt, viewName);
                    return _resolveModules(_opt.modules).then(function () {
                        PageNext(_opt);
                        return Promise.resolve();
                    });
                });
            }
        }).then(function () {
            ForceUpdate();
        }).catch(function (err) {
            console.error(err);
        })
    };

    function Redirect(url) {
        var title = null;
        var titleTag = document.querySelector('title');
        if (titleTag) {
            title = titleTag.innerText;
        }
        window.history.pushState(null, title, url);
        UpdateLayout();
    }

    // Layout
    (function () {
        var ie = !!(window.attachEvent && !window.opera);
        var wk = navigator.userAgent.indexOf('webkit') >= 0 && (RegExp.$1 < 525);
        var fn = [];
        var run = function () {
            for (var i = 0; i < fn.length; i++) fn[i]();
        };
        var d = document;
        var documentReady = function (f) {
            if (!ie && !wk && d.addEventListener)
                return d.addEventListener('DOMContentLoaded', f, false);
            if (fn.push(f) > 1) return;
            if (ie) (function () {
                try {
                    d.documentElement.doScroll('left');
                    run();
                }
                catch (err) {
                    setTimeout(arguments.callee, 0);
                }
            }
            )();
            else if (wk)
                var t = setInterval(function () {
                    if (/^(loaded|complete)$/.test(d.readyState))
                        clearInterval(t), run();
                }, 0);
        };

        documentReady(function () {
            function parseHref(el) {
                if (!el) {
                    return null;
                }

                if (!el.getAttribute) {
                    return null;
                }

                var target = el.getAttribute('target') || '_self';
                var staticAttribute = el.getAttribute('static-link') || el.getAttribute('v-static') || el.getAttribute('pomelo-static');

                if (staticAttribute == null
                    && target.toLowerCase() == '_self'
                    && el.tagName.toLowerCase() == "a") {
                    return el.getAttribute('href');
                }

                return parseHref(el.parentNode);
            }

            window.addEventListener('click', function (e) {
                if (!e) return;
                var href = parseHref(e.target);
                if (href) {
                    Pomelo.Redirect(href);
                    e.preventDefault();
                    return;
                }
            });

            window.onpopstate = function () {
                UpdateLayout();
            };

            _loadRoutePromise.then(() => {
                return UpdateLayout();
            });
        });
    })();

    function LoadScript(url) {
        if (_httpCached(url)) {
            with (window) {
                eval(_cache[url]);
            }
            return Promise.resolve();
        }

        return _httpGet(url).then(function (js) {
            with (window) {
                eval(js);
            }
            _cache[url] = js;
            return Promise.resolve();
        }).catch(err => {
            console.error('Load module ' + url + ' failed.');
            console.error(err);
        });
    }

    function _loadComponents(components) {
        var ret = [];
        return Promise.all(components.map(function (c) {
            var _html;
            var _opt;
            var _name;
            return _httpGet(c + ".html").then(function (comHtml) {
                _html = comHtml;
                return _httpGet(c + ".js");
            }).then(function (comJs) {
                var Component = function (name, options) {
                    _opt = options;
                    _name = name;
                };
                eval(comJs);
                hookMountedAndUnmounted(_opt, c);
                _opt.template = _html;
                var p = _resolveModules(_opt.modules);
                return p;
            }).then(function () {
                ret.push({ name: _name, options: _opt });
                return Promise.resolve();
            })
        })).then(function () {
            return ret;
        });
    }

    exports.root = root;
    exports.Root = Root;
    exports.SetOptions = SetOptions;
    exports.Route = Route;
    exports.MatchRoute = MatchRoute;
    exports.UpdateLayout = UpdateLayout;
    exports.Redirect = Redirect;
    exports.LoadScript = LoadScript;
    exports.ForceUpdate = ForceUpdate;

    return exports;
})(typeof exports == 'undefined' ? {} : exports, window.PomeloVueOptions || {});
