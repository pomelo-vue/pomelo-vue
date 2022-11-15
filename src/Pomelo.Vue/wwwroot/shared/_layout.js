Layout({
    style: true,
    data() {
        return {
            id: null,
            catalog: []
        }
    },
    created() {
        var self = this;
        return fetch('/contents/docs.json').then(function (result) {
            return result.text();
        }).then(function (result) {
            self.catalog = JSON.parse(result);
        });
    }
});