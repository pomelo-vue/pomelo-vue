var Pomelo = (function (exports, options) {
    // Options
    var _options = {
        mobile: function () {
            return window.innerWidth <= 768;
        },
        httpGet: function (url) {
            return fetch(url);
        },
        onNotFound: function (url, options) {
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
    function _httpCached(url) {
        return !!_cache[url];
    }

    function _httpGet(url) {
        if (_cache[url]) {
            return Promise.resolve(_cache[url]);
        }

        return _options.httpGet(url).then(function (result) {
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

        var promises = [];
        for (var i = 0; i < modules.length; ++i) {
            promises.push(LoadScript(modules[i]));
        }

        return Promise.all(promises);
    }

    function _buildComponent(url, params, mobile, parent) {
        var componentObject;
        return _httpGet(url + '.js')
            .then(function (js) {
                var Page = function (options) {
                    componentObject = options;
                };
                eval(js);
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
                    instance.$parent = parent || Pomelo._root;
                    instance.$root = Pomelo._root || parent;
                    _attachContainer(instance);
                }

                // Hook data()
                var originalDataFunc = component.data;
                component.data = function () {
                    var data = originalDataFunc();
                    _combineObject(params, data);
                    _parseQueryString(data);
                    return data;
                };

                // Create instance
                var ret = Vue.createApp(component);
                var components = component.components || [];
                var p = _loadComponents(components, ret);
                var originalMountFunc = ret.mount;
                ret.mount = function (el) {
                    ret.proxy = originalMountFunc(el);
                    return ret.proxy;
                }
                return p.then(function () {
                    return Promise.resolve(ret);
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

                    _parseQueryString(params);
                    return _buildComponent(url, params, mobile, currentProxy).then(function (result) {
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
            instance.$parent = parent || Pomelo._root;
            instance.$root = Pomelo._root || parent;
            if (layout) {
                instance.$layout = layout;
            }
            _attachContainer(instance);
        };
        var app = Vue.createApp(options || {});
        return _loadComponents(options.components || [], app).then(function () {
            _root = app.mount(el);
            _root.$.proxy = _root;
        });
    }

    function SetOptions(options) {
        _combineObject(options, _options);
    }

    function Route(rule, view) {
        _rules[rule] = view;
    }

    function ForceUpdate(proxy = Pomelo.root()) {
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
                rule = _replace(rule, param.value, '(' + regex + ')');
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

    function UpdateLayout() {
        var mobile = _options.mobile();
        var params = {};
        var route = null;
        var layout = _options.layout;

        route = Pomelo.MatchRoute();
        if (route == null) {
            try {
                _options.onNotFound(url);
            } catch (ex) {
                console.error("No available route found.");
                return Promise.reject("No available route found.");
            }
        }

        for (var i = 0; i < route.params.length; ++i) {
            var param = route.params[i];
            _fillObjectField(param.key, param.value, params);
        }

        var _def;
        return _httpGet(route.view + '.js').then(function (def) {
            _def = def;
            var modules = null;
            var Page = function (options) {
                layout = options.layout || layout;
                modules = options.modules;
            };
            def = eval(def);
            return _resolveModules(modules);
        }).then(function () {
            if (Pomelo.root()) {
                if (Pomelo.root().$layout === layout) {
                    _parseQueryString(params);
                    var fields = Object.getOwnPropertyNames(params);
                    for (var i = 0; i < fields.length; ++i) {
                        var val = params[fields[i]];
                        Pomelo.root()[fields[i]] = val;
                    }

                    Pomelo.root().$containers[0].open(route.view, params);
                    return Promise.resolve();
                }

                Pomelo.root().$.appContext.app.unmount();
            }

            if (layout) {
                return _httpGet(layout + (mobile ? '.m.html' : '.html')).then(function (layoutHtml) {
                    var htmlBeginTagIndex = layoutHtml.indexOf('<html');
                    var htmlBeginTagIndex2 = layoutHtml.indexOf('>', htmlBeginTagIndex);
                    layoutHtml = layoutHtml.substr(htmlBeginTagIndex2 + 1);
                    var htmlEndTagIndex = layoutHtml.lastIndexOf('</html>');
                    layoutHtml = layoutHtml.substr(0, htmlEndTagIndex);
                    document.querySelector('html').innerHTML = layoutHtml;

                    return _httpGet(layout + ".js");
                }).then(function (js) {
                    var modules = null;
                    var Layout = function (options) {
                        modules = options.modules;

                        // Hook data()
                        if (!options.data) {
                            options.data = function () {
                                return {};
                            };
                        }

                        var dataFunc = options.data;
                        options.data = function () {
                            var data = dataFunc();
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
                            return mountedFunc();
                        };

                        Root(options, '#' + appId, layout);
                    };

                    eval(js);
                    return _resolveModules(modules);
                });
            } else {
                return _applyLayoutHtml(route.view).then((appId) => {
                    var modules = null;
                    var components = null;
                    var Page = function (options) {
                        modules = options.modules;
                        components = options.components || [];
                        Root(options, '#' + appId, layout);
                    };
                    eval(_def);
                    return _resolveModules(modules);
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

                if (el.getAttribute('static-link') == null && el.tagName.toUpperCase() == "A") {
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
            return Promise.resolve();
        }

        return _httpGet(url).then(function (js) {
            eval(js);
            return Promise.resolve();
        })
    }

    function _loadComponents(components, app) {
        return Promise.all(components.map(function (c) {
            var html;
            return _httpGet(c + ".html").then(function (comHtml) {
                html = comHtml;
                return _httpGet(c + ".js");
            }).then(function (comJs) {
                var _options;
                var _name;
                var Component = function (name, options) {
                    _options = options;
                    _name = name;
                };
                eval(comJs);
                _options.template = html;
                var p = _resolveModules(_options.modules);
                app.component(_name, _options);
                return p;
            });
        }));
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
})({}, window.PueOptions || {});