Page({
    layout: '/shared/_layout',
    components: [
        "/components/render-markdown"
    ],
    data() {
        return {
            id: null,
            content: null
        }
    },
    created() {
        var self = this;
        var _result;

        if (!this.id) {
            this.id = 'introduction';
        }

        return fetch('/contents/' + this.id + '.md').then(function (result) {
            return result.text();
        }).then(function (result) {
            _result = result;
            self.content = _result;
        });
    },
    mounted() {
        this.$root.id = this.id;
        _httpGet('/assets/fuck/a.css').catch(function () { });
    }
});