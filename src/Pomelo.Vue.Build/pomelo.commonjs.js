if (window.Pomelo) {
    Pomelo.Module = {};
}

var PomeloModule = (function (exports) {
    if (exports.module) {
        return;
    }

    var _cache = {};
    var _alias = {};

    function _httpGetSync(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('get', url, false);
        xhr.send();
        return xhr.responseText;
    }

    var module = {
        require(script) {
            var url = script;
            if (_alias[url]) {
                url = _alias[url];
            }

            if (!_cache[url]) {
                _cache[url] = _httpGetSync(url);
            }

            var js = _cache[url];

            var module = {
                exports: {}
            };
            with (module) {
                var require = module.require;
                eval(js);
                return exports;
            }

            return module.exports;
        },
        alias(url, alias) {
            _alias[alias] = url;
        }
    };

    exports.require = module.require;
    exports.alias = module.alias;

    return exports;

})(window);